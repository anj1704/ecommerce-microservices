#!/usr/bin/env python3
"""
Seed script to parse CSV and upload items to S3 for Lambda processing
Usage: python seed_data.py <csv_file_path> <s3_bucket_name>
"""

import csv
import json
import boto3
import sys
from pathlib import Path


def parse_csv_row(row):
    """Parse CSV row and create item JSON"""
    return {
        "item_id": row["sample_id"],
        "description": row["catalog_content"],
        "image_url": row["image_link"],
        "price": float(row["price"]),
    }


def upload_items_to_s3(csv_path, bucket_name, limit=None):
    """
    Read CSV and upload each item as JSON to S3

    Args:
        csv_path: Path to CSV file
        bucket_name: S3 bucket name
        limit: Optional limit on number of items to process
    """
    s3_client = boto3.client("s3")

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        processed = 0
        errors = 0

        for row in reader:
            if limit and processed >= limit:
                break

            try:
                item_data = parse_csv_row(row)
                item_id = item_data["item_id"]

                # Convert to JSON
                json_data = json.dumps(item_data, indent=2)

                # Upload to S3
                s3_key = f"{item_id}.json"
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=s3_key,
                    Body=json_data.encode("utf-8"),
                    ContentType="application/json",
                )

                processed += 1
                print(f"Uploaded {item_id} ({processed} total)")

            except Exception as e:
                errors += 1
                print(f"✗ Error processing row: {e}")

        print(f"\n{'=' * 50}")
        print("Summary:")
        print(f"  Processed: {processed}")
        print(f"  Errors: {errors}")
        print(f"  Bucket: s3://{bucket_name}")
        print(f"{'=' * 50}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(
            "Usage: python seed_data.py <csv_file_path> <s3_bucket_name> [limit]")
        print(
            "Example: python seed_data.py data.csv ecommerce-ms-ingestion-trigger-dev 10"
        )
        sys.exit(1)

    csv_path = sys.argv[1]
    bucket_name = sys.argv[2]
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else None

    if not Path(csv_path).exists():
        print(f"Error: File not found: {csv_path}")
        sys.exit(1)

    print(f"Starting ingestion from {csv_path}")
    if limit:
        print(f"Processing first {limit} items only")

    upload_items_to_s3(csv_path, bucket_name, limit)
