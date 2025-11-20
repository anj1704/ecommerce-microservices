from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from psycopg2.extras import RealDictCursor

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

# Load BERT model on startup
model = None


@app.on_event("startup")
async def startup():
    global model
    # init_db()
    print("Loading BERT model...")
    model = SentenceTransformer(settings.model_name)
    print("Model loaded!")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.service_name}


@app.get("/search")
async def search_items(q: str, limit: int = 10):
    # Generate query embedding
    query_embedding = model.encode([q])[0]

    # For now: simple text search (Phase 8: migrate to OpenSearch)
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

    return {"query": q, "results": items, "count": len(items)}


@app.get("/items/{item_id}")
async def get_item(item_id: str):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM items WHERE item_id = %s", (item_id,))
            item = cur.fetchone()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return item
