# 🛡️ FraudGuard AI — Real-Time Fraud Detection System

A full-stack AI system for real-time transaction fraud detection with JWT authentication, per-user risk profiling, SHAP explainability, and a hybrid ML + rule-based engine.

**Live Demo:** [fraud-detection-system-wheat.vercel.app](https://fraud-detection-system-wheat.vercel.app)  
**Backend API:** [fraud-backend-wsgp.onrender.com/docs](https://fraud-backend-wsgp.onrender.com/docs)

---

## 🏗️ Architecture

```
frontend-ui/          ← React app (Vercel)
backend/
├── app.py            ← FastAPI routes (auth + ML endpoints)
├── auth.py           ← JWT login/register, password hashing
├── ml.py             ← Ensemble ML + SHAP explainability
├── models.py         ← PostgreSQL table definitions (SQLAlchemy)
├── schemas.py        ← Pydantic request/response validation
├── database.py       ← DB connection + session management
└── requirements.txt
models/               ← Trained model files (.pkl)
notebooks/
├── eda.ipynb         ← Exploratory data analysis
└── train_model.ipynb ← Model training pipeline
```

---

## ✨ Features

- **JWT Authentication** — Secure register/login with bcrypt password hashing
- **Per-User Risk Profiles** — Dynamic fraud thresholds that adapt to each user's transaction history
- **Ensemble ML Engine** — XGBoost + Random Forest + Neural Network (MLP), averaged probabilities
- **Business Rule Layer** — Explicit rules for high-amount, late-night, and international transactions on top of ML
- **SHAP Explainability** — Feature-level impact scores explaining every prediction
- **Transaction History** — Full audit trail per user stored in PostgreSQL
- **Risk Tiering** — LOW / MEDIUM / HIGH / CRITICAL classification with visual indicators
- **REST API** — FastAPI with auto-generated Swagger docs at `/docs`

---

## 🤖 ML Pipeline

**Dataset:** [Kaggle Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) — 284,807 transactions, 0.17% fraud rate

**Feature Engineering (11 features from Amount + Time):**

| Feature | Description |
|---|---|
| Amount | Transaction amount |
| Hour | Hour of day extracted from Time |
| High Amount | Binary flag for amount > ₹1,000 |
| Night Transaction | Binary flag for hour < 6 or > 22 |
| Transaction Velocity | Amount / (Time + 1) |
| Avg Amount | Amount / transactions in last hour |
| Amount Deviation | Deviation from session average |
| User Amount Deviation | Deviation from user's historical average |
| User Time Deviation | Deviation from user's typical transaction hour |
| Unusual Time | Binary flag for time deviation > 6 hours |
| Anomaly Score | Normalized deviation from user profile |

**Models:**
- `XGBoost` with `scale_pos_weight` for class imbalance
- `Random Forest` with `class_weight='balanced'`
- `MLP Neural Network` (sklearn)
- Final probability = average of all three + rule boost

**Threshold:** 0.4 (tuned for higher recall — minimizing missed fraud)

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | ❌ | Register new user, returns JWT |
| POST | `/auth/login` | ❌ | Login, returns JWT |
| GET | `/auth/me` | ✅ | Get logged-in user profile |
| POST | `/predict` | ✅ | Predict fraud probability |
| POST | `/explain` | ✅ | Get SHAP + rule explanations |
| GET | `/history` | ✅ | Get last 20 predictions |

---

## 🚀 Local Setup

### Prerequisites
- Python 3.11
- PostgreSQL
- Node.js 18+

### Backend

```bash
# Clone the repo
git clone https://github.com/sourav-ydv/fraud-detection-system
cd fraud-detection-system/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
source venv/bin/activate    # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL URL and secret key

# Run the server
uvicorn app:app --reload
```

Backend runs at `http://localhost:8000`  
Swagger docs at `http://localhost:8000/docs`

### Frontend

```bash
cd frontend-ui
npm install
npm start
```

Frontend runs at `http://localhost:3000`

### Environment Variables

```env
DATABASE_URL=postgresql://username:password@localhost:5432/frauddb
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 🧠 Model Performance

| Model | AUC-ROC | Notes |
|---|---|---|
| XGBoost | ~0.97 | Primary explainer (SHAP TreeExplainer) |
| Random Forest | ~0.96 | Most stable across thresholds |
| MLP Neural Net | ~0.95 | Captures non-linear feature interactions |
| **Ensemble** | **~0.98** | Averaged probabilities |

*Evaluated on stratified 80/20 train-test split*

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Recharts, Tailwind CSS |
| Backend | FastAPI, Python 3.11 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| ML | Scikit-learn, XGBoost, SHAP |
| Database | PostgreSQL, SQLAlchemy |
| Deployment | Render (backend), Vercel (frontend) |

---

## 📁 Dataset

The model is trained on the [Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) dataset from Kaggle (ULB). Due to size (144MB), `data/creditcard.csv` is not included in this repo. Download it from Kaggle and place it in the `data/` folder before running the training notebook.

---

## 🗺️ Roadmap

- [x] Ensemble ML model (XGBoost + RF + MLP)
- [x] SHAP explainability
- [x] JWT authentication
- [x] PostgreSQL + per-user profiles
- [x] Transaction history
- [ ] MLflow experiment tracking
- [ ] Docker Compose (full stack)
- [ ] LLM-powered natural language explanations

---

## 👤 Author

**Sourav Yadav** — [linkedin.com/in/souravydv22](https://linkedin.com/in/souravydv22) · [github.com/sourav-ydv](https://github.com/sourav-ydv)