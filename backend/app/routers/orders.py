from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin, get_current_user
from app.db.database import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import (
    OrderCreate,
    OrderList,
    OrderRead,
    OrderStatusUpdate,
)

router = APIRouter(prefix="/orders", tags=["Orders"])

DELIVERY_FEE = 0


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # 1. Merge duplicate products: {product_id: total_quantity}
    quantities: dict[int, int] = {}
    for item in data.items:
        quantities[item.product_id] = quantities.get(item.product_id, 0) + item.quantity

    # 2. Load the products and validate them
    products = db.scalars(select(Product).where(Product.id.in_(quantities))).all()
    products_by_id = {product.id: product for product in products}

    for product_id in quantities:
        product = products_by_id.get(product_id)
        if product is None:
            raise HTTPException(
                status_code=404, detail=f"Product {product_id} not found"
            )
        if not product.is_available:
            raise HTTPException(
                status_code=409, detail=f"'{product.name}' is not available"
            )

    # 3. Build the order and its items inside one transaction
    try:
        order = Order(
            user_id=user.id,
            status="pending",
            total_amount=0,
            delivery_fee=DELIVERY_FEE,
            customer_name=data.customer_name,
            phone=data.phone,
            wilaya=data.wilaya,
            address=data.address,
            notes=data.notes,
        )
        db.add(order)

        subtotal = 0
        for product_id, quantity in quantities.items():
            product = products_by_id[product_id]

            # Atomic check + decrease: only succeeds if enough stock remains
            result = db.execute(
                update(Product)
                .where(
                    Product.id == product_id,
                    Product.stock_quantity >= quantity,
                )
                .values(stock_quantity=Product.stock_quantity - quantity)
            )
            if result.rowcount == 0:
                raise HTTPException(
                    status_code=409,
                    detail=f"Not enough stock for '{product.name}'",
                )

            order.items.append(
                OrderItem(
                    product_id=product_id,
                    quantity=quantity,
                    unit_price=product.price,  # snapshot of today's price
                )
            )
            subtotal += product.price * quantity

        order.total_amount = subtotal + DELIVERY_FEE
        db.commit()
    except Exception:
        db.rollback()  # cancel everything, including earlier stock changes
        raise

    db.refresh(order)
    return order

ALLOWED_TRANSITIONS = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"preparing", "cancelled"},
    "preparing": {"out_for_delivery", "cancelled"},
    "out_for_delivery": {"delivered", "cancelled"},
    "delivered": set(),
    "cancelled": set(),
}


# IMPORTANT: "/me" must stay above "/{order_id}"
@router.get("/me", response_model=list[OrderRead])
def list_my_orders(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return db.scalars(
        select(Order).where(Order.user_id == user.id).order_by(Order.id.desc())
    ).all()


@router.get("", response_model=OrderList)
def list_all_orders(
    status_filter: str | None = Query(default=None, alias="status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    query = select(Order)
    if status_filter:
        query = query.where(Order.status == status_filter)

    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = db.scalars(
        query.order_by(Order.id.desc()).offset(skip).limit(limit)
    ).all()
    return {"items": items, "total": total}


@router.get("/{order_id}", response_model=OrderRead)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = db.get(Order, order_id)
    # Same 404 whether the order doesn't exist or belongs to someone else.
    if order is None or (order.user_id != user.id and user.role != "admin"):
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=OrderRead)
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    if data.status not in ALLOWED_TRANSITIONS[order.status]:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot change an order from '{order.status}' to '{data.status}'",
        )

    try:
        if data.status == "cancelled":
            # Put the stock back, in the same transaction as the status change
            for item in order.items:
                db.execute(
                    update(Product)
                    .where(Product.id == item.product_id)
                    .values(stock_quantity=Product.stock_quantity + item.quantity)
                )
        order.status = data.status
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(order)
    return order