#!/bin/bash
set -e

echo "Packaging Flink job..."

# 1. Prepare dist directory
rm -rf dist
mkdir -p dist

# 2. Copy Python Source
cp analytics_job.py dist/

# 3. Copy the EXISTING Kafka JAR to dist (so we can upload it later)
# Make sure the filename matches exactly what you have in your folder
JAR_NAME="flink-sql-connector-kafka-1.15.0.jar"

if [ -f "$JAR_NAME" ]; then
    echo "Found local JAR: $JAR_NAME"
    cp "$JAR_NAME" dist/
else
    echo "ERROR: $JAR_NAME not found in current directory!"
    exit 1
fi

# 4. Install Python dependencies
pip3 install -r requirements.txt -t dist/

# 5. Zip the Python code (Excluding the JAR)
# We exclude the JAR because we pass it separately to Dataproc
cd dist
zip -r ../flink-job.zip . -x "*.jar"
cd ..

echo "Flink job packaged: flink-job.zip"