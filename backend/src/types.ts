export type StolenFlag = "true" | "false" | "unknown";

export interface VehicleLookupResult {
  rego: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  bodyType?: string | null;
  stolenFlag: StolenFlag;
  source: string;
  fetchedAt: string;
  confidence: number;
  notes?: string[];
  rawPayload?: unknown;
}

export interface VehicleClassificationCandidate {
  make: string;
  model: string;
  bodyType?: string | null;
}

export interface VehicleLookupProvider {
  readonly name: string;
  lookupByRego(rego: string): Promise<VehicleLookupResult>;
  getClassificationCandidates(): VehicleClassificationCandidate[];
}

export interface VisionScanResult {
  vehicleDetected: boolean;
  vehicleConfidence: number;
  rego: string;
  regoConfidence: number;
  observedMake: string | null;
  observedModel: string | null;
  observedColor: string | null;
  notes: string[];
}

export interface ScanApiResult {
  vehicleDetected: boolean;
  vehicleConfidence: number;
  detectedRego: string;
  regoConfidence: number;
  lookupDetails: VehicleLookupResult | null;
  visualAttributes: {
    make: string | null;
    model: string | null;
    color: string | null;
  };
  matchScore: number;
  status: "No Vehicle Detected" | "Rego Not Detected" | "Likely Same" | "Manual Review" | "Possible Mismatch";
  notes: string[];
}
