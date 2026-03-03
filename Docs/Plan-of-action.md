# Rego Detector NZ - Plan of Action (MVP)

## 1) Product goal
Build a web application that can:
1. Read NZ vehicle rego from live camera feed.
2. Check if the vehicle may be stolen (based on available data source).
3. Compare what camera sees (vehicle attributes) vs fetched rego details.
4. Show a confidence-based result so manual checking is faster.

---

## 2) MVP scope (Version 1)
### In scope
- Laptop webcam input.
- Rego detection from selected frames.
- Backend lookup using a configurable data provider layer.
- Basic vehicle attribute extraction from camera image (make/model/color if possible).
- Match score between camera-observed vehicle and fetched record.
- UI dashboard with: live preview, detected rego, lookup result, match result, and action status.

### Out of scope (for now)
- Multi-camera fleet support.
- Mobile app.
- Real-time alert integrations (SMS, WhatsApp, etc.).
- Full forensic-grade recognition accuracy.

---

## 3) Recommended architecture

### Frontend
- React.js app.
- Captures webcam stream.
- Sends frames/snapshots to backend every N milliseconds (start with 1 frame per second).
- Displays pipeline output and confidence values.

### Backend API
- Node.js + Express.js.
- Responsibilities:
	- Receive image frames.
	- Call ANPR/OCR service.
	- Call vehicle lookup provider.
	- Compare attributes and generate decision score.
	- Return structured response to frontend.

### Vision/OCR microservice (optional but recommended)
- Python service (FastAPI) for plate detection + OCR and optional vehicle attribute extraction.
- Reason: Python ecosystem is stronger for CV (OpenCV, YOLO, OCR libraries).

### Data store
- Start with SQLite or PostgreSQL.
- Store:
	- Scan events
	- Detected rego + confidence
	- Lookup response snapshot
	- Final decision

### Queue (later)
- Add Redis/BullMQ only if frame processing starts lagging.

---

## 4) Detection and verification pipeline
1. Capture frame from webcam.
2. Detect plate region.
3. OCR plate text.
4. Normalize text (remove spaces/hyphens, uppercase).
5. Lookup vehicle details from provider interface.
6. Extract vehicle visual attributes from frame.
7. Compare visual attributes with lookup response.
8. Generate final status:
	 - Match likely
	 - Mismatch likely
	 - Insufficient confidence

---

## 5) Data provider strategy (important)
- Implement lookup via a provider abstraction:
	- `VehicleLookupProvider` interface.
	- `MockProvider` for development/testing.
	- `RealProvider` only through legal/allowed API access.
- Do not hard-code a single website scraping flow inside core logic.
- Keep provider response normalized:
	- rego
	- make
	- model
	- year
	- color
	- stolen_flag (if available)
	- source

---

## 6) Compliance and risk notes
- Verify legal terms and allowed usage for any data source before automation.
- Log source and timestamp for every fetched result.
- Keep a manual-review mode in UI for low-confidence cases.
- Never return "stolen confirmed" as absolute truth; show confidence and source-based status.

---

## 7) Suggested repo structure

```
Rego-detecter-nz/
	Docs/
	frontend/                 # React app
	backend/                  # Express API
	services/
		vision-python/          # FastAPI (OCR + attribute extraction)
	shared/
		types/                  # shared interfaces/schemas
	infra/
		docker/                 # docker-compose, env templates
```

---

## 8) Build phases

### Phase 0 - Foundation (Day 1)
- Create monorepo folders.
- Setup React + Express basic apps.
- Define shared request/response schema.
- Add health endpoints.

### Phase 1 - Plate read MVP (Days 2-4)
- Webcam capture in frontend.
- Frame upload endpoint in backend.
- OCR integration (Python service or temporary OCR API).
- Show detected rego + confidence in UI.

### Phase 2 - Lookup integration (Days 5-6)
- Build provider interface and mock provider first.
- Add real provider integration when legally permitted.
- Show fetched vehicle details in UI.

### Phase 3 - Vehicle match logic (Days 7-9)
- Add visual attribute extraction.
- Implement weighted match score:
	- Rego confidence
	- Make/model consistency
	- Color consistency
- Surface result as: Green / Amber / Red.

### Phase 4 - Stabilize (Days 10-12)
- Save scan history.
- Add retry and timeout handling.
- Add confidence thresholds and manual review flow.
- Basic testing and performance checks.

---

## 9) MVP API contracts (initial)

### `POST /api/scan`
Input:
- image/frame
- camera_id
- timestamp

Output:
- detected_rego
- rego_confidence
- lookup_details
- visual_attributes
- match_score
- status
- notes

### `GET /api/scans`
- Returns recent scan history.

---

## 10) First implementation tasks (next actions)
1. Initialize folders: `frontend`, `backend`, `services/vision-python`, `shared/types`.
2. Scaffold React app in `frontend`.
3. Scaffold Express app in `backend`.
4. Add simple `POST /api/scan` with mock response.
5. Connect frontend webcam snapshot -> backend endpoint.
6. Display detected result card in UI.

---

## 11) Success criteria for MVP
- App can read rego from webcam frames with visible confidence.
- App can fetch or simulate vehicle record via provider interface.
- App can show comparison result and confidence-driven status.
- User can review recent scans and quickly decide next action.
