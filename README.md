# Rego-detecter-nz

Phase 1 scaffold for an end-to-end mock flow.

## Tech stack
- Frontend: React + Vite + TypeScript (ESM)
- Backend: Node.js + Express + TypeScript (ESM)
- Vision service: Python + FastAPI

All Node apps are configured with modern module syntax (`"type": "module"`) and TypeScript, so you can use `import` / `export` keywords.

## Flow
- React frontend captures webcam frame.
- Express backend receives frame and orchestrates scan.
- Python FastAPI service returns mocked rego and vehicle attributes.
- Backend compares camera-observed attributes with lookup provider data.

## Project structure

```text
Rego-detecter-nz/
	Docs/
	frontend/
	backend/
	services/
		vision-python/
	shared/
		types/
```

## Environment setup

1. Copy env files:

```bash
cd backend && cp .env.example .env
cd ../frontend && cp .env.example .env
```

2. Values can stay default for local development.

## One-command run (recommended)

From project root:

```bash
npm install
npm run dev
```

This starts all services together:
- Vision API on `http://localhost:8001`
- Backend API on `http://localhost:8000`
- Frontend on `http://localhost:5173`

## 1) Run Python vision service

```bash
cd services/vision-python
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

## 2) Run backend API

```bash
cd backend
npm install
npm run dev
```

Backend default URL: `http://localhost:8000`

## 3) Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

## 4) End-to-end behavior

- Open frontend in browser.
- Allow camera permissions.
- Click `Capture & Scan`.
- App sends one frame to backend.
- Backend calls vision service + mock lookup provider.
- UI shows detected rego, fetched vehicle details, and match status.
