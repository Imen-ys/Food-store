from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from typing import Literal

# Product information sent by customer
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=50)

# Complete order sent by customer
class OrderCreate(BaseModel):
    """What the customer sends. Note: no prices and no total."""

    customer_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(pattern=r"^\+?[0-9 ]{8,15}$")
    wilaya: str = Field(min_length=2, max_length=50)
    address: str = Field(min_length=5, max_length=255)
    notes: str | None = Field(default=None, max_length=500)
    items: list[OrderItemCreate] = Field(min_length=1, max_length=50)

# Product information returned by API
class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    quantity: int
    unit_price: int

# Complete order returned by API
class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    total_amount: int
    delivery_fee: int
    customer_name: str
    phone: str
    wilaya: str
    address: str
    notes: str | None = None
    created_at: datetime
    items: list[OrderItemRead]

class OrderStatusUpdate(BaseModel):
    status: Literal[
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
    ]


class OrderList(BaseModel):
    items: list[OrderRead]
    total: int