import { powerAnalysis, logisticRegression, descriptiveStats } from "../../src/mock/r-engine.js";

describe("powerAnalysis (mock R Engine)", () => {
  it("returns minimumN and targetN", () => {
    const result = powerAnalysis();
    expect(result.minimumN).toBeGreaterThan(0);
    expect(result.targetN).toBeGreaterThan(result.minimumN);
  });

  it("targetN accounts for dropout rate", () => {
    const result = powerAnalysis({ dropoutRate: 0.20 });
    expect(result.targetN).toBeCloseTo(result.minimumN / 0.80, 0);
  });

  it("produces different n for different effect sizes", () => {
    const small = powerAnalysis({ effectSize: 0.2 });
    const large = powerAnalysis({ effectSize: 0.8 });
    expect(small.minimumN).toBeGreaterThan(large.minimumN);
  });

  it("includes interpretation text", () => {
    const result = powerAnalysis({ effectSize: 0.5, power: 0.80 });
    expect(result.interpretation).toContain("minimum");
    expect(result.interpretation).toContain("hedef n=");
  });
});

describe("logisticRegression (mock R Engine)", () => {
  it("returns results for each predictor", () => {
    const result = logisticRegression({
      outcome: "İmplant başarısı",
      predictors: ["Sigara", "HbA1c", "Yaş"],
    });
    expect(result.predictors).toHaveLength(3);
    result.predictors.forEach((p) => {
      expect(p.OR).toBeGreaterThan(0);
      expect(p.CI95).toMatch(/[\d.]+–[\d.]+/);
      expect(typeof p.significant).toBe("boolean");
    });
  });

  it("includes model fit statistics", () => {
    const result = logisticRegression({ outcome: "Outcome", predictors: ["A"] });
    expect(result.modelFit.nagelkerkeR2).toBeGreaterThan(0);
    expect(result.modelFit.correctlyClassified).toContain("%");
  });
});

describe("descriptiveStats (mock R Engine)", () => {
  it("returns stats for continuous and categorical variables", () => {
    const result = descriptiveStats({
      n: 187,
      continuousVars: ["Yaş", "HbA1c"],
      categoricalVars: ["Sigara", "Cinsiyet"],
    });
    expect(result.n).toBe(187);
    expect(result.continuous).toHaveLength(2);
    expect(result.categorical).toHaveLength(2);
    expect(result.normalityTests).toHaveLength(2);
  });

  it("includes missing data percentage", () => {
    const result = descriptiveStats({ n: 100, continuousVars: [], categoricalVars: [] });
    expect(result.missingDataPct).toBeTruthy();
  });
});
