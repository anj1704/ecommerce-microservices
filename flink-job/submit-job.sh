#!/bin/bash
set -e

# Configuration
export GCP_PROJECT_ID="helpful-cosine-479009-d6"
export GCP_REGION="us-central1"
export GCP_ZONE="us-central1-a"
export DATAPROC_CLUSTER="ecommerce-ms-flink-dev"
export GCS_BUCKET="${GCP_PROJECT_ID}-flink-jobs"
export MASTER_NODE="${DATAPROC_CLUSTER}-m"

# Kafka configuration
export KAFKA_BOOTSTRAP_SERVERS="b-1.ecommercemskafkadev.cbshpg.c2.kafka.us-east-1.amazonaws.com:9196,b-2.ecommercemskafkadev.cbshpg.c2.kafka.us-east-1.amazonaws.com:9196"
export KAFKA_USERNAME="kafka-admin"
export KAFKA_PASSWORD="KafkaPassword123!"

echo "Uploading artifacts to GCS..."
gsutil cp dist/flink-sql-connector-kafka-1.15.0.jar gs://${GCS_BUCKET}/
gsutil cp flink-job.zip gs://${GCS_BUCKET}/flink-job.zip
gsutil cp dist/analytics_job.py gs://${GCS_BUCKET}/analytics_job.py

echo "Submitting Flink job via SSH..."

gcloud compute ssh ${MASTER_NODE} \
  --project=${GCP_PROJECT_ID} \
  --zone=${GCP_ZONE} \
  --command="
    set -e
    echo '--- Setting up Environment ---'
    
    # Install system tools needed for Python wheels
    sudo apt-get update -y
    sudo apt-get install -y python3-venv python3-dev build-essential libffi-dev

    rm -rf /tmp/flink-job
    rm -rf /tmp/flink-venv
    mkdir -p /tmp/flink-job
    
    hadoop fs -copyToLocal gs://${GCS_BUCKET}/analytics_job.py /tmp/flink-job/
    hadoop fs -copyToLocal gs://${GCS_BUCKET}/flink-sql-connector-kafka-1.15.0.jar /tmp/flink-job/
    hadoop fs -copyToLocal gs://${GCS_BUCKET}/flink-job.zip /tmp/flink-job/

    echo '--- Installing Python Dependencies ---'
    python3 -m venv /tmp/flink-venv
    source /tmp/flink-venv/bin/activate
    
    # 1. FIX: Use pip 22.0.4 (Modern enough for wheels, old enough for legacy setup.py)
    pip install pip==22.0.4
    
    # 2. FIX: Use --prefer-binary to stop it from trying to compile numpy/pyarrow
    echo 'Installing Flink and Kafka...'
    pip install --prefer-binary apache-flink==1.15.2 kafka-python==2.0.2

    echo '--- Submitting Job ---'
    flink run -m yarn-cluster \
      -py /tmp/flink-job/analytics_job.py \
      -j /tmp/flink-job/flink-sql-connector-kafka-1.15.0.jar \
      -pyfs /tmp/flink-job/flink-job.zip \
      -pyclientexec /tmp/flink-venv/bin/python \
      -pyexec /tmp/flink-venv/bin/python \
      -- \
      --bootstrap-servers '${KAFKA_BOOTSTRAP_SERVERS}' \
      --username '${KAFKA_USERNAME}' \
      --password '${KAFKA_PASSWORD}' \
      --input-topic 'order-events' \
      --output-topic 'analytics-results'
  "

echo "Flink job submitted successfully!"
