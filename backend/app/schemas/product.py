from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    """Data the client sends to create or update a product."""

    category_id: int
    name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    price: int = Field(gt=0, description="Price in DZD")
    ingredients: str | None = None
    allergens: str | None = None
    nutrition_info: str | None = None
    stock_quantity: int = Field(default=0, ge=0)
    is_available: bool = True


class ProductImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_url: str
    is_main: bool
    position: int


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    name: str
    description: str | None = None
    price: int
    ingredients: str | None = None
    allergens: str | None = None
    nutrition_info: str | None = None
    stock_quantity: int
    is_available: bool
    created_at: datetime
    images: list[ProductImageRead] = []


class ProductList(BaseModel):
    """A page of products plus the total number of matches."""

    items: list[ProductRead]
    total: int
