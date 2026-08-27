# 🛠️ AgentPay Setup & Developer Guide

## Prerequisites
- **Python**: 3.10+ (Current system: Python 3.12)
- **Node.js**: 18+ (Current system: Node.js 24)
- **PostgreSQL** or local SQLite fallback

## Quickstart

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```
API Documentation: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Dashboard will be available at `http://localhost:5173`.
