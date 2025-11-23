#!/bin/bash
set -e

echo "Packaging Flink job..."

# Create dist directory
mkdir -p dist

# Copy Python files
cp analytics_job.py flink-sql-connector-kafka-1.15.0.jar dist/

# Create zip with dependencies
pip3 install -r requirements.txt -t dist/
cd dist
zip -r ../flink-job.zip .
cd ..

echo "Flink job packaged: flink-job.zip"
