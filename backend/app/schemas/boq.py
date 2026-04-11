from pydantic import BaseModel
from datetime import datetime


class BOQCreate(BaseModel):
    client_id: int
    notes: str = ""


class BOQItemRead(BaseModel):
    id: int
    boq_id: int
    item_id: int | None
    raw_name: str
    quantity: float
    unit: str
    matched: bool
    model_config = {"from_attributes": True}


class BOQRead(BaseModel):
    id: int
    client_id: int
    status: str
    file_url: str
    notes: str
    created_at: datetime
    items: list[BOQItemRead] = []
    model_config = {"from_attributes": True}


class BOQStatusUpdate(BaseModel):
    status: str
