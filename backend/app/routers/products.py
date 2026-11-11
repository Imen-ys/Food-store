from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_admin
from app.core.storage import delete_product_image_file, save_product_image
from app.db.database import get_db
from app.models.category import Category
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.product_image import ProductImage
from app.schemas.product import ProductCreate, ProductImageRead, ProductList, ProductRead

router = APIRouter(prefix="/products", tags=["Products"])


def get_product_or_404(product_id: int, db: Session) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def ensure_category_exists(category_id: int, db: Session):
    if db.get(Category, category_id) is None:
        raise HTTPException(status_code=404, detail="Category not found")


@router.get("", response_model=ProductList)
def list_products(
    search: str | None = None,
    category_id: int | None = None,
    min_price: int | None = Query(default=None, ge=0),
    max_price: int | None = Query(default=None, ge=0),
    available_only: bool = False,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = select(Product)

    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
    if category_id is not None:
        query = query.where(Product.category_id == category_id)
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    if available_only:
        query = query.where(Product.is_available.is_(True))

    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = db.scalars(
        query.order_by(Product.id.desc()).offset(skip).limit(limit)
    ).all()
    return {"items": items, "total": total}


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return get_product_or_404(product_id, db)


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    ensure_category_exists(data.category_id, db)
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int, data: ProductCreate, db: Session = Depends(get_db)
):
    product = get_product_or_404(product_id, db)
    ensure_category_exists(data.category_id, db)
    for field, value in data.model_dump().items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = get_product_or_404(product_id, db)
    used_in_orders = db.scalar(
        select(OrderItem.id).where(OrderItem.product_id == product_id).limit(1)
    )
    if used_in_orders is not None:
        raise HTTPException(
            status_code=409,
            detail="This product is in existing orders. Set is_available to false instead.",
        )
    db.delete(product)
    db.commit()

MAX_IMAGES_PER_PRODUCT = 8


def get_image_or_404(product_id: int, image_id: int, db: Session) -> ProductImage:
    image = db.get(ProductImage, image_id)
    if image is None or image.product_id != product_id:
        raise HTTPException(status_code=404, detail="Image not found")
    return image


@router.post(
    "/{product_id}/images",
    response_model=ProductImageRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_admin)],
)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    product = get_product_or_404(product_id, db)
    if len(product.images) >= MAX_IMAGES_PER_PRODUCT:
        raise HTTPException(
            status_code=409,
            detail=f"A product can have at most {MAX_IMAGES_PER_PRODUCT} images",
        )

    image_url = await save_product_image(file)
    image = ProductImage(
        product_id=product.id,
        image_url=image_url,
        is_main=len(product.images) == 0,  # the first image is the main one
        position=max((i.position for i in product.images), default=-1) + 1,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.patch(
    "/{product_id}/images/{image_id}/main",
    response_model=ProductImageRead,
    dependencies=[Depends(get_current_admin)],
)
def set_main_image(product_id: int, image_id: int, db: Session = Depends(get_db)):
    product = get_product_or_404(product_id, db)
    image = get_image_or_404(product_id, image_id, db)
    for other in product.images:
        other.is_main = other.id == image.id
    db.commit()
    db.refresh(image)
    return image


@router.delete(
    "/{product_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_admin)],
)
def delete_product_image(
    product_id: int, image_id: int, db: Session = Depends(get_db)
):
    product = get_product_or_404(product_id, db)
    image = get_image_or_404(product_id, image_id, db)
    image_url = image.image_url
    was_main = image.is_main

    db.delete(image)
    db.flush()  # apply the delete so product.images is up to date
    db.refresh(product)
    if was_main and product.images:
        product.images[0].is_main = True  # promote the next image
    db.commit()

    delete_product_image_file(image_url)  # remove the file after the DB succeeded