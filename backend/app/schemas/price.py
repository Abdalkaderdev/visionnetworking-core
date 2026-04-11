from pydantic import BaseModel
from datetime import date


class PriceCreate(BaseModel):
    item_id: int
    price: float
    currency: str = "USD"
    effective_date: date | None = None


class PriceRead(BaseModel):
    id: int
    item_id: int
    price: float
    currency: str
    effective_date: date | None
    model_config = {"from_attributes": True}
