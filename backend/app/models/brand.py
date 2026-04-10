from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Brand(Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, default="")
    logo_url = Column(String, default="")
    company = relationship("Company", back_populates="brands")
    items = relationship("Item", back_populates="brand", cascade="all, delete-orphan")
