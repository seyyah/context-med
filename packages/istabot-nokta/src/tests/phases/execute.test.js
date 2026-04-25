import { execute } from "../../src/phases/execute.js";

const VALID_RESPONSE = {
  dataDiagnostics: {
    missingData: "%3 eksik veri — kabul edilebilir sınır altında.",
    outlierRisk: "2 aykırı değer tespit edildi, incelenmeli.",
    normalityAssessment: "Shapiro-Wilk p=0.03 — non-parametrik test önerilir.",
    distributionType: "non-parametric",
  },
  testSelection: {
    primaryTest: "Binary Logistic Regression",
    rationale: "İkili outcome (başarı/başarısızlık) ve çoklu bağımsız değişken varlığı.",
    alternativeTest: "Mann-Whitney U (univariate karşılaştırma için)",
  },
  analysisplan: {
    dependentVariable: "İmplant başarısı (success/failure)",
    independentVariables: ["Sigara içme durumu", "HbA1c değeri", "Yaş"],
    covariates: ["Cinsiyet", "İmplant lokasyonu"],
    reportedStatistics: ["OR", "95% CI", "p-değeri", "Nagelkerke R²"],
  },
  interpretationGuide: {
    significanceThreshold: 0.05,
    clinicalRelevanceNotes: "OR > 2.0 klinik açıdan anlamlı kabul edilebilir.",
    limitations: "Retrospektif tasarım, confounding riski.",
  },
};

function mockFetchWithResponse(responseText) {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ content: [{ text: responseText }] }),
  });
}

describe("execute()", () => {
  it("throws when apiKey is missing", async () => {
    await expect(execute("veri özeti")).rejects.toThrow("apiKey is required");
  });

  it("returns text + parsed fields on valid JSON response", async () => {
    mockFetchWithResponse(JSON.stringify(VALID_RESPONSE));

    const result = await execute(
      "187 hasta, outcome: implant başarısı, değişkenler: sigara, HbA1c, yaş",
      { apiKey: "test-key" }
    );

    expect(result.text).toBeTruthy();
    expect(result.dataDiagnostics.distributionType).toBe("non-parametric");
    expect(result.testSelection.primaryTest).toBe("Binary Logistic Regression");
    expect(result.analysisplan.independentVariables).toContain("Sigara içme durumu");
    expect(result.interpretationGuide.significanceThreshold).toBe(0.05);
  });

  it("returns null parsed fields when LLM returns non-JSON", async () => {
    mockFetchWithResponse("Veri hakkında bilgi verilmedi.");

    const result = await execute("boş input", { apiKey: "test-key" });

    expect(result.text).toBeTruthy();
    expect(result.dataDiagnostics).toBeNull();
    expect(result.testSelection).toBeNull();
  });

  it("passes language to the prompt", async () => {
    let capturedBody;
    global.fetch = async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ content: [{ text: JSON.stringify(VALID_RESPONSE) }] }),
      };
    };

    await execute("data summary", { apiKey: "test-key", language: "en" });

    expect(capturedBody.system).toContain("Respond in English");
  });
});
