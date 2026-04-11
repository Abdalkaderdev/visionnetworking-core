from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.boq import BOQ
from app.models.user import User
from app.schemas.boq import BOQCreate, BOQRead, BOQStatusUpdate
from app.routers.auth import get_current_user
from app.services.storage import upload_file
from app.core.config import settings

router = APIRouter(prefix="/boqs", tags=["boqs"])

VALID_STATUSES = {"draft", "processing", "pending", "approved", "rejected", "connected"}


@router.get("", response_model=list[BOQRead])
def list_boqs(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(BOQ).order_by(BOQ.created_at.desc()).all()


@router.get("/{boq_id}", response_model=BOQRead)
def get_boq(boq_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    boq = db.query(BOQ).filter(BOQ.id == boq_id).first()
    if not boq:
        raise HTTPException(status_code=404, detail="BOQ not found")
    return boq


@router.post("", response_model=BOQRead, status_code=201)
def create_boq(body: BOQCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    boq = BOQ(**body.model_dump())
    db.add(boq)
    db.commit()
    db.refresh(boq)
    return boq


@router.post("/{boq_id}/upload", response_model=BOQRead)
def upload_boq_file(boq_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    boq = db.query(BOQ).filter(BOQ.id == boq_id).first()
    if not boq:
        raise HTTPException(status_code=404, detail="BOQ not found")
    contents = file.file.read()
    url = upload_file(contents, file.filename, settings.s3_bucket_boq)
    boq.file_url = url
    db.commit()
    db.refresh(boq)
    return boq


@router.patch("/{boq_id}/status", response_model=BOQRead)
def update_boq_status(boq_id: int, body: BOQStatusUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {VALID_STATUSES}")
    boq = db.query(BOQ).filter(BOQ.id == boq_id).first()
    if not boq:
        raise HTTPException(status_code=404, detail="BOQ not found")
    boq.status = body.status
    db.commit()
    db.refresh(boq)
    return boq
