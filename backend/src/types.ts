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

export interface VehicleLookupProvider {
  readonly name: string;
  lookupByRego(rego: string): Promise<VehicleLookupResult>;
}

export interface VisionScanResult {
  rego: string;
  regoConfidence: number;
  observedMake: string | null;
  observedModel: string | null;
  observedColor: string | null;
}

export interface ScanApiResult {
  detectedRego: string;
  regoConfidence: number;
  lookupDetails: VehicleLookupResult;
  visualAttributes: {
    make: string | null;
    model: string | null;
    color: string | null;
  };
  matchScore: number;
  status: "Likely Same" | "Manual Review" | "Possible Mismatch";
  notes: string[];
}
