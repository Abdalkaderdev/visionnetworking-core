from sqlalchemy import Column, Integer, String, Text, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class BOQ(Base):
    __tablename__ = "boqs"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    status = Column(String, default="draft")
    file_url = Column(String, default="")
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    client = relationship("Client", back_populates="boqs")
    items = relationship("BOQItem", back_populates="boq", cascade="all, delete-orphan")


class BOQItem(Base):
    __tablename__ = "boq_items"
    id = Column(Integer, primary_key=True, index=True)
    boq_id = Column(Integer, ForeignKey("boqs.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    raw_name = Column(String, nullable=False)
    quantity = Column(Float, default=1)
    unit = Column(String, default="")
    matched = Column(Boolean, default=False)
    boq = relationship("BOQ", back_populates="items")
