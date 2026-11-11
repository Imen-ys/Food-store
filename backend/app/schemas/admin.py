from pydantic import BaseModel
from datetime import datetime

class DashboardStats(BaseModel):
    total_orders: int
    total_products: int
    total_customers: int
    total_revenue: int  # DZD, delivered orders only
    orders_by_status: dict[str, int]
    low_stock_products: int  # available products with 5 or fewer in stock

class CustomerRead(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str | None = None
    is_active: bool
    created_at: datetime
    orders_count: int
    total_spent: int  # DZD, delivered orders only


class CustomerList(BaseModel):
    items: list[CustomerRead]
    total: int