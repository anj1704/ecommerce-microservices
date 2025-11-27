import os
import json
import logging
import time
from datetime import datetime
from collections import defaultdict
from google.cloud import pubsub_v1
from flask import Flask, request
import threading

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
PROJECT_ID = os.getenv("GCP_PROJECT_ID")
INPUT_SUBSCRIPTION = os.getenv("INPUT_SUBSCRIPTION", "order-events-processor-sub")
OUTPUT_TOPIC = os.getenv("OUTPUT_TOPIC", "analytics-results")
WINDOW_SIZE_SECONDS = int(os.getenv("WINDOW_SIZE_SECONDS", "60"))

# In-memory windowing (1-minute tumbling windows)
order_windows = defaultdict(
    lambda: {"orders": [], "window_start": None, "lock": threading.Lock()}
)
windows_lock = threading.Lock()

publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(PROJECT_ID, OUTPUT_TOPIC)


def close_expired_windows():
    """Check for and close any windows that are effectively done."""
    current_time = int(time.time())
    current_window_key = current_time // WINDOW_SIZE_SECONDS

    # Find windows older than the current active one
    with windows_lock:
        windows_to_close = [
            key for key in order_windows.keys() if key < current_window_key
        ]

    # Process them
    for window_key in windows_to_close:
        close_window(window_key)


def process_order(order_data):
    """Process incoming order and aggregate by time window"""
    timestamp = order_data.get("timestamp", int(time.time()))

    # Determine which window this belongs to
    window_key = timestamp // WINDOW_SIZE_SECONDS
    window_start = window_key * WINDOW_SIZE_SECONDS

    with windows_lock:
        window = order_windows[window_key]

    with window["lock"]:
        window["orders"].append(order_data)
        window["window_start"] = window_start

    logger.info(
        f"Added order {order_data['orderId']} to window {window_key} (window_start={datetime.fromtimestamp(window_start)})"
    )


def close_window(window_key):
    """Close a window and publish analytics"""
    with windows_lock:
        if window_key not in order_windows:
            return
        window = order_windows[window_key]

    with window["lock"]:
        orders = window["orders"]

        if not orders:
            logger.info(f"Skipping empty window {window_key}")
            return

        window_start = window["window_start"]

        # Calculate analytics
        total_orders = len(orders)
        total_revenue = sum(order["totalAmount"] for order in orders)
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0

        # Count unique users
        unique_users = len(set(order["userId"] for order in orders))

        # Most popular items
        item_counts = defaultdict(int)
        for order in orders:
            for item in order.get("items", []):
                item_counts[item["itemId"]] += int(item["quantity"])

        top_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        analytics = {
            "windowStart": window_start,
            "windowEnd": window_start + WINDOW_SIZE_SECONDS,
            "totalOrders": total_orders,
            "totalRevenue": round(total_revenue, 2),
            "avgOrderValue": round(avg_order_value, 2),
            "uniqueUsers": unique_users,
            "topItems": [
                {"itemId": item_id, "quantity": qty} for item_id, qty in top_items
            ],
            "timestamp": int(time.time()),
        }

        # Publish analytics
        try:
            message_bytes = json.dumps(analytics).encode("utf-8")
            future = publisher.publish(topic_path, data=message_bytes)
            message_id = future.result(timeout=10)

            logger.info(
                f"Published analytics for window {window_key} (message_id={message_id})"
            )
            logger.info(
                f"   Window: {datetime.fromtimestamp(window_start)} to {datetime.fromtimestamp(window_start + WINDOW_SIZE_SECONDS)}"
            )
            logger.info(
                f"   Stats: {total_orders} orders, ${total_revenue:.2f} revenue, {unique_users} unique users"
            )

        except Exception as e:
            logger.error(f"Failed to publish analytics for window {window_key}: {e}")

    # Clean up window
    with windows_lock:
        if window_key in order_windows:
            del order_windows[window_key]
            logger.info(f"leaned up window {window_key}")


@app.route("/", methods=["POST"])
def pubsub_push():
    """Handle Pub/Sub push messages"""
    envelope = request.get_json()

    if not envelope:
        logger.error("No Pub/Sub message received")
        return "Bad Request", 400

    # Decode message
    pubsub_message = envelope.get("message")
    if not pubsub_message:
        logger.error("Invalid Pub/Sub message format")
        return "Bad Request", 400

    # Parse order data
    import base64

    message_data = base64.b64decode(pubsub_message["data"]).decode("utf-8")
    order_data = json.loads(message_data)

    logger.info(
        f"eceived order: {order_data['orderId']} (user={order_data['userId']}, amount=${order_data['totalAmount']})"
    )

    # Process order
    process_order(order_data)

    close_expired_windows()

    return "OK", 200


@app.route("/health", methods=["GET"])
def health():
    with windows_lock:
        active_windows = len(order_windows)
        total_orders = sum(len(w["orders"]) for w in order_windows.values())

    return {
        "status": "healthy",
        "activeWindows": active_windows,
        "totalOrdersBuffered": total_orders,
    }, 200


@app.route("/windows", methods=["GET"])
def get_windows():
    """Debug endpoint to see current windows"""
    with windows_lock:
        windows_info = []
        for key, window in order_windows.items():
            with window["lock"]:
                windows_info.append(
                    {
                        "windowKey": key,
                        "windowStart": window["window_start"],
                        "orderCount": len(window["orders"]),
                        "orders": [o["orderId"] for o in window["orders"]],
                    }
                )

    return {"currentTime": int(time.time()), "windows": windows_info}, 200


if __name__ == "__main__":
    logger.info("Analytics processor started")
    logger.info(f"   Project: {PROJECT_ID}")
    logger.info(f"   Output Topic: {OUTPUT_TOPIC}")
    logger.info(f"   Window Size: {WINDOW_SIZE_SECONDS}s")

    # Start Flask app
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
