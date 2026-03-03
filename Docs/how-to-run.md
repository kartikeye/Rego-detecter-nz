# How to Run and Test the App

## 1) Prerequisites

- Node.js 18+ (recommended latest LTS)
- npm
- Python 3.11+

---

## 2) Open the correct folder

Important: run commands from the project root, not from parent folders.

```bash
cd "C:/Kartikeye/Practise Developement/Rego-detecter/Rego-detecter-nz"
```

If you run `npm run dev` from `Rego-detecter` (one level above), it will fail.

---

## 3) First-time setup

### Install root dependencies
```bash
npm install
```

### Install backend/frontend dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Setup Python vision environment
```bash
cd services/vision-python
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt
cd ../..
```

### Create local env files (if missing)
```bash
cd backend && cp -n .env.example .env
cd ../frontend && cp -n .env.example .env
cd ..
```

---

## 4) Start all services (one command)

From project root:

```bash
npm run dev
```

This starts:
- Vision service: `http://localhost:8001`
- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:5173`

---

## 5) Quick health checks

In a separate terminal:

```bash
curl http://localhost:8001/health
curl http://localhost:8000/health
```

Expected response examples:
- Vision: `{"ok":true,"service":"vision-python"}`
- Backend: `{"ok":true,"service":"backend","provider":"mock"}`

---

## 6) Test from UI (webcam flow)

1. Open `http://localhost:5173` in browser.
2. Click **Start Camera** and allow camera permission.
3. Click **Capture & Scan**.
4. Verify result card appears with:
	 - Detected rego
	 - Lookup details
	 - Match score
	 - Status badge (`Likely Same`, `Manual Review`, or `Possible Mismatch`)

Note: vision now processes the captured frame. If your frame does not contain a car, status should be `No Vehicle Detected`. If car is visible but rego is unreadable, status should be `Rego Not Detected`.

---

## 7) Optional API test without UI

You can test backend scan endpoint directly:

```bash
curl -X POST http://localhost:8000/api/scan \
	-H "Content-Type: application/json" \
	-d '{"frameDataUrl":"data:image/jpeg;base64,test"}'
```

Expected: JSON with `detectedRego`, `lookupDetails`, `matchScore`, and `status`.

---

## 8) Common issues

### `npm run dev` fails with command not found or wrong folder
- Ensure current path is exactly:
	`C:/Kartikeye/Practise Developement/Rego-detecter/Rego-detecter-nz`

### Port already in use (`EADDRINUSE`)
- Stop old processes and run again.
- Check ports 5173, 8000, 8001 are free.

### Vision service fails
- Re-run Python setup in `services/vision-python`.
- Confirm `.venv/Scripts/python.exe` exists.
- First run may download YOLO model weights; keep internet on for that initial download.

### Camera not opening
- Check browser camera permission.
- Close other apps using webcam.

