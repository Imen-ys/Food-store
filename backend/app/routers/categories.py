from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryRead

# prefix="/categories": All URLs start with /categories.
# tags=["Categories"]: Groups them under Categories in Swagger documentation.
router = APIRouter(prefix="/categories", tags=["Categories"])


# 1. Searches for a category using its ID.
# 2. If it doesn't exist, returns error 404.
# 3. If it exists, returns the category.
# Example: Searching for category ID 10 when it doesn't exist → 404 Not Found.
def get_category_or_404(category_id: int, db: Session) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


# Prevents two categories from having the same name.
# Example:
# - Healthy Food already exists.
# - You try to create another Healthy Food.
# - API returns 409 Conflict.
# current_id is useful when updating a category: it allows the category to keep its own name.
def ensure_name_is_free(name: str, db: Session, current_id: int | None = None):
    existing = db.scalar(select(Category).where(Category.name == name))
    if existing is not None and existing.id != current_id:
        raise HTTPException(status_code=409, detail="Category name already exists")


# Gets all categories from the database.
# Sorts them alphabetically by name.
# Returns a list of categories.
@router.get("", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return db.scalars(select(Category).order_by(Category.name)).all()


# - Receives a category ID.
# - Searches for that category.
# - Returns it or gives a 404 error.
# Example URL: GET /categories/1
@router.get("/{category_id}", response_model=CategoryRead)
def get_category(category_id: int, db: Session = Depends(get_db)):
    return get_category_or_404(category_id, db)

# 1. Receives category data.
# 2. Checks if the name already exists.
# 3. Creates a new category.
# 4. db.add() → Adds it to the database session.
# 5. db.commit() → Saves changes permanently.
# 6. db.refresh() → Gets the updated database data, including the generated ID.
# 7. Returns the new category.
# Example URL: POST /categories
@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    ensure_name_is_free(data.name, db)
    category = Category(name=data.name, description=data.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

# 1. Finds the category using its ID.
# 2. Checks if the new name is available.
# 3. Updates its name and description.
# 4. Saves the changes.
# 5. Returns the updated category.
# Example URL: PUT /categories/1
@router.put("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int, data: CategoryCreate, db: Session = Depends(get_db)
):
    category = get_category_or_404(category_id, db)
    ensure_name_is_free(data.name, db, current_id=category.id)
    category.name = data.name
    category.description = data.description
    db.commit()
    db.refresh(category)
    return category

# 1. Finds the category.
# 2. Checks if it contains products.
# 3. If products exist → returns 409 Conflict.
# 4. Otherwise, deletes the category.
# 5. Saves the changes.
# Example URL: DELETE /categories/1
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = get_category_or_404(category_id, db)
    if category.products:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a category that still has products",
        )
    db.delete(category)
    db.commit()