from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Contact(Base):
    __tablename__ = "contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    company = Column(String, default="")
    phone = Column(String, default="")
    email = Column(String, default="")
    message = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
