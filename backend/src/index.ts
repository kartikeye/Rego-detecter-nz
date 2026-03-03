import "dotenv/config";
import cors from "cors";
import express from "express";
import { MockVehicleLookupProvider } from "./providers/mockVehicleLookupProvider.js";
import { buildScanResult } from "./services/scoring.js";
import type { VisionScanResult } from "./types.js";

const app = express();
const port = Number(process.env.PORT ?? 8000);
const visionServiceUrl = process.env.VISION_SERVICE_URL ?? "http://localhost:8001";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const lookupProvider = new MockVehicleLookupProvider();

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend", provider: lookupProvider.name });
});

app.post("/api/scan", async (req, res) => {
  try {
    const frameDataUrl = typeof req.body?.frameDataUrl === "string" ? req.body.frameDataUrl : "";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const visionResponse = await fetch(`${visionServiceUrl}/vision/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frameDataUrl }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!visionResponse.ok) {
      return res.status(502).json({
        vehicleDetected: false,
        vehicleConfidence: 0,
        detectedRego: "",
        regoConfidence: 0,
        lookupDetails: null,
        visualAttributes: { make: null, model: null, color: null },
        matchScore: 0,
        status: "No Vehicle Detected",
        notes: ["Vision service failed"]
      });
    }

    const vision = (await visionResponse.json()) as VisionScanResult;
    if (!vision.vehicleDetected) {
      return res.json({
        vehicleDetected: false,
        vehicleConfidence: 0,
        detectedRego: "",
        regoConfidence: 0,
        lookupDetails: null,
        visualAttributes: {
          make: null,
          model: null,
          color: null
        },
        matchScore: 0,
        status: "No Vehicle Detected",
        notes: vision.notes
      });
    }

    if (!vision.rego) {
      return res.json({
        vehicleDetected: true,
        vehicleConfidence: vision.vehicleConfidence,
        detectedRego: "",
        regoConfidence: 0,
        lookupDetails: null,
        visualAttributes: {
          make: vision.observedMake,
          model: vision.observedModel,
          color: vision.observedColor
        },
        matchScore: 0,
        status: "Rego Not Detected",
        notes: vision.notes
      });
    }

    const lookup = await lookupProvider.lookupByRego(vision.rego);
    const result = buildScanResult(vision, lookup);

    return res.json(result);
  } catch (error) {
    return res.status(200).json({
      vehicleDetected: false,
      vehicleConfidence: 0,
      detectedRego: "",
      regoConfidence: 0,
      lookupDetails: null,
      visualAttributes: { make: null, model: null, color: null },
      matchScore: 0,
      status: "No Vehicle Detected",
      notes: [error instanceof Error ? `Vision timeout/error: ${error.message}` : "Vision timeout/error"]
    });
  }
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
