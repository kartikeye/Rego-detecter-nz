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
