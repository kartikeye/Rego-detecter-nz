import base64
import re
import threading
from typing import Any

import cv2
import easyocr
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from ultralytics import YOLO


class VisionScanRequest(BaseModel):
    frameDataUrl: str | None = None


class VisionScanResponse(BaseModel):
    vehicleDetected: bool
    vehicleConfidence: float
    rego: str
    regoConfidence: float
    observedMake: str | None
    observedModel: str | None
    observedColor: str | None
    notes: list[str]


app = FastAPI(title="Rego Detector Vision Service", version="0.2.0")

_vehicle_model: YOLO | None = None
_ocr_reader: easyocr.Reader | None = None
_load_lock = threading.Lock()

VEHICLE_CLASS_IDS = {2, 3, 5, 7}
REGO_REGEX = re.compile(r"^[A-Z0-9]{5,8}$")


def _decode_data_url(data_url: str) -> np.ndarray | None:
    if not data_url or "," not in data_url:
        return None


def _load_vehicle_model() -> YOLO:
    global _vehicle_model
    if _vehicle_model is not None:
        return _vehicle_model

    with _load_lock:
        if _vehicle_model is None:
            _vehicle_model = YOLO("yolov8n.pt")

    return _vehicle_model


def _load_ocr_reader() -> easyocr.Reader:
    global _ocr_reader
    if _ocr_reader is not None:
        return _ocr_reader

    with _load_lock:
        if _ocr_reader is None:
            _ocr_reader = easyocr.Reader(["en"], gpu=False)

    return _ocr_reader

    try:
        encoded = data_url.split(",", 1)[1]
        raw = base64.b64decode(encoded)
        arr = np.frombuffer(raw, dtype=np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return image
    except Exception:
        return None


def _detect_primary_vehicle(image: np.ndarray) -> tuple[bool, float, tuple[int, int, int, int] | None]:
    vehicle_model = _load_vehicle_model()
    results = vehicle_model.predict(source=image, conf=0.25, verbose=False)
    if not results:
        return False, 0.0, None

    result = results[0]
    if result.boxes is None or len(result.boxes) == 0:
        return False, 0.0, None

    best_conf = 0.0
    best_box: tuple[int, int, int, int] | None = None

    for box in result.boxes:
        cls_id = int(box.cls.item())
        if cls_id not in VEHICLE_CLASS_IDS:
            continue

        conf = float(box.conf.item())
        if conf > best_conf:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            best_box = (int(x1), int(y1), int(x2), int(y2))
            best_conf = conf

    return best_box is not None, best_conf, best_box


def _estimate_color_name(image: np.ndarray, box: tuple[int, int, int, int]) -> str | None:
    x1, y1, x2, y2 = box
    crop = image[max(y1, 0):max(y2, 0), max(x1, 0):max(x2, 0)]
    if crop.size == 0:
        return None

    mean_bgr = crop.reshape(-1, 3).mean(axis=0)
    b, g, r = float(mean_bgr[0]), float(mean_bgr[1]), float(mean_bgr[2])

    if max(r, g, b) < 60:
        return "Black"
    if min(r, g, b) > 190:
        return "White"
    if abs(r - g) < 15 and abs(g - b) < 15:
        return "Grey"
    if r > g and r > b:
        return "Red"
    if g > r and g > b:
        return "Green"
    if b > r and b > g:
        return "Blue"
    return "Unknown"


def _extract_rego_text(image: np.ndarray, box: tuple[int, int, int, int] | None) -> tuple[str, float]:
    search_regions: list[np.ndarray] = [image]

    if box is not None:
        x1, y1, x2, y2 = box
        vehicle_crop = image[max(y1, 0):max(y2, 0), max(x1, 0):max(x2, 0)]
        if vehicle_crop.size > 0:
            search_regions.insert(0, vehicle_crop)

    best_rego = ""
    best_conf = 0.0
    ocr_reader = _load_ocr_reader()

    for region in search_regions:
        text_items: list[Any] = ocr_reader.readtext(region, detail=1, paragraph=False)
        for item in text_items:
            _bbox, text, confidence = item
            candidate = re.sub(r"[^A-Za-z0-9]", "", text).upper()
            if not REGO_REGEX.match(candidate):
                continue

            conf = float(confidence)
            if conf > best_conf:
                best_rego = candidate
                best_conf = conf

    return best_rego, best_conf


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "vision-python",
        "vehicleModelLoaded": _vehicle_model is not None,
        "ocrModelLoaded": _ocr_reader is not None,
    }


@app.post("/vision/scan", response_model=VisionScanResponse)
def scan(payload: VisionScanRequest):
    notes: list[str] = []
    frame = _decode_data_url(payload.frameDataUrl or "")
    if frame is None:
        return VisionScanResponse(
            vehicleDetected=False,
            vehicleConfidence=0.0,
            rego="",
            regoConfidence=0.0,
            observedMake=None,
            observedModel=None,
            observedColor=None,
            notes=["Invalid frame data"],
        )

    try:
        vehicle_detected, vehicle_confidence, vehicle_box = _detect_primary_vehicle(frame)
    except Exception as error:
        return VisionScanResponse(
            vehicleDetected=False,
            vehicleConfidence=0.0,
            rego="",
            regoConfidence=0.0,
            observedMake=None,
            observedModel=None,
            observedColor=None,
            notes=[f"Vehicle model not ready: {error}"],
        )
    if not vehicle_detected:
        return VisionScanResponse(
            vehicleDetected=False,
            vehicleConfidence=0.0,
            rego="",
            regoConfidence=0.0,
            observedMake=None,
            observedModel=None,
            observedColor=None,
            notes=["No vehicle detected in frame"],
        )

    observed_color = _estimate_color_name(frame, vehicle_box) if vehicle_box else None
    try:
        rego, rego_confidence = _extract_rego_text(frame, vehicle_box)
    except Exception as error:
        rego, rego_confidence = "", 0.0
        notes.append(f"OCR unavailable: {error}")

    if not rego:
        notes.append("Vehicle detected but rego could not be read")

    return VisionScanResponse(
        vehicleDetected=True,
        vehicleConfidence=round(vehicle_confidence, 3),
        rego=rego,
        regoConfidence=round(rego_confidence, 3),
        observedMake=None,
        observedModel=None,
        observedColor=observed_color,
        notes=notes,
    )
