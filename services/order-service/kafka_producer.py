from kafka import KafkaProducer
from kafka.admin import KafkaAdminClient, NewTopic
from kafka.errors import TopicAlreadyExistsError
import json
from config import settings
import logging

logger = logging.getLogger(__name__)


class OrderEventProducer:
    def __init__(self):
        # Initialize topics
        self._ensure_topics_exist()

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
        )
        logger.info("Kafka producer initialized")

    def _ensure_topics_exist(self):
        """Create Kafka topics if they don't exist"""
        try:
            admin_client = KafkaAdminClient(
                bootstrap_servers=settings.kafka_bootstrap_servers.split(","),
                security_protocol="SASL_SSL",
                sasl_mechanism="SCRAM-SHA-512",
                sasl_plain_username=settings.kafka_username,
                sasl_plain_password=settings.kafka_password,
                request_timeout_ms=30000,
            )

            # Define topics
            topics = [
                NewTopic(
                    name=settings.kafka_topic, num_partitions=3, replication_factor=2
                ),
                NewTopic(
                    name="analytics-results", num_partitions=3, replication_factor=2
                ),
            ]

            # Create topics (idempotent)
            for topic in topics:
                try:
                    admin_client.create_topics([topic], validate_only=False)
                    logger.info(f"Created topic: {topic.name}")
                except TopicAlreadyExistsError:
                    logger.info(f"Topic already exists: {topic.name}")

            admin_client.close()

        except Exception as e:
            logger.warning(f"Could not create topics (they may already exist): {e}")

    def send_order_event(self, order_data):
        """Send order event to Kafka"""
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
        self.producer.flush()
        self.producer.close()


producer = OrderEventProducer()
