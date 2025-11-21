import json
import os
import boto3
import psycopg2
from sentence_transformers import SentenceTransformer
from PIL import Image
import io
import requests
from opensearchpy import OpenSearch, RequestsHttpConnection
from datetime import datetime

# Initialize clients and model
s3_client = boto3.client("s3")
model = None
opensearch_client = None

# Environment variables
RDS_HOST = os.environ["RDS_HOST"]
RDS_DATABASE = os.environ["RDS_DATABASE"]
RDS_USER = os.environ["RDS_USER"]
RDS_PASSWORD = os.environ["RDS_PASSWORD"]
IMAGES_BUCKET = os.environ["IMAGES_BUCKET"]

OPENSEARCH_ENDPOINT = os.environ["OPENSEARCH_ENDPOINT"]
OPENSEARCH_USERNAME = os.environ["OPENSEARCH_USERNAME"]
OPENSEARCH_PASSWORD = os.environ["OPENSEARCH_PASSWORD"]


def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(
        host=RDS_HOST, database=RDS_DATABASE, user=RDS_USER, password=RDS_PASSWORD
    )


def get_opensearch_client():
    """Get OpenSearch client"""
    global opensearch_client
    if opensearch_client is None:
        opensearch_client = OpenSearch(
            hosts=[{"host": OPENSEARCH_ENDPOINT, "port": 443}],
            http_auth=(OPENSEARCH_USERNAME, OPENSEARCH_PASSWORD),
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection,
            timeout=30,
        )
    return opensearch_client


def store_in_opensearch(
    item_id, description, price, image_url, s3_image_key, embedding
):
    """Store item with embedding in OpenSearch"""
    client = get_opensearch_client()

    document = {
        "item_id": item_id,
        "description": description,
        "price": price,
        "image_url": image_url,
        "s3_image_key": s3_image_key,
        "embedding": embedding,
        "created_at": datetime.utcnow().isoformat(),
    }

    try:
        response = client.index(index="items", id=item_id, body=document, refresh=True)
        print(f"Item indexed in OpenSearch: {item_id}, result: {response['result']}")
        return True
    except Exception as e:
        print(f"Failed to index in OpenSearch: {e}")
        return False


def load_model():
    """Load BERT model (cached after first invocation)"""
    global model
    if model is None:
        print("Loading BERT model...")
        model = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2",
        )
        print("Model loaded successfully")
    return model


def download_and_store_image(image_url, item_id):
    """Download image from URL and store in S3"""
    try:
        print(f"Downloading image from {image_url}")
        response = requests.get(image_url, timeout=10, stream=True)
        response.raise_for_status()

        # Open and verify image
        img = Image.open(io.BytesIO(response.content))

        # Convert to RGB if necessary (handle RGBA, grayscale, etc.)
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Save to buffer
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        buffer.seek(0)

        # Upload to S3
        s3_key = f"{item_id}.jpg"
        s3_client.put_object(
            Bucket=IMAGES_BUCKET, Key=s3_key, Body=buffer, ContentType="image/jpeg"
        )

        print(f"Image stored at s3://{IMAGES_BUCKET}/{s3_key}")
        return s3_key

    except requests.exceptions.RequestException as e:
        print(f"Error downloading image: {e}")
        return None
    except Exception as e:
        print(f"Error processing image: {e}")
        return None


def generate_embedding(text):
    """Generate BERT embedding for text"""
    model = load_model()
    embedding = model.encode(text)

    return embedding.squeeze().tolist()


def store_item_in_db(item_data, s3_image_key, embedding):
    """Store item in RDS PostgreSQL"""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Insert into items table
            cur.execute(
                """
                INSERT INTO items (item_id, description, image_url, s3_image_key, price)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (item_id) DO UPDATE
                SET description = EXCLUDED.description,
                    image_url = EXCLUDED.image_url,
                    s3_image_key = EXCLUDED.s3_image_key,
                    price = EXCLUDED.price
            """,
                (
                    item_data["item_id"],
                    item_data["description"],
                    item_data["image_url"],
                    s3_image_key,
                    item_data["price"],
                ),
            )

        conn.commit()
        print(f"Item {item_data['item_id']} stored in database")

        # Store in OpenSearch
        store_in_opensearch(
            item_data["item_id"],
            item_data["description"],
            item_data["price"],
            item_data["image_url"],
            s3_image_key,
            embedding,
        )

    except Exception as e:
        conn.rollback()
        print(f"Database error: {e}")
        raise
    finally:
        conn.close()


def lambda_handler(event, context):
    """
    Lambda handler triggered by S3 upload
    Expected S3 object format (JSON):
    {
        "item_id": "12345",
        "description": "Product description...",
        "image_url": "https://example.com/image.jpg",
        "price": 29.99
    }
    """
    print(f"Received event: {json.dumps(event)}")

    try:
        # Parse S3 event
        for record in event["Records"]:
            bucket = record["s3"]["bucket"]["name"]
            key = record["s3"]["object"]["key"]

            print(f"Processing s3://{bucket}/{key}")

            # Get JSON file from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            item_data = json.loads(response["Body"].read().decode("utf-8"))

            # Validate required fields
            required_fields = ["item_id", "description", "image_url", "price"]
            for field in required_fields:
                if field not in item_data:
                    raise ValueError(f"Missing required field: {field}")

            # Download and store image
            s3_image_key = download_and_store_image(
                item_data["image_url"], item_data["item_id"]
            )

            # Generate embedding from description
            print("Generating embedding...")
            embedding = generate_embedding(item_data["description"])
            print(f"Embedding generated: dimension={len(embedding)}")

            # Store in database
            store_item_in_db(item_data, s3_image_key, embedding)

            print(f"Successfully processed item {item_data['item_id']}")

        return {"statusCode": 200, "body": json.dumps("Items processed successfully")}

    except Exception as e:
        print(f"Error processing event: {e}")
        return {"statusCode": 500, "body": json.dumps(f"Error: {str(e)}")}
