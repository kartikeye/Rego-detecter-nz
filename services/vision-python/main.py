from fastapi import FastAPI
from pydantic import BaseModel


class VisionScanRequest(BaseModel):
    frameDataUrl: str | None = None


class VisionScanResponse(BaseModel):
    rego: str
    regoConfidence: float
    observedMake: str | None
    observedModel: str | None
    observedColor: str | None


app = FastAPI(title="Rego Detector Vision Mock", version="0.1.0")


@app.get("/health")
def health():
    return {"ok": True, "service": "vision-python"}


@app.post("/vision/scan", response_model=VisionScanResponse)
def scan(_payload: VisionScanRequest):
    return VisionScanResponse(
        rego="ABC123",
        regoConfidence=0.93,
        observedMake="Toyota",
        observedModel="Prius",
        observedColor="Black",
    )
