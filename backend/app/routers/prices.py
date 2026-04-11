from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.price import Price
from app.models.user import User
from app.schemas.price import PriceCreate, PriceRead
from app.routers.auth import get_current_user

router = APIRouter(prefix="/prices", tags=["prices"])


@router.get("", response_model=list[PriceRead])
def list_prices(item_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Price)
    if item_id:
        q = q.filter(Price.item_id == item_id)
    return q.all()


@router.post("", response_model=PriceRead, status_code=201)
def create_price(body: PriceCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    price = Price(**body.model_dump())
    db.add(price)
    db.commit()
    db.refresh(price)
    return price


@router.delete("/{price_id}", status_code=204)
def delete_price(price_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    price = db.query(Price).filter(Price.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Price not found")
    db.delete(price)
    db.commit()
