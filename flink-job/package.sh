#!/bin/bash
set -e

echo "Packaging Flink job..."

# 1. Clean previous build
rm -rf dist
rm -f flink-job.zip

# 2. Create dist directory
mkdir -p dist

# 3. Copy Python Source
cp analytics_job.py dist/

# 4. Copy the Kafka JAR (Must exist in current folder)
JAR_NAME="flink-sql-connector-kafka-1.15.0.jar"
if [ -f "$JAR_NAME" ]; then
    cp "$JAR_NAME" dist/
else
    echo "WARNING: $JAR_NAME not found. Make sure you downloaded it!"
fi

# 5. Install dependencies (ONLY kafka-python)
# We use --only-binary=:all: to prevent it from trying to compile C++ code
pip3 install -r requirements.txt -t dist/ --only-binary=:all: || pip3 install -r requirements.txt -t dist/

# 6. Zip it up (Excluding the heavy JAR)
cd dist
zip -r ../flink-job.zip . -x "*.jar"
cd ..

echo "Flink job packaged: flink-job.zip"
