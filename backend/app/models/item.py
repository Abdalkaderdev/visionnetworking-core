from sqlalchemy import Column, Integer, String, Text, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from app.database import Base

try:
    from pgvector.sqlalchemy import Vector
    EmbeddingType = Vector(1536)
except Exception:
    EmbeddingType = LargeBinary


class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)
    name = Column(String, nullable=False)
    sku = Column(String, default="")
    unit = Column(String, default="")
    description = Column(Text, default="")
    embedding = Column(EmbeddingType, nullable=True)
    brand = relationship("Brand", back_populates="items")
    prices = relationship("Price", back_populates="item", cascade="all, delete-orphan")
