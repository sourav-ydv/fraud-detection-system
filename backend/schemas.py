from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfile(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    avg_amount: float
    typical_hour: float
    total_transactions: int
    created_at: datetime

    class Config:
        from_attributes = True 


class TransactionInput(BaseModel):
    amount: float
    time: float        
    transactions_last_hour: int
    is_international: bool


class PredictionResponse(BaseModel):
    fraud: bool
    probability: float
    ml_score: float
    rule_boost: float
    risk_tier: str
    risk_label: str
    risk_color: str


class ExplanationItem(BaseModel):
    feature: str
    impact: float
    type: str           


class ExplainResponse(BaseModel):
    explanations: List[ExplanationItem]
    ml_explanations: List[ExplanationItem]
    rule_explanations: List[ExplanationItem]


class PredictionHistory(BaseModel):
    id: int
    amount: float
    hour: float
    transactions_last_hour: int
    is_international: bool
    fraud: bool
    probability: float
    risk_tier: str
    created_at: datetime

    class Config:
        from_attributes = True