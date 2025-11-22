from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from sentence_transformers import SentenceTransformer
from psycopg2.extras import RealDictCursor
from opensearchpy import OpenSearch, RequestsHttpConnection

from config import settings
from database import get_db_connection

app = FastAPI(title="Search Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Prometheus metrics
instrumentator = Instrumentator()
instrumentator.instrument(app).expose(app)

model = None
opensearch_client = None


@app.on_event("startup")
async def startup():
    global model
    global opensearch_client
    # init_db()
    print("Loading BERT model...")
    model = SentenceTransformer(settings.model_name)
    print("Model loaded!")

    print("Connecting to OpenSearch...")
    opensearch_client = OpenSearch(
        hosts=[{"host": settings.opensearch_endpoint, "port": 443}],
        http_auth=(settings.opensearch_username, settings.opensearch_password),
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        timeout=30,
    )
    print("OpenSearch connected!")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.service_name}


@app.get("/search")
async def search_items(q: str, limit: int = 10):
    # Generate query embedding
    query_embedding = model.encode(q).squeeze().tolist()

    # k-NN search query
    search_body = {
        "size": limit,
        "query": {"knn": {"embedding": {"vector": query_embedding, "k": limit}}},
        "_source": ["item_id", "description", "price", "image_url", "s3_image_key"],
    }

    try:
        response = opensearch_client.search(index="items", body=search_body)

        results = []
        for hit in response["hits"]["hits"]:
            source = hit["_source"]
            results.append(
                {
                    "item_id": source["item_id"],
                    "description": source["description"],
                    "price": source["price"],
                    "image_url": source.get("image_url"),
                    "s3_image_key": source.get("s3_image_key"),
                    "score": hit["_score"],
                }
            )

        return {
            "query": q,
            "results": results,
            "count": len(results),
            "search_method": "vector_similarity",
        }

    except Exception as e:
        print(f"OpenSearch error: {e}")
        # Fallback to text search in RDS
        return fallback_text_search(q, limit)


def fallback_text_search(q: str, limit: int):
    """Fallback to simple text search if OpenSearch fails"""
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT item_id, description, image_url, price
                FROM items
                WHERE description ILIKE %s
                LIMIT %s
                """,
                (f"%{q}%", limit),
            )
            items = cur.fetchall()

    return {
        "query": q,
        "results": items,
        "count": len(items),
        "search_method": "text_fallback",
    }


@app.get("/items/{item_id}")
async def get_item(item_id: str):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM items WHERE item_id = %s", (item_id,))
            item = cur.fetchone()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return item
