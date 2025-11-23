#!/bin/bash
set -e

# Configuration
export GCP_PROJECT_ID="helpful-cosine-479009-d6"
export GCP_REGION="us-central1"
export DATAPROC_CLUSTER="ecommerce-ms-flink-dev"
export GCS_BUCKET="${GCP_PROJECT_ID}-flink-jobs"

# Kafka configuration
export KAFKA_BOOTSTRAP_SERVERS="b-1.ecommercemskafkadev.cbshpg.c2.kafka.us-east-1.amazonaws.com:9196,b-2.ecommercemskafkadev.cbshpg.c2.kafka.us-east-1.amazonaws.com:9196"
export KAFKA_USERNAME="kafka-admin"
export KAFKA_PASSWORD="KafkaPassword123!"

echo "Uploading artifacts to GCS..."

# 1. Upload the JAR (from the dist folder)
gsutil cp dist/flink-sql-connector-kafka-1.15.0.jar gs://${GCS_BUCKET}/

# 2. Upload the Python Code Zip
gsutil cp flink-job.zip gs://${GCS_BUCKET}/analytics_job.zip

echo "Submitting Flink job to Dataproc..."

gcloud dataproc jobs submit flink \
  gs://${GCS_BUCKET}/analytics_job.zip \
  --cluster=${DATAPROC_CLUSTER} \
  --region=${GCP_REGION} \
  --main-python-file=analytics_job.py \
  --jar=gs://${GCS_BUCKET}/flink-sql-connector-kafka-1.15.0.jar \
  --py-files=gs://${GCS_BUCKET}/analytics_job.zip \
  --properties=env.java.opts="-Dflink.hadoop.fs.gs.impl=com.google.cloud.hadoop.fs.gcs.GoogleHadoopFileSystem" \
  -- \
  --bootstrap-servers="${KAFKA_BOOTSTRAP_SERVERS}" \
  --username="${KAFKA_USERNAME}" \
  --password="${KAFKA_PASSWORD}" \
  --input-topic="order-events" \
  --output-topic="analytics-results"

echo "Flink job submitted!"