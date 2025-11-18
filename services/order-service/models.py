from pydantic import BaseModel
from typing import List
from datetime import datetime


class CartItem(BaseModel):
    item_id: str
    quantity: int
    price: float


class AddToCart(BaseModel):
    item_id: str
    quantity: int = 1
    price: float


class Cart(BaseModel):
    user_id: str
    items: List[CartItem]
    updated_at: int


class OrderCreate(BaseModel):
    user_id: str


class OrderResponse(BaseModel):
    order_id: str
    user_id: str
    items: List[CartItem]
    total_amount: float
    status: str
    created_at: datetime
