# FraudGuard AI – Real-Time Fraud Detection System

An **AI-powered full-stack fraud detection system** that analyzes financial transactions in real-time and provides **risk scoring + explainable insights (SHAP)**.

🔗 **Live Demo:** https://fraud-detection-system-wheat.vercel.app
🔗 **Backend API Docs:** https://fraud-backend-wsgp.onrender.com/docs

---

## Overview

FraudGuard AI is designed to simulate a **production-level financial fraud detection system**.
It combines machine learning models with rule-based logic to deliver:

* Real-time transaction risk analysis
* Explainable AI (SHAP-based insights)
* Risk scoring with detailed breakdown
* Interactive and modern UI dashboard

---

## Key Features

* **Real-Time Prediction** – Instant fraud detection via deployed API
* **Explainable AI** – SHAP-based feature impact analysis
* **Risk Scoring Engine** – Combines ML + rule-based boosting
* **Full-Stack Deployment** – Live frontend + backend
* **Modern UI Dashboard** – Clean, responsive, and intuitive design

---

## Tech Stack

### 🔹 Frontend

* React.js
* Tailwind CSS

### 🔹 Backend

* FastAPI
* Uvicorn

### 🔹 Machine Learning

* Scikit-learn
* XGBoost
* Neural Networks
* SHAP (Explainability)

### 🔹 Deployment

* Frontend → Vercel
* Backend → Render
* Version Control → GitHub

---

## System Architecture

User Input → React Frontend → FastAPI Backend → ML Models → Prediction + SHAP → UI Display

---

## How It Works

1. User inputs transaction details:

   * Amount
   * Time of day
   * Transaction frequency
   * International flag

2. Backend processes input:

   * Applies feature engineering
   * Runs ML models
   * Calculates fraud probability

3. Risk Engine:

   * Combines ML score + rule-based logic
   * Generates final risk score

4. Explainability:

   * SHAP values identify key contributing factors

5. Frontend displays:

   * Risk level (Normal / Suspicious / Critical)
   * Probability score
   * Triggered risk factors

---

## Getting Started (Local Setup)

### 🔹 Clone the repository

```bash
git clone https://github.com/sourav-ydv/fraud-detection-system.git
cd fraud-detection-system
```

---

### 🔹 Backend Setup

```bash
cd backend
pip install -r ../requirements.txt
uvicorn app:app --reload
```

---

### 🔹 Frontend Setup

```bash
cd frontend-ui
npm install
npm start
```

---

## Deployment

* **Frontend:** Hosted on Vercel
* **Backend:** Hosted on Render

---

## Use Cases

* Financial fraud detection systems
* Banking transaction monitoring
* Risk analysis dashboards
* AI explainability demonstrations

---

## Future Improvements

* User authentication (JWT)
* Database integration (MongoDB/PostgreSQL)
* Advanced analytics dashboard
* Real-time alerts (email/SMS)
* Docker containerization

---

## Author

**Sourav Yadav**
IIIT Senapati

