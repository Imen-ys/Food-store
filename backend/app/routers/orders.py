from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead

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