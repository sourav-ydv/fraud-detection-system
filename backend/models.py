from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name       = Column(String, nullable=True)

    avg_amount            = Column(Float, default=500.0)
    typical_hour          = Column(Float, default=14.0)
    total_transactions    = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    predictions = relationship("Prediction", back_populates="owner")


class Prediction(Base):
    __tablename__ = "predictions"

    id                     = Column(Integer, primary_key=True, index=True)
    user_id                = Column(Integer, ForeignKey("users.id"), nullable=False)

    amount                 = Column(Float, nullable=False)
    hour                   = Column(Float, nullable=False)
    transactions_last_hour = Column(Integer, nullable=False)
    is_international       = Column(Boolean, nullable=False)

    fraud                  = Column(Boolean, nullable=False)
    probability            = Column(Float, nullable=False)
    ml_score               = Column(Float, nullable=False)
    rule_boost             = Column(Float, nullable=False)
    risk_tier              = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="predictions")