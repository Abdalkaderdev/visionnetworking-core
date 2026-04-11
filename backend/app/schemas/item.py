from pydantic import BaseModel


class ItemCreate(BaseModel):
    brand_id: int
    name: str
    sku: str = ""
    unit: str = ""
    description: str = ""


class ItemRead(BaseModel):
    id: int
    brand_id: int
    name: str
    sku: str
    unit: str
    description: str
    model_config = {"from_attributes": True}
