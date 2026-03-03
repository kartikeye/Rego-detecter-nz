# Project Steps Log

## 2026-03-04 01:07:54 NZDT

### What we did today
1. Tried cloning the repository using GitHub CLI:
	- `gh repo clone kartikeye/Rego-detecter-nz`
2. Checked why the command failed:
	- Bash showed exit code `127` (GitHub CLI not available in that shell/path).
	- PowerShell showed exit code `1`.
3. Switched to direct Git clone for the public repository:
	- `git clone https://github.com/kartikeye/Rego-detecter-nz.git`
4. Verified cloning was successful in:
	- `C:\Kartikeye\Practise Developement\Rego-detecter\Rego-detecter-nz`
5. Confirmed repository contents exist:
	- `.git/`, `.gitignore`, `README.md`

### Current status
- Repository is cloned successfully and ready for next development steps.

## 2026-03-04 02:19:55 NZDT

### What we did since cloning
1. Brainstormed and finalized product direction:
	- Live webcam-based NZ rego detection.
	- Vehicle details lookup via provider abstraction.
	- Camera-vs-record matching workflow to automate manual verification.
2. Created planning documentation:
	- Added full MVP architecture and phased roadmap in `Docs/Plan-of-action.md`.
3. Switched implementation to TypeScript + ESM:
	- Backend: Node.js + Express + TypeScript (import/export enabled).
	- Frontend: React + Vite + TypeScript.
	- Vision service: Python FastAPI mock service.
4. Implemented Phase 1 scaffold:
	- Added backend scan API and mock vehicle lookup provider.
	- Added scoring logic (`Likely Same`, `Manual Review`, `Possible Mismatch`).
	- Added frontend webcam UI with `Start Camera` and `Capture & Scan`.
	- Added shared type contract files.
5. Added root-level run orchestration:
	- Added root `package.json` with one-command startup (`npm run dev`) using concurrently.
	- Added `.env.example` for backend and frontend.
6. Installed dependencies and verified services:
	- Backend, frontend, and Python dependencies installed.
	- Health checks verified:
	  - Backend `http://localhost:8000/health` -> 200
	  - Vision `http://localhost:8001/health` -> 200
	  - Frontend `http://localhost:5173` -> 200
7. Improved git hygiene:
	- Updated `.gitignore` to exclude Python virtualenv and cache artifacts (`.venv/`, `__pycache__/`, etc.).
8. Added run and testing guide:
	- Wrote complete startup + testing instructions in `Docs/how-to-run.md`.

### Current status
- End-to-end TypeScript MVP scaffold is ready and runnable locally.
- App can capture webcam frame, call backend, use mock vision + mock lookup, and display matching result.

## 2026-03-04 03:35:05 NZDT

### What we did in this session
1. Reviewed live behavior from browser screenshots and identified issue:
	- App was showing generic/mock-style output and not behaving like true frame-dependent processing.
2. Upgraded vision pipeline from fixed output to real frame analysis:
	- Added vehicle-first detection flow in `services/vision-python/main.py`.
	- Added OCR attempt for rego only after vehicle is detected.
	- Added color estimation and detection notes for clearer debugging.
3. Added/updated vision dependencies:
	- Updated `services/vision-python/requirements.txt` with OpenCV, YOLO (`ultralytics`), EasyOCR.
	- Resolved dependency conflict by pinning `numpy==2.1.1`.
4. Updated backend behavior to avoid false positives:
	- In `backend/src/index.ts`, lookup/scoring now runs only when rego is actually detected.
	- Added explicit response states:
	  - `No Vehicle Detected`
	  - `Rego Not Detected`
5. Added reliability/fail-fast handling:
	- Implemented backend timeout when calling vision service.
	- Returned safe JSON response on timeout/error instead of hanging request.
6. Updated frontend rendering for new statuses:
	- Updated `frontend/src/App.tsx` and `frontend/src/styles.css` to show neutral badges and nullable lookup values.
7. Updated docs to match latest behavior:
	- Updated `README.md` and `Docs/how-to-run.md` with real processing notes and first-run model download caveat.
8. Verification performed:
	- Confirmed service health endpoints.
	- Confirmed `/api/scan` returns immediate structured response for invalid/non-car input.
	- Restarted stack and revalidated frontend/backend availability.

### Current status
- Project now has vehicle-first processing logic and safer scan response behavior.
- Remaining next-step work (for tomorrow): improve real-world plate read accuracy and integrate legal real NZ lookup source.
