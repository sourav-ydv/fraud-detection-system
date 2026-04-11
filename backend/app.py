from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import joblib
import shap
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Fraud Detection API")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

xgb = joblib.load(os.path.join(BASE_DIR, "models/xgb.pkl"))
rf = joblib.load(os.path.join(BASE_DIR, "models/rf.pkl"))
nn = joblib.load(os.path.join(BASE_DIR, "models/nn.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "models/scaler.pkl"))

explainer = shap.TreeExplainer(xgb)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InputData(BaseModel):
    amount: float
    time: float
    transactions_last_hour: int
    is_international: bool

USER_PROFILE = {
    "avg_amount": 500,
    "typical_hour": 14,
    "max_hourly_transactions": 10,
}

FEATURE_NAMES = [
    "Amount",
    "Hour",
    "High Amount",
    "Night Transaction",
    "Transaction Velocity",
    "Avg Amount",
    "Amount Deviation",
    "User Amount Deviation",
    "User Time Deviation",
    "Unusual Time",
    "Anomaly Score",
]


def create_features(data: InputData) -> np.ndarray:
    amount = data.amount
    hour = data.time % 24
    transactions = data.transactions_last_hour

    is_high_amount = 1 if amount > 1000 else 0
    is_night = 1 if hour < 6 or hour > 22 else 0
    transaction_velocity = amount / (data.time + 1)
    avg_amount = amount / max(transactions, 1)
    amount_deviation = amount - avg_amount
    amount_dev_user = amount - USER_PROFILE["avg_amount"]
    time_dev_user = abs(hour - USER_PROFILE["typical_hour"])
    is_unusual_time = 1 if time_dev_user > 6 else 0
    anomaly_score = abs(amount_dev_user) / (USER_PROFILE["avg_amount"] + 1)

    return np.array([
        amount,
        hour,
        is_high_amount,
        is_night,
        transaction_velocity,
        avg_amount,
        amount_deviation,
        amount_dev_user,
        time_dev_user,
        is_unusual_time,
        anomaly_score,
    ]).reshape(1, -1)


def compute_rule_boost(data: InputData) -> float:
    """
    Business-rule layer on top of ML probability.
    Real fraud systems always combine ML + rules.
    """
    boost = 0.0
    hour = data.time % 24

    # High amount tiers
    if data.amount > 100000:
        boost += 0.35
    elif data.amount > 10000:
        boost += 0.20
    elif data.amount > 5000:
        boost += 0.10

    # Unusual amount relative to user profile
    ratio = data.amount / USER_PROFILE["avg_amount"]
    if ratio > 50:
        boost += 0.25
    elif ratio > 20:
        boost += 0.15
    elif ratio > 10:
        boost += 0.08

    # High transaction frequency
    if data.transactions_last_hour > 30:
        boost += 0.25
    elif data.transactions_last_hour > 20:
        boost += 0.15
    elif data.transactions_last_hour > 10:
        boost += 0.08

    # International flag
    if data.is_international:
        boost += 0.15

    # Night-time high amount (combined signal — more suspicious)
    if (hour < 4 or hour > 23) and data.amount > 1000:
        boost += 0.15

    return boost


def get_risk_tier(probability: float) -> dict:
    if probability >= 0.75:
        return {"tier": "CRITICAL", "label": "🚨 Critical Risk", "color": "critical"}
    elif probability >= 0.50:
        return {"tier": "HIGH", "label": "⚠️ High Risk", "color": "high"}
    elif probability >= 0.25:
        return {"tier": "MEDIUM", "label": "⚡ Medium Risk", "color": "medium"}
    else:
        return {"tier": "LOW", "label": "✅ Low Risk", "color": "low"}


@app.get("/")
def home():
    return {"message": "Fraud Detection API Running", "version": "2.0"}


@app.post("/predict")
def predict(data: InputData):
    features = create_features(data)
    features_scaled = scaler.transform(features)

    p1 = xgb.predict_proba(features_scaled)[0][1]
    p2 = rf.predict_proba(features_scaled)[0][1]
    p3 = nn.predict_proba(features_scaled)[0][1]

    ml_probability = (p1 + p2 + p3) / 3
    rule_boost = compute_rule_boost(data)

    # Blend: ML handles patterns, rules handle edge cases
    # Weight: 60% ML, 40% rule boost (capped at 1.0)
    final_probability = min(ml_probability * 0.6 + rule_boost * 0.4 + ml_probability, 1.0)
    # Simpler and clearer: add boost directly
    final_probability = min(ml_probability + rule_boost, 1.0)

    prediction = int(final_probability > 0.4)
    risk = get_risk_tier(final_probability)

    return {
        "fraud": prediction,
        "probability": round(float(final_probability), 4),
        "ml_score": round(float(ml_probability), 4),
        "rule_boost": round(float(rule_boost), 4),
        "risk_tier": risk["tier"],
        "risk_label": risk["label"],
        "risk_color": risk["color"],
    }


@app.post("/explain")
def explain(data: InputData):
    features = create_features(data)
    features_scaled = scaler.transform(features)

    shap_values = explainer.shap_values(features_scaled)[0]

    rule_contributions = []
    hour = data.time % 24

    if data.amount > 5000:
        rule_contributions.append({
            "feature": "High Transaction Amount",
            "impact": min((data.amount - 5000) / 50000, 1.0),
            "type": "rule",
        })

    ratio = data.amount / USER_PROFILE["avg_amount"]
    if ratio > 5:
        rule_contributions.append({
            "feature": "Unusual Spend vs Profile",
            "impact": min((ratio - 5) / 50, 0.8),
            "type": "rule",
        })

    if data.transactions_last_hour > 10:
        rule_contributions.append({
            "feature": "High Transaction Frequency",
            "impact": min((data.transactions_last_hour - 10) / 30, 0.7),
            "type": "rule",
        })

    if data.is_international:
        rule_contributions.append({
            "feature": "International Transaction",
            "impact": 0.15,
            "type": "rule",
        })

    if (hour < 4 or hour > 23) and data.amount > 1000:
        rule_contributions.append({
            "feature": "Late Night High Amount",
            "impact": 0.15,
            "type": "rule",
        })

    ml_explanation = []
    for i, val in enumerate(shap_values):
        ml_explanation.append({
            "feature": FEATURE_NAMES[i],
            "impact": round(float(val), 6),
            "type": "ml",
        })

    ml_explanation.sort(key=lambda x: abs(x["impact"]), reverse=True)
    top_ml = ml_explanation[:5]

    all_explanations = rule_contributions + top_ml
    all_explanations.sort(key=lambda x: abs(x["impact"]), reverse=True)

    return {
        "explanations": all_explanations,
        "ml_explanations": top_ml,
        "rule_explanations": rule_contributions,
    }