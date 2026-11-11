from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

import app.models  # noqa: F401  (registers the models)
from app.core.config import settings
from app.db.database import Base, engine, get_db
from app.routers import admin, auth, categories, orders, products
from pathlib import Path
from fastapi.staticfiles import StaticFiles

# Create the tables that don't exist yet.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="Backend API for the food e-commerce platform",
    version="0.1.0",
)
Path("uploads").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(orders.router)
app.include_router(products.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": f"Welcome to the {settings.app_name}"}


@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.environment}


@app.get("/health/db")
def database_health_check(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1")).scalar()
    return {"database": "connected", "result": result}