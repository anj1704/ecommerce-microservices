from kafka import KafkaProducer
import json
from config import settings
import logging
import threading

logger = logging.getLogger(__name__)


class OrderEventProducer:
    def __init__(self):
        self.producer = None
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
                logger.info("nitializing Kafka producer...")

                # Create producer
                self.producer = KafkaProducer(
                    bootstrap_servers=settings.kafka_bootstrap_servers.split(","),
                    security_protocol="SASL_SSL",
                    sasl_mechanism="SCRAM-SHA-512",
                    sasl_plain_username=settings.kafka_username,
                    sasl_plain_password=settings.kafka_password,
                    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                    acks="all",
                    retries=3,
                    max_block_ms=10000,  # Don't block forever
                    request_timeout_ms=30000,
                    api_version=(2, 5, 0),
                )

                self._initialized = True
                logger.info("Kafka producer initialized successfully")

            except Exception as e:
                logger.error(f"Failed to initialize Kafka producer: {e}")
                # Don't raise - allow service to start without Kafka
                self._initialized = False

    def send_order_event(self, order_data):
        """Send order event to Kafka"""
        # Initialize on first use
        if not self._initialized:
            self._initialize()

        if not self._initialized or self.producer is None:
            logger.error("Kafka producer not available")
            return False

        try:
            future = self.producer.send(settings.kafka_topic, value=order_data)
            record_metadata = future.get(timeout=10)
            logger.info(
                f"Order event sent: topic={record_metadata.topic}, partition={record_metadata.partition}, offset={record_metadata.offset}"
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send to Kafka: {e}")
            return False

    def close(self):
        if self.producer:
            self.producer.flush()
            self.producer.close()


# Global producer instance
producer = OrderEventProducer()
