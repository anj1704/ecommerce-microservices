#!/bin/bash
set -e

# Configuration
export GCP_PROJECT_ID="helpful-cosine-479009-d6"
export GCP_REGION="us-central1"
export DATAPROC_CLUSTER="ecommerce-ms-flink-dev"
export GCS_BUCKET="${GCP_PROJECT_ID}-flink-jobs"

# Kafka configuration (from AWS MSK)
export KAFKA_BOOTSTRAP_SERVERS="b-1.ecommercemskafkadev.cbshpg.c2.kafka.us-east-1.amazonaws.com:9196,b-2.ecommercemskafkadev.cbshpg.c2.kafka.us-east-1.amazonaws.com:9196"
export KAFKA_USERNAME="kafka-admin"
export KAFKA_PASSWORD="KafkaPassword123!"

echo "Submitting Flink job to Dataproc..."

gcloud dataproc jobs submit flink \
  gs://${GCS_BUCKET}/analytics_job.zip \
  --cluster=${DATAPROC_CLUSTER} \
  --region=${GCP_REGION} \
  --properties=^#^spark.pyspark.python=/usr/bin/python3#spark.pyspark.driver.python=/usr/bin/python3 \
  --py-files=gs://${GCS_BUCKET}/analytics_job.zip \
  -- \
  --kafka-bootstrap-servers="${KAFKA_BOOTSTRAP_SERVERS}" \
  --kafka-username="${KAFKA_USERNAME}" \
  --kafka-password="${KAFKA_PASSWORD}" \
  --input-topic="order-events" \
  --output-topic="analytics-results"

echo "Flink job submitted!"
