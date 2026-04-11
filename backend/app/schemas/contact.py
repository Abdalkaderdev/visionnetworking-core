from pydantic import BaseModel
from datetime import datetime


class ContactCreate(BaseModel):
    name: str
    company: str = ""
    phone: str = ""
    email: str = ""
    message: str = ""


class ContactRead(BaseModel):
    id: int
    name: str
    company: str
    phone: str
    email: str
    message: str
    created_at: datetime
    model_config = {"from_attributes": True}
