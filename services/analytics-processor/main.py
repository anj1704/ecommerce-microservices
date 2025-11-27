import os
import json
import logging
from datetime import datetime
from collections import defaultdict
from google.cloud import pubsub_v1
from flask import Flask, request

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
PROJECT_ID = os.getenv("GCP_PROJECT_ID")
INPUT_SUBSCRIPTION = os.getenv(
    "INPUT_SUBSCRIPTION", "order-events-processor-sub")
OUTPUT_TOPIC = os.getenv("OUTPUT_TOPIC", "analytics-results")

# In-memory windowing (1-minute tumbling windows)
WINDOW_SIZE_SECONDS = 60
order_windows = defaultdict(lambda: {"orders": [], "window_start": None})

publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(PROJECT_ID, OUTPUT_TOPIC)


def process_order(order_data):
    """Process incoming order and aggregate by time window"""
    timestamp = order_data.get("timestamp", int(datetime.now().timestamp()))

    # Determine which window this belongs to
    window_key = timestamp // WINDOW_SIZE_SECONDS
    window_start = window_key * WINDOW_SIZE_SECONDS

    # Add to window
    order_windows[window_key]["orders"].append(order_data)
    order_windows[window_key]["window_start"] = window_start

    logger.info(f"Added order {order_data['orderId']} to window {window_key}")

    # Check if window should be closed (simple time-based)
    current_time = int(datetime.now().timestamp())
    if current_time >= window_start + WINDOW_SIZE_SECONDS:
        close_window(window_key)


def close_window(window_key):
    """Close a window and publish analytics"""
    if window_key not in order_windows:
        return

    window_data = order_windows[window_key]
    orders = window_data["orders"]

    if not orders:
        return

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
            item_counts[item["itemId"]] += item["quantity"]

    top_items = sorted(item_counts.items(),
                       key=lambda x: x[1], reverse=True)[:5]

    analytics = {
        "windowStart": window_data["window_start"],
        "windowEnd": window_data["window_start"] + WINDOW_SIZE_SECONDS,
        "totalOrders": total_orders,
        "totalRevenue": round(total_revenue, 2),
        "avgOrderValue": round(avg_order_value, 2),
        "uniqueUsers": unique_users,
        "topItems": [
            {"itemId": item_id, "quantity": qty} for item_id, qty in top_items
        ],
        "timestamp": int(datetime.now().timestamp()),
    }

    # Publish analytics
    message_bytes = json.dumps(analytics).encode("utf-8")
    future = publisher.publish(topic_path, data=message_bytes)
    message_id = future.result()

    logger.info(
        f"Published analytics for window {window_key}: message_id={message_id}")
    logger.info(f"Analytics: {analytics}")

    # Clean up window
    del order_windows[window_key]


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

    logger.info(f"Received order: {order_data['orderId']}")

    # Process order
    process_order(order_data)

    return "OK", 200


@app.route("/health", methods=["GET"])
def health():
    return {"status": "healthy"}, 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
