import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth, ml
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FraudGuard AI",
    description="Real-time fraud detection with JWT auth, per-user profiles, and SHAP explainability",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "FraudGuard AI v2.0 Running", "docs": "/docs"}


@app.post("/auth/register", response_model=schemas.Token)
def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user.
    - Checks email isn't already taken
    - Hashes password before storing
    - Returns JWT token immediately (no separate login needed)
    """
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please login instead."
        )

    new_user = models.User(
        email           = user_data.email,
        hashed_password = auth.hash_password(user_data.password),
        full_name       = user_data.full_name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Login with email + password.
    Returns JWT token on success.
    Deliberately vague error message (don't reveal if email exists).
    """
    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.UserProfile)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    """Returns the logged-in user's profile. Protected route."""
    return current_user


@app.post("/predict", response_model=schemas.PredictionResponse)
def predict(
    data: schemas.TransactionInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Predict fraud probability for a transaction.
    - Uses per-user avg_amount and typical_hour (not hardcoded anymore)
    - Saves prediction to DB for history tracking
    - Updates user profile with new transaction data
    """
    result = ml.run_prediction(
        amount         = data.amount,
        time           = data.time,
        transactions   = data.transactions_last_hour,
        is_international = data.is_international,
        user_avg       = current_user.avg_amount,
        user_hour      = current_user.typical_hour,
    )

    prediction_record = models.Prediction(
        user_id                = current_user.id,
        amount                 = data.amount,
        hour                   = data.time % 24,
        transactions_last_hour = data.transactions_last_hour,
        is_international       = data.is_international,
        fraud                  = result["fraud"],
        probability            = result["probability"],
        ml_score               = result["ml_score"],
        rule_boost             = result["rule_boost"],
        risk_tier              = result["risk_tier"],
    )
    db.add(prediction_record)

    n = current_user.total_transactions
    current_user.avg_amount   = (current_user.avg_amount * n + data.amount) / (n + 1)
    current_user.typical_hour = (current_user.typical_hour * n + (data.time % 24)) / (n + 1)
    current_user.total_transactions += 1

    db.commit()

    return result


@app.post("/explain", response_model=schemas.ExplainResponse)
def explain(
    data: schemas.TransactionInput,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns SHAP + rule-based explanation for a transaction.
    Uses per-user profile for accurate explanations.
    """
    result = ml.run_explanation(
        amount           = data.amount,
        time             = data.time,
        transactions     = data.transactions_last_hour,
        is_international = data.is_international,
        user_avg         = current_user.avg_amount,
        user_hour        = current_user.typical_hour,
    )
    return result



@app.get("/history", response_model=List[schemas.PredictionHistory])
def get_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns last `limit` transactions for the logged-in user.
    New endpoint — didn't exist in v1.
    """
    predictions = (
        db.query(models.Prediction)
        .filter(models.Prediction.user_id == current_user.id)
        .order_by(models.Prediction.created_at.desc())
        .limit(limit)
        .all()
    )
    return predictions