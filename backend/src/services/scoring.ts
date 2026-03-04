import type { ScanApiResult, VehicleLookupResult, VisionScanResult } from "../types.js";

const normalize = (value: string | null | undefined): string => {
  return (value ?? "").trim().toLowerCase();
};

const normalizeColor = (value: string | null | undefined): string => {
  const normalized = normalize(value);
  if (normalized === "grey") return "silver";
  if (normalized === "gray") return "silver";
  return normalized;
};

export const buildScanResult = (
  vision: VisionScanResult,
  lookup: VehicleLookupResult
): ScanApiResult => {
  const regoComponent = Math.max(0, Math.min(1, vision.regoConfidence)) * 0.5;

  const hasObservedMakeModel = Boolean(vision.observedMake) && Boolean(vision.observedModel);
  const makeMatch = hasObservedMakeModel && normalize(vision.observedMake) === normalize(lookup.make);
  const modelMatch = hasObservedMakeModel && normalize(vision.observedModel) === normalize(lookup.model);
  const makeModelComponent = hasObservedMakeModel
    ? (makeMatch && modelMatch ? 1 : makeMatch || modelMatch ? 0.5 : 0) * 0.35
    : 0.175;

  const hasObservedColor = Boolean(vision.observedColor);
  const colorMatch = hasObservedColor && normalizeColor(vision.observedColor) === normalizeColor(lookup.color);
  const colorComponent = (colorMatch ? 1 : 0) * 0.15;

  const matchScore = Number((regoComponent + makeModelComponent + colorComponent).toFixed(2));

  let status: ScanApiResult["status"];
  if (matchScore >= 0.8) {
    status = "Likely Same";
  } else if (matchScore >= 0.55) {
    status = "Manual Review";
  } else {
    status = "Possible Mismatch";
  }

  const notes: string[] = [];
  if (hasObservedMakeModel && (!makeMatch || !modelMatch)) {
    notes.push("Make/model mismatch between camera and lookup record");
  } else if (!hasObservedMakeModel) {
    notes.push("Camera could not confidently classify make/model");
  }
  if (hasObservedColor && !colorMatch) {
    notes.push("Color mismatch between camera and lookup record");
  }
  if (lookup.stolenFlag === "true") {
    notes.push("Lookup source indicates potential stolen status");
  }

  return {
    vehicleDetected: vision.vehicleDetected,
    vehicleConfidence: vision.vehicleConfidence,
    detectedRego: vision.rego,
    regoConfidence: vision.regoConfidence,
    lookupDetails: lookup,
    visualAttributes: {
      make: vision.observedMake,
      model: vision.observedModel,
      color: vision.observedColor
    },
    matchScore,
    status,
    notes: [...vision.notes, ...notes]
  };
};
