from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Price(Base):
    __tablename__ = "prices"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    effective_date = Column(Date, server_default=func.current_date())
    item = relationship("Item", back_populates="prices")
