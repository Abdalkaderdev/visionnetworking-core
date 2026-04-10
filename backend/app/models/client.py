from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    company = Column(String, default="")
    phone = Column(String, default="")
    email = Column(String, default="")
    city = Column(String, default="")
    notes = Column(Text, default="")
    boqs = relationship("BOQ", back_populates="client")
