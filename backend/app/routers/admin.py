from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin
from app.db.database import get_db
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.schemas.admin import CustomerList, DashboardStats

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

@router.get("/customers", response_model=CustomerList)
def list_customers(
    search: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    base = select(User).where(User.role == "customer")
    if search:
        base = base.where(
            User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )

    total = db.scalar(select(func.count()).select_from(base.subquery()))
    customers = db.scalars(
        base.order_by(User.id.desc()).offset(skip).limit(limit)
    ).all()

    items = []
    for customer in customers:
        orders_count = db.scalar(
            select(func.count(Order.id)).where(Order.user_id == customer.id)
        )
        total_spent = db.scalar(
            select(func.coalesce(func.sum(Order.total_amount), 0)).where(
                Order.user_id == customer.id, Order.status == "delivered"
            )
        )
        items.append(
            {
                "id": customer.id,
                "full_name": customer.full_name,
                "email": customer.email,
                "phone": customer.phone,
                "is_active": customer.is_active,
                "created_at": customer.created_at,
                "orders_count": orders_count,
                "total_spent": total_spent,
            }
        )
    return {"items": items, "total": total}