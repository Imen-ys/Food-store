from fastapi import FastAPI

from app.core.config import settings

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