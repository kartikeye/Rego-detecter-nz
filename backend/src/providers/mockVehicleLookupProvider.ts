import type { VehicleLookupProvider, VehicleLookupResult } from "../types.js";

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
  }
};

export class MockVehicleLookupProvider implements VehicleLookupProvider {
  public readonly name = "mock";

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
