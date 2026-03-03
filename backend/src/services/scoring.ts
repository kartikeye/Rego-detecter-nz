import type { ScanApiResult, VehicleLookupResult, VisionScanResult } from "../types.js";

const normalize = (value: string | null | undefined): string => {
  return (value ?? "").trim().toLowerCase();
};

export const buildScanResult = (
  vision: VisionScanResult,
  lookup: VehicleLookupResult
): ScanApiResult => {
  const regoComponent = Math.max(0, Math.min(1, vision.regoConfidence)) * 0.5;

  const makeMatch = normalize(vision.observedMake) === normalize(lookup.make);
  const modelMatch = normalize(vision.observedModel) === normalize(lookup.model);
  const makeModelComponent = (makeMatch && modelMatch ? 1 : makeMatch || modelMatch ? 0.5 : 0) * 0.35;

  const colorMatch = normalize(vision.observedColor) === normalize(lookup.color);
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
  if (!makeMatch || !modelMatch) {
    notes.push("Make/model mismatch between camera and lookup record");
  }
  if (!colorMatch) {
    notes.push("Color mismatch between camera and lookup record");
  }
  if (lookup.stolenFlag === "true") {
    notes.push("Lookup source indicates potential stolen status");
  }

  return {
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
    notes
  };
};
