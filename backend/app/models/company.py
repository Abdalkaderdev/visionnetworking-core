from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    building = relationship("Building", back_populates="companies")
    brands = relationship("Brand", back_populates="company", cascade="all, delete-orphan")
