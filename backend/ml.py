import numpy as np
import joblib
import shap
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

xgb    = joblib.load(os.path.join(BASE_DIR, "models/xgb.pkl"))
rf     = joblib.load(os.path.join(BASE_DIR, "models/rf.pkl"))
nn     = joblib.load(os.path.join(BASE_DIR, "models/nn.pkl"))
scaler = joblib.load(os.path.join(BASE_DIR, "models/scaler.pkl"))

explainer = shap.TreeExplainer(xgb)

FEATURE_NAMES = [
    "Amount", "Hour", "High Amount", "Night Transaction",
    "Transaction Velocity", "Avg Amount", "Amount Deviation",
    "User Amount Deviation", "User Time Deviation",
    "Unusual Time", "Anomaly Score",
]


def create_features(amount: float, time: float, transactions: int, user_avg: float, user_hour: float) -> np.ndarray:
    hour            = time % 24
    is_high_amount  = 1 if amount > 1000 else 0
    is_night        = 1 if hour < 6 or hour > 22 else 0
    tx_velocity     = amount / (time + 1)
    avg_amount      = amount / max(transactions, 1)
    amount_dev      = amount - avg_amount
    amount_dev_user = amount - user_avg
    time_dev_user   = abs(hour - user_hour)
    is_unusual_time = 1 if time_dev_user > 6 else 0
    anomaly_score   = abs(amount_dev_user) / (user_avg + 1)

    return np.array([
        amount, hour, is_high_amount, is_night, tx_velocity,
        avg_amount, amount_dev, amount_dev_user,
        time_dev_user, is_unusual_time, anomaly_score,
    ]).reshape(1, -1)


def compute_rule_boost(amount: float, time: float, transactions: int, is_international: bool, user_avg: float) -> float:
    boost = 0.0
    hour  = time % 24

    if amount > 100000:   boost += 0.35
    elif amount > 10000:  boost += 0.20
    elif amount > 5000:   boost += 0.10

    ratio = amount / user_avg
    if ratio > 50:   boost += 0.25
    elif ratio > 20: boost += 0.15
    elif ratio > 10: boost += 0.08

    if transactions > 30:   boost += 0.25
    elif transactions > 20: boost += 0.15
    elif transactions > 10: boost += 0.08

    if is_international: boost += 0.15

    if (hour < 4 or hour > 23) and amount > 1000:
        boost += 0.15

    return boost


def get_risk_tier(probability: float) -> dict:
    if probability >= 0.75:
        return {"tier": "CRITICAL", "label": "Critical Risk", "color": "critical"}
    elif probability >= 0.50:
        return {"tier": "HIGH",     "label": "High Risk",     "color": "high"}
    elif probability >= 0.25:
        return {"tier": "MEDIUM",   "label": "Medium Risk",   "color": "medium"}
    else:
        return {"tier": "LOW",      "label": "Low Risk",      "color": "low"}


def run_prediction(amount, time, transactions, is_international, user_avg, user_hour):
    features        = create_features(amount, time, transactions, user_avg, user_hour)
    features_scaled = scaler.transform(features)

    p1 = xgb.predict_proba(features_scaled)[0][1]
    p2 = rf.predict_proba(features_scaled)[0][1]
    p3 = nn.predict_proba(features_scaled)[0][1]

    ml_probability = (p1 + p2 + p3) / 3
    rule_boost     = compute_rule_boost(amount, time, transactions, is_international, user_avg)
    final_prob     = min(ml_probability + rule_boost, 1.0)
    risk           = get_risk_tier(final_prob)

    return {
        "fraud":       bool(final_prob > 0.4),
        "probability": round(float(final_prob), 4),
        "ml_score":    round(float(ml_probability), 4),
        "rule_boost":  round(float(rule_boost), 4),
        "risk_tier":   risk["tier"],
        "risk_label":  risk["label"],
        "risk_color":  risk["color"],
    }


def run_explanation(amount, time, transactions, is_international, user_avg, user_hour):
    features        = create_features(amount, time, transactions, user_avg, user_hour)
    features_scaled = scaler.transform(features)
    shap_values     = explainer.shap_values(features_scaled)[0]
    hour            = time % 24

    rule_contributions = []
    if amount > 5000:
        rule_contributions.append({"feature": "High Transaction Amount",  "impact": min((amount - 5000) / 50000, 1.0), "type": "rule"})
    ratio = amount / user_avg
    if ratio > 5:
        rule_contributions.append({"feature": "Unusual Spend vs Profile", "impact": min((ratio - 5) / 50, 0.8),        "type": "rule"})
    if transactions > 10:
        rule_contributions.append({"feature": "High Transaction Frequency","impact": min((transactions - 10) / 30, 0.7),"type": "rule"})
    if is_international:
        rule_contributions.append({"feature": "International Transaction", "impact": 0.15,                              "type": "rule"})
    if (hour < 4 or hour > 23) and amount > 1000:
        rule_contributions.append({"feature": "Late Night High Amount",    "impact": 0.15,                              "type": "rule"})

    ml_explanation = sorted(
        [{"feature": FEATURE_NAMES[i], "impact": round(float(v), 6), "type": "ml"} for i, v in enumerate(shap_values)],
        key=lambda x: abs(x["impact"]), reverse=True
    )[:5]

    all_explanations = sorted(rule_contributions + ml_explanation, key=lambda x: abs(x["impact"]), reverse=True)

    return {
        "explanations":      all_explanations,
        "ml_explanations":   ml_explanation,
        "rule_explanations": rule_contributions,
    }