from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db

app = FastAPI(
    title=settings.app_name,
    description="Backend API for the food e-commerce platform",
    version="0.1.0",
)


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