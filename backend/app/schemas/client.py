from pydantic import BaseModel


class ClientCreate(BaseModel):
    name: str
    company: str = ""
    phone: str = ""
    email: str = ""
    city: str = ""
    notes: str = ""


class ClientRead(BaseModel):
    id: int
    name: str
    company: str
    phone: str
    email: str
    city: str
    notes: str
    model_config = {"from_attributes": True}
