import { getScales, getScaleById } from "../../src/mock/scale-module.js";

describe("getScales (mock Scale Module)", () => {
  it("returns scales for a domain", () => {
    const result = getScales("periodontology");
    expect(result.scales.length).toBeGreaterThan(0);
    expect(result.recommended.length).toBeGreaterThan(0);
  });

  it("only returns Turkish-validated scales by default", () => {
    const result = getScales("periodontology");
    result.scales.forEach((s) => expect(s.validatedTr).toBe(true));
  });

  it("filters by maxItems", () => {
    const result = getScales("periodontology", { maxItems: 5 });
    result.scales.forEach((s) => expect(s.items).toBeLessThanOrEqual(5));
  });

  it("returns empty for unknown domain", () => {
    const result = getScales("unknown-domain-xyz");
    expect(result.scales.length).toBe(0);
  });
});

describe("getScaleById", () => {
  it("returns the correct scale", () => {
    const scale = getScaleById("ohip-14");
    expect(scale).not.toBeNull();
    expect(scale.name).toBe("OHIP-14");
    expect(scale.items).toBe(14);
    expect(scale.validatedTr).toBe(true);
  });

  it("returns null for unknown id", () => {
    expect(getScaleById("nonexistent")).toBeNull();
  });
});
