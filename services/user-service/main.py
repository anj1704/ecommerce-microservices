from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import bcrypt
import jwt
from psycopg2.extras import RealDictCursor
from psycopg2.errorcodes import UNIQUE_VIOLATION
from psycopg2 import errors

from config import settings
from database import get_db_connection
from models import UserCreate, UserLogin, UserResponse, TokenResponse

app = FastAPI(title="User Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    # init_db()
    pass


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.service_name}


@app.post("/register", response_model=TokenResponse)
async def register(user: UserCreate):
    # Hash password
    password_hash = bcrypt.hashpw(
        user.password.encode(), bcrypt.gensalt()).decode()

    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO users (email, password_hash, name)
                    VALUES (%s, %s, %s)
                    RETURNING user_id, email, name, created_at
                    """,
                    (user.email, password_hash, user.name),
                )
                user_data = cur.fetchone()

        # Generate JWT
        token = generate_token(str(user_data["user_id"]))

        return TokenResponse(
            access_token=token,
            user=UserResponse(
                user_id=user_data["user_id"],
                email=user_data["email"],
                name=user_data["name"],
                created_at=user_data["created_at"],
            ),
        )

    # except psycopg2.errors.UniqueViolation:
    except errors.lookup(UNIQUE_VIOLATION):
        raise HTTPException(status_code=400, detail="Email already registered")


@app.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT user_id, email, password_hash, name, created_at FROM users WHERE email = %s",
                (credentials.email,),
            )
            user_data = cur.fetchone()

    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Verify password
    if not bcrypt.checkpw(
        credentials.password.encode(), user_data["password_hash"].encode()
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate JWT
    token = generate_token(str(user_data["user_id"]))

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            user_id=user_data["user_id"],
            email=user_data["email"],
            name=user_data["name"],
            created_at=user_data["created_at"],
        ),
    )


@app.get("/profile/{user_id}", response_model=UserResponse)
async def get_profile(user_id: str):
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT user_id, email, name, created_at FROM users WHERE user_id = %s",
                (user_id,),
            )
            user_data = cur.fetchone()

    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        user_id=user_data["user_id"],
        email=user_data["email"],
        name=user_data["name"],
        created_at=user_data["created_at"],
    )


def generate_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
