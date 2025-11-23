"""
Flink job to process order events from Kafka and produce analytics
Runs on GCP Dataproc
"""

from pyflink.datastream import StreamExecutionEnvironment
from pyflink.datastream.connectors.kafka import (
    KafkaSource,
    KafkaOffsetsInitializer,
    KafkaSink,
    KafkaRecordSerializationSchema,
)
from pyflink.common.serialization import SimpleStringSchema
from pyflink.common.typeinfo import Types
from pyflink.datastream.functions import MapFunction, ProcessWindowFunction
from pyflink.datastream.window import TumblingProcessingTimeWindows
from pyflink.common.time import Time
import json
from datetime import datetime
import argparse


class OrderEventParser(MapFunction):
    """Parse JSON order events"""

    def map(self, value):
        try:
            event = json.loads(value)
            return (
                event.get("orderId"),
                event.get("userId"),
                event.get("totalAmount", 0.0),
                event.get("timestamp", 0),
                len(event.get("items", [])),
            )
        except Exception as e:
            print(f"Error parsing event: {e}")
            return None


class AggregateOrderMetrics(ProcessWindowFunction):
    """Aggregate metrics in 1-minute windows"""

    def process(self, key, context, elements):
        orders = list(elements)

        # Calculate metrics
        total_orders = len(orders)
        total_revenue = sum(order[2] for order in orders)  # totalAmount
        unique_users = len(set(order[1] for order in orders))  # userId
        total_items = sum(order[4] for order in orders)  # item count

        # Get top items (simplified - just count occurrences)
        item_counts = {}
        for order in orders:
            # In real implementation, parse items list
            pass

        # Create result
        window_start = context.window().start
        window_end = context.window().end

        result = {
            "windowStart": window_start,
            "windowEnd": window_end,
            "totalOrders": total_orders,
            "totalRevenue": round(total_revenue, 2),
            "uniqueUsers": unique_users,
            "totalItems": total_items,
            "avgOrderValue": round(
                total_revenue / total_orders if total_orders > 0 else 0, 2
            ),
            "timestamp": int(datetime.now().timestamp()),
        }

        yield json.dumps(result)


def create_kafka_source(bootstrap_servers, topic, username, password, group_id):
    """Create Kafka source with SASL authentication"""
    properties = {
        "bootstrap.servers": bootstrap_servers,
        "group.id": group_id,
        "security.protocol": "SASL_SSL",
        "sasl.mechanism": "SCRAM-SHA-512",
        "sasl.jaas.config": f'org.apache.kafka.common.security.scram.ScramLoginModule required username="{username}" password="{password}";',
    }

    return (
        KafkaSource.builder()
        .set_bootstrap_servers(bootstrap_servers)
        .set_topics(topic)
        .set_group_id(group_id)
        .set_starting_offsets(KafkaOffsetsInitializer.latest())
        .set_value_only_deserializer(SimpleStringSchema())
        .set_properties(properties)
        .build()
    )


def create_kafka_sink(bootstrap_servers, topic, username, password):
    """Create Kafka sink with SASL authentication"""
    properties = {
        "bootstrap.servers": bootstrap_servers,
        "security.protocol": "SASL_SSL",
        "sasl.mechanism": "SCRAM-SHA-512",
        "sasl.jaas.config": f'org.apache.kafka.common.security.scram.ScramLoginModule required username="{username}" password="{password}";',
    }

    return (
        KafkaSink.builder()
        .set_bootstrap_servers(bootstrap_servers)
        .set_record_serializer(
            KafkaRecordSerializationSchema.builder()
            .set_topic(topic)
            .set_value_serialization_schema(SimpleStringSchema())
            .build()
        )
        .set_property("security.protocol", "SASL_SSL")
        .set_property("sasl.mechanism", "SCRAM-SHA-512")
        .set_property(
            "sasl.jaas.config",
            f'org.apache.kafka.common.security.scram.ScramLoginModule required username="{username}" password="{password}";',
        )
        .build()
    )


def main():
    """Main Flink job"""

    parser = argparse.ArgumentParser(description="Flink Order Analytics")
    parser.add_argument("--bootstrap-servers", required=True)
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--input-topic", default="order-events")
    parser.add_argument("--output-topic", default="analytics-results")

    # Parse known args (flink passes internal args too, so we use parse_known_args)
    args, _ = parser.parse_known_args()

    print("Starting Flink Analytics Job")
    print(f"Kafka Brokers: {args.bootstrap_servers}")

    # Create execution environment
    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_parallelism(2)

    # Create Kafka source
    kafka_source = create_kafka_source(
        args.bootstrap_servers,
        args.input_topic,
        args.username,
        args.password,
        "flink-analytics-group",
    )

    # Create Kafka sink
    kafka_sink = create_kafka_sink(
        args.bootstrap_servers, args.output_topic, args.username, args.password
    )

    # Build processing pipeline
    stream = env.from_source(
        kafka_source, watermark_strategy=None, source_name="Kafka Order Events"
    )

    # Parse events
    parsed_stream = stream.map(
        OrderEventParser(),
        output_type=Types.TUPLE(
            [
                Types.STRING(),  # orderId
                Types.STRING(),  # userId
                Types.FLOAT(),  # totalAmount
                Types.LONG(),  # timestamp
                Types.INT(),  # item count
            ]
        ),
    ).filter(lambda x: x is not None)

    # Window aggregation (1-minute tumbling window)
    windowed_stream = (
        parsed_stream.key_by(lambda x: "all")
        .window(TumblingProcessingTimeWindows.of(Time.minutes(1)))
        .process(AggregateOrderMetrics(), output_type=Types.STRING())
    )

    # Sink to Kafka
    windowed_stream.sink_to(kafka_sink)

    # Execute
    env.execute("Order Analytics Job")


if __name__ == "__main__":
    main()
