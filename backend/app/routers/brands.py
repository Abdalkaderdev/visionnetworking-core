from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.brand import Brand
from app.models.user import User
from app.schemas.brand import BrandCreate, BrandRead
from app.routers.auth import get_current_user

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("", response_model=list[BrandRead])
def list_brands(company_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Brand)
    if company_id:
        q = q.filter(Brand.company_id == company_id)
    return q.all()


@router.get("/{brand_id}", response_model=BrandRead)
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    b = db.query(Brand).filter(Brand.id == brand_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brand not found")
    return b


@router.post("", response_model=BrandRead, status_code=201)
def create_brand(body: BrandCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    b = Brand(**body.model_dump())
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.put("/{brand_id}", response_model=BrandRead)
def update_brand(brand_id: int, body: BrandCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    b = db.query(Brand).filter(Brand.id == brand_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brand not found")
    for k, v in body.model_dump().items():
        setattr(b, k, v)
    db.commit()
    db.refresh(b)
    return b


@router.delete("/{brand_id}", status_code=204)
def delete_brand(brand_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    b = db.query(Brand).filter(Brand.id == brand_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Brand not found")
    db.delete(b)
    db.commit()
