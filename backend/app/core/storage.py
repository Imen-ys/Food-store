import io
import logging
import uuid
from pathlib import Path
from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from app.core.config import settings

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("uploads/products")
CLOUD_FOLDER = "food-store/products"
MAX_SIZE = 5 * 1024 * 1024  # 5 MB
EXTENSIONS = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}

USE_CLOUDINARY = bool(
    settings.cloudinary_cloud_name
    and settings.cloudinary_api_key
    and settings.cloudinary_api_secret
)

if USE_CLOUDINARY:
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


def detect_image_type(data: bytes) -> str | None:
    """Look at the first bytes of the file to find its real type."""
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


async def save_product_image(file: UploadFile) -> str:
    """Validate and save an uploaded image. Return its address."""
    data = await file.read(MAX_SIZE + 1)
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Image is larger than 5 MB")

    mime = detect_image_type(data)
    if mime is None:
        raise HTTPException(
            status_code=400, detail="Only JPEG, PNG and WebP images are allowed"
        )

    name = uuid.uuid4().hex

    if USE_CLOUDINARY:
        try:
            result = await run_in_threadpool(
                cloudinary.uploader.upload,
                io.BytesIO(data),
                public_id=f"{CLOUD_FOLDER}/{name}",
                resource_type="image",
            )
        except Exception:
            logger.exception("Cloudinary upload failed")
            raise HTTPException(status_code=502, detail="Image storage is unavailable")
        return result["secure_url"]

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{name}{EXTENSIONS[mime]}"
    (UPLOAD_DIR / filename).write_bytes(data)
    return f"/uploads/products/{filename}"


def delete_product_image_file(image_url: str) -> None:
    """Delete the file behind an image address. Never raises."""
    try:
        if image_url.startswith("http"):
            if USE_CLOUDINARY:
                public_id = f"{CLOUD_FOLDER}/{Path(urlparse(image_url).path).stem}"
                cloudinary.uploader.destroy(
                    public_id, resource_type="image", invalidate=True
                )
        else:
            (UPLOAD_DIR / Path(image_url).name).unlink(missing_ok=True)
    except Exception:
        logger.exception("Could not delete the image file")