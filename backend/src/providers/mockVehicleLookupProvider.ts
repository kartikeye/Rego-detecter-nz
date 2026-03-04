import type {
  VehicleClassificationCandidate,
  VehicleLookupProvider,
  VehicleLookupResult
} from "../types.js";

const db: Record<string, Omit<VehicleLookupResult, "source" | "fetchedAt" | "confidence">> = {
  ABC123: {
    rego: "ABC123",
    make: "Toyota",
    model: "Prius",
    year: 2018,
    color: "Black",
    bodyType: "Hatchback",
    stolenFlag: "false",
    notes: ["Demo normal record"]
  },
  NZM777: {
    rego: "NZM777",
    make: "Mazda",
    model: "Axela",
    year: 2015,
    color: "Red",
    bodyType: "Hatchback",
    stolenFlag: "true",
    notes: ["Demo potential stolen scenario"]
  },
  LMB724: {
    rego: "LMB724",
    make: "Audi",
    model: "A6",
    year: 2008,
    color: "Silver",
    bodyType: "Sedan",
    stolenFlag: "false",
    notes: ["Demo record for Audi A6 verification"]
  },
  QEU878: {
    rego: "QEU878",
    make: "Toyota",
    model: "Prius",
    year: null,
    color: "Black",
    bodyType: "Sedan",
    stolenFlag: "false",
    notes: ["Demo record for Toyota Prius black sedan"]
  }
};

export class MockVehicleLookupProvider implements VehicleLookupProvider {
  public readonly name = "mock";

  public getClassificationCandidates(): VehicleClassificationCandidate[] {
    const candidates = new Map<string, VehicleClassificationCandidate>();

    for (const record of Object.values(db)) {
      if (!record.make || !record.model) {
        continue;
      }

      const key = `${record.make.toLowerCase()}::${record.model.toLowerCase()}::${(record.bodyType ?? "").toLowerCase()}`;
      if (!candidates.has(key)) {
        candidates.set(key, {
          make: record.make,
          model: record.model,
          bodyType: record.bodyType ?? null
        });
      }
    }

    return Array.from(candidates.values());
  }

  public async lookupByRego(rego: string): Promise<VehicleLookupResult> {
    const normalizedRego = rego.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const record = db[normalizedRego];

    if (!record) {
      return {
        rego: normalizedRego,
        make: null,
        model: null,
        year: null,
        color: null,
        stolenFlag: "unknown",
        source: this.name,
        fetchedAt: new Date().toISOString(),
        confidence: 0.25,
        notes: ["No record found in mock dataset"]
      };
    }

    return {
      ...record,
      source: this.name,
      fetchedAt: new Date().toISOString(),
      confidence: 0.95
    };
  }
}
