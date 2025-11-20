from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import httpx
import jwt
import os
from typing import Optional

app = FastAPI(title="API Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs (localhost for now, K8s DNS later)
SERVICES = {
    "user": os.getenv("USER_SERVICE_URL"),
    "order": os.getenv("ORDER_SERVICE_URL"),
    "search": os.getenv("SEARCH_SERVICE_URL"),
}

JWT_SECRET = os.getenv("JWT_SECRET")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "api-gateway"}


# Auth endpoints (no token required)
@app.post("/auth/register")
async def register(user_data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{SERVICES['user']}/register", json=user_data)
        return response.json()


@app.post("/auth/login")
async def login(credentials: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{SERVICES['user']}/login", json=credentials)
        return response.json()


# Protected endpoints
@app.get("/search")
async def search(q: str, authorization: Optional[str] = Header(None)):
    verify_token(authorization)
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{SERVICES['search']}/search", params={"q": q})
        return response.json()


@app.get("/cart/{user_id}")
async def get_cart(user_id: str, authorization: Optional[str] = Header(None)):
    verify_token(authorization)
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{SERVICES['order']}/cart/{user_id}")
        return response.json()


@app.post("/cart/{user_id}/add")
async def add_to_cart(
    user_id: str, item: dict, authorization: Optional[str] = Header(None)
):
    verify_token(authorization)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICES['order']}/cart/{user_id}/add", json=item
        )
        return response.json()


@app.post("/orders/{user_id}/place")
async def place_order(user_id: str, authorization: Optional[str] = Header(None)):
    verify_token(authorization)
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{SERVICES['order']}/orders/{user_id}/place")
        return response.json()


@app.get("/orders/{user_id}")
async def get_orders(user_id: str, authorization: Optional[str] = Header(None)):
    verify_token(authorization)
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{SERVICES['order']}/orders/{user_id}")
        return response.json()


def verify_token(authorization: Optional[str]):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")

    try:
        token = authorization.replace("Bearer ", "")
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
