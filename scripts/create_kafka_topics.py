"""
Create Kafka topics in MSK cluster
"""

from kafka.admin import KafkaAdminClient, NewTopic
from kafka.errors import TopicAlreadyExistsError
import sys


def create_topics(bootstrap_servers, username, password):
    """Create required Kafka topics"""

    admin_client = KafkaAdminClient(
        bootstrap_servers=bootstrap_servers.split(","),
        security_protocol="SASL_SSL",
        sasl_mechanism="SCRAM-SHA-512",
        sasl_plain_username=username,
        sasl_plain_password=password,
    )

    topics = [
        NewTopic(name="order-events", num_partitions=3, replication_factor=2),
        NewTopic(name="analytics-results", num_partitions=1, replication_factor=2),
    ]

    try:
        admin_client.create_topics(new_topics=topics, validate_only=False)
        print("Topics created successfully:")
        for topic in topics:
            print(f"  - {topic.name} ({topic.num_partitions} partitions)")
    except TopicAlreadyExistsError:
        print("Topics already exist")
    finally:
        admin_client.close()


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(
            "Usage: python create_kafka_topics.py <bootstrap_servers> <username> <password>"
        )
        sys.exit(1)

    create_topics(sys.argv[1], sys.argv[2], sys.argv[3])
