from pydantic import BaseModel


class BuildingCreate(BaseModel):
    name: str
    location: str
    description: str = ""


class BuildingRead(BaseModel):
    id: int
    name: str
    location: str
    description: str
    model_config = {"from_attributes": True}
