from pydantic import BaseModel


class BrandCreate(BaseModel):
    company_id: int
    name: str
    category: str = ""
    logo_url: str = ""


class BrandRead(BaseModel):
    id: int
    company_id: int
    name: str
    category: str
    logo_url: str
    model_config = {"from_attributes": True}
