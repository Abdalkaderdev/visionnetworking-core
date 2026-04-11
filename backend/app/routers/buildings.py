from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.building import Building
from app.models.user import User
from app.schemas.building import BuildingCreate, BuildingRead
from app.routers.auth import get_current_user

router = APIRouter(prefix="/buildings", tags=["buildings"])


@router.get("", response_model=list[BuildingRead])
def list_buildings(db: Session = Depends(get_db)):
    return db.query(Building).all()


@router.get("/{building_id}", response_model=BuildingRead)
def get_building(building_id: int, db: Session = Depends(get_db)):
    b = db.query(Building).filter(Building.id == building_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Building not found")
    return b


@router.post("", response_model=BuildingRead, status_code=201)
def create_building(body: BuildingCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    b = Building(**body.model_dump())
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.put("/{building_id}", response_model=BuildingRead)
def update_building(building_id: int, body: BuildingCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    b = db.query(Building).filter(Building.id == building_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Building not found")
    for k, v in body.model_dump().items():
        setattr(b, k, v)
    db.commit()
    db.refresh(b)
    return b


@router.delete("/{building_id}", status_code=204)
def delete_building(building_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    b = db.query(Building).filter(Building.id == building_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Building not found")
    db.delete(b)
    db.commit()
