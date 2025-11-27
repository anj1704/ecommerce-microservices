"""
Local consumer for analytics results from GCP Pub/Sub
Run this script to see real-time analytics as orders are placed
"""

import os
import json
from google.cloud import pubsub_v1
from datetime import datetime

# Configuration
PROJECT_ID = os.getenv("GCP_PROJECT_ID", "your-gcp-project")
SUBSCRIPTION_ID = "analytics-results-local-sub"


def callback(message):
    """Process received analytics message"""
    try:
        analytics = json.loads(message.data.decode("utf-8"))

        # Format timestamp
        window_start = datetime.fromtimestamp(analytics["windowStart"])
        window_end = datetime.fromtimestamp(analytics["windowEnd"])

        print("\n" + "=" * 60)
        print(f"ANALYTICS WINDOW: {window_start} to {window_end}")
        print("=" * 60)
        print(f"Total Orders: {analytics['totalOrders']}")
        print(f"Total Revenue: ${analytics['totalRevenue']}")
        print(f"Avg Order Value: ${analytics['avgOrderValue']}")
        print(f"Unique Users: {analytics['uniqueUsers']}")

        if analytics["topItems"]:
            print("\nTop Items:")
            for item in analytics["topItems"]:
                print(f"   - Item {item['itemId']}: {item['quantity']} sold")

        print("=" * 60 + "\n")

        # Acknowledge the message
        message.ack()

    except Exception as e:
        print(f"Error processing message: {e}")
        message.nack()


def main():
    print("Starting Analytics Consumer...")
    print(f"Listening to: {PROJECT_ID}/{SUBSCRIPTION_ID}")
    print("Waiting for analytics data...\n")

    # Create subscriber client
    subscriber = pubsub_v1.SubscriberClient()
    subscription_path = subscriber.subscription_path(
        PROJECT_ID, SUBSCRIPTION_ID)

    # Start listening
    streaming_pull_future = subscriber.subscribe(
        subscription_path, callback=callback)

    try:
        # Keep running
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()
        print("\n\nConsumer stopped.")


if __name__ == "__main__":
    main()
