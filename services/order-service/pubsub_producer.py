from google.cloud import pubsub_v1
import json
from config import settings
import logging
import threading

logger = logging.getLogger(__name__)


class OrderEventProducer:
    def __init__(self):
        self.publisher = None
        self.topic_path = None
        self._lock = threading.Lock()
        self._initialized = False

    def _initialize(self):
        """Lazy initialization - called on first use"""
        if self._initialized:
            return

        with self._lock:
            if self._initialized:  # Double-check locking
                return

            try:
                logger.info("Initializing GCP Pub/Sub publisher...")

                # Create publisher client
                self.publisher = pubsub_v1.PublisherClient()

                # Build topic path
                self.topic_path = self.publisher.topic_path(
                    settings.gcp_project_id, settings.pubsub_order_topic
                )

                self._initialized = True
                logger.info(f"Pub/Sub publisher initialized: {self.topic_path}")

            except Exception as e:
                logger.error(f"Failed to initialize Pub/Sub publisher: {e}")
                self._initialized = False

    def send_order_event(self, order_data):
        """Send order event to GCP Pub/Sub"""
        # Initialize on first use
        if not self._initialized:
            self._initialize()

        if not self._initialized or self.publisher is None:
            logger.error("Pub/Sub publisher not available")
            return False

        try:
            # Convert to JSON bytes
            message_bytes = json.dumps(order_data).encode("utf-8")

            # Publish message
            future = self.publisher.publish(
                self.topic_path,
                data=message_bytes,
                # Add attributes for filtering/routing
                order_id=str(order_data.get("orderId", "")),
                user_id=str(order_data.get("userId", "")),
            )

            # Wait for publish confirmation (with timeout)
            message_id = future.result(timeout=10)

            logger.info(f"Order event published to Pub/Sub: message_id={message_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to publish to Pub/Sub: {e}")
            return False

    def close(self):
        """Clean shutdown (Pub/Sub handles this automatically)"""
        if self.publisher:
            logger.info("Closing Pub/Sub publisher")


# Global producer instance
producer = OrderEventProducer()
