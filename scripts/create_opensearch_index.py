#!/usr/bin/env python3
"""
Create OpenSearch index with k-NN vector search capability
"""

from opensearchpy import OpenSearch, RequestsHttpConnection
import sys


def create_index(host, username, password):
    """Create OpenSearch index for item embeddings"""

    # Connect to OpenSearch
    client = OpenSearch(
        hosts=[{"host": host, "port": 443}],
        http_auth=(username, password),
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
    )

    # Index settings and mappings
    index_name = "items"
    index_body = {
        "settings": {
            "index": {
                "knn": True,  # Enable k-NN
                "knn.algo_param.ef_search": 100,
                "number_of_shards": 2,
                "number_of_replicas": 1,
            }
        },
        "mappings": {
            "properties": {
                "item_id": {"type": "keyword"},
                "description": {"type": "text", "analyzer": "standard"},
                "price": {"type": "float"},
                "image_url": {"type": "keyword"},
                "s3_image_key": {"type": "keyword"},
                "embedding": {
                    "type": "knn_vector",
                    "dimension": 384,  # MiniLM model dimension
                    "method": {
                        "name": "hnsw",
                        "space_type": "l2",
                        "engine": "nmslib",
                        "parameters": {"ef_construction": 128, "m": 24},
                    },
                },
                "created_at": {"type": "date"},
            }
        },
    }

    # Delete index if exists
    if client.indices.exists(index=index_name):
        print(f"Deleting existing index: {index_name}")
        client.indices.delete(index=index_name)

    # Create index
    response = client.indices.create(index=index_name, body=index_body)
    print(f"Index created successfully: {response}")

    # Verify index
    info = client.indices.get(index=index_name)
    print(f"Index info: {info}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python create_opensearch_index.py <host> <username> <password>")
        sys.exit(1)

    create_index(sys.argv[1], sys.argv[2], sys.argv[3])
