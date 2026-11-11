from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_orders: int
    total_products: int
    total_customers: int
    total_revenue: int  # DZD, delivered orders only
    orders_by_status: dict[str, int]
    low_stock_products: int  # available products with 5 or fewer in stock