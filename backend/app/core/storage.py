import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

UPLOAD_DIR = Path("uploads/products")
MAX_SIZE = 5 * 1024 * 1024  # 5 MB
EXTENSIONS = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


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
    """Validate and save an uploaded image. Return its public path."""
    data = await file.read(MAX_SIZE + 1)
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Image is larger than 5 MB")

    mime = detect_image_type(data)
    if mime is None:
        raise HTTPException(
            status_code=400, detail="Only JPEG, PNG and WebP images are allowed"
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{EXTENSIONS[mime]}"
    (UPLOAD_DIR / filename).write_bytes(data)
    return f"/uploads/products/{filename}"


def delete_product_image_file(image_url: str) -> None:
    """Delete the file behind an image path. Uses only the file name for safety."""
    (UPLOAD_DIR / Path(image_url).name).unlink(missing_ok=True)