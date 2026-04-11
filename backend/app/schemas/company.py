from pydantic import BaseModel


class CompanyCreate(BaseModel):
    building_id: int
    name: str
    description: str = ""


class CompanyRead(BaseModel):
    id: int
    building_id: int
    name: str
    description: str
    model_config = {"from_attributes": True}
