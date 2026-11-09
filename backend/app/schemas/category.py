from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    """Data the client sends to create or update a category."""

    name: str = Field(min_length=2, max_length=100)
    description: str | None = None


class CategoryRead(BaseModel):
    """Data the API sends back."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None