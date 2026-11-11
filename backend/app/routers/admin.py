from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin
from app.db.database import get_db
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.schemas.admin import DashboardStats

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)],  # protects every route in this file
)

ORDER_STATUSES = [
    "pending",
    "confirmed",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
]
LOW_STOCK_THRESHOLD = 5


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    total_orders = db.scalar(select(func.count(Order.id)))
    total_products = db.scalar(select(func.count(Product.id)))
    total_customers = db.scalar(
        select(func.count(User.id)).where(User.role == "customer")
    )
    total_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status == "delivered"
        )
    )
    low_stock_products = db.scalar(
        select(func.count(Product.id)).where(
            Product.is_available.is_(True),
            Product.stock_quantity <= LOW_STOCK_THRESHOLD,
        )
    )

    rows = db.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    ).all()
    orders_by_status = {status: 0 for status in ORDER_STATUSES}
    orders_by_status.update({status: count for status, count in rows})

    return {
        "total_orders": total_orders,
        "total_products": total_products,
        "total_customers": total_customers,
        "total_revenue": total_revenue,
        "orders_by_status": orders_by_status,
        "low_stock_products": low_stock_products,
    }