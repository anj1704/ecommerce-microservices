from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import boto3
from decimal import Decimal
import time
from psycopg2.extras import RealDictCursor
import json

from config import settings
from database import get_db_connection
from models import AddToCart, CartItem, OrderResponse

app = FastAPI(title="Order Service", version="1.0.0")

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

dynamodb_config = {"region_name": settings.aws_region}
if settings.dynamodb_endpoint:
    dynamodb_config["endpoint_url"] = settings.dynamodb_endpoint

dynamodb = boto3.resource("dynamodb", **dynamodb_config)
carts_table = dynamodb.Table(settings.carts_table)


@app.on_event("startup")
async def startup():
    # init_db()
    pass


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.service_name}


@app.get("/cart/{user_id}")
async def get_cart(user_id: str):
    response = carts_table.get_item(Key={"userId": user_id})

    if "Item" not in response:
        return {"user_id": user_id, "items": [], "updated_at": int(time.time())}

    return response["Item"]


@app.post("/cart/{user_id}/add")
async def add_to_cart(user_id: str, item: AddToCart):
    # Get existing cart
    response = carts_table.get_item(Key={"userId": user_id})

    if "Item" in response:
        cart = response["Item"]
        items = cart.get("items", [])
    else:
        items = []

    # Check if item exists
    found = False
    for cart_item in items:
        if cart_item["itemId"] == item.item_id:
            cart_item["quantity"] += item.quantity
            found = True
            break

    if not found:
        items.append(
            {
                "itemId": item.item_id,
                "quantity": item.quantity,
                "price": Decimal(str(item.price)),
            }
        )

    # Update cart
    carts_table.put_item(
        Item={"userId": user_id, "items": items, "updatedAt": int(time.time())}
    )

    return {"message": "Item added to cart", "items": items}


@app.delete("/cart/{user_id}/remove/{item_id}")
async def remove_from_cart(user_id: str, item_id: str):
    response = carts_table.get_item(Key={"userId": user_id})

    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Cart not found")

    cart = response["Item"]
    items = [item for item in cart["items"] if item["itemId"] != item_id]

    carts_table.put_item(
        Item={"userId": user_id, "items": items, "updatedAt": int(time.time())}
    )

    return {"message": "Item removed from cart"}


@app.post("/orders/{user_id}/place", response_model=OrderResponse)
async def place_order(user_id: str):
    # Get cart
    response = carts_table.get_item(Key={"userId": user_id})

    if "Item" not in response or not response["Item"].get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")

    cart = response["Item"]
    items = cart["items"]

    print(f"cart : {cart}")
    print(f"items : {items}")
    # Calculate total
    total = sum(float(item["price"]) * float(item["quantity"])
                for item in items)

    print(f"Total : {total}")
    # Create order in RDS
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                INSERT INTO orders (user_id, items, total_amount, status)
                VALUES (%s, %s, %s, %s)
                RETURNING order_id, user_id, items, total_amount, status, created_at
                """,
                (user_id, json.dumps(items, default=str), total, "placed"),
            )
            order_data = cur.fetchone()

    print(order_data)
    # Clear cart
    carts_table.delete_item(Key={"userId": user_id})

    print("Cart cleared !")
    # TODO: Publish to Kafka (Phase 5)

    return OrderResponse(
        order_id=str(order_data["order_id"]),
        user_id=order_data["user_id"],
        items=[
            CartItem(
                item_id=item["itemId"], quantity=item["quantity"], price=item["price"]
            )
            for item in order_data["items"]
        ],
        total_amount=float(order_data["total_amount"]),
        status=order_data["status"],
        created_at=order_data["created_at"],
    )


@app.get("/orders/{user_id}")
async def get_orders(user_id: str):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM orders WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,),
            )
            orders = cur.fetchall()

    return orders
