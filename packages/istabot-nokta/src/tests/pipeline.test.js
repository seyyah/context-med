import { pipeline } from "../src/pipeline.js";

const DISCOVER_RESPONSE = {
  pico: { P: "Tip 2 diyabetli hastalar", I: "Sigara", C: "Non-sigara içenler", O: "İmplant başarısı" },
  researchQuestion: "Diyabetli sigara içenlerde implant başarısı farklı mı?",
  literatureGap: "Türk popülasyonunda çalışılmamış.",
  methodology: "Prospektif kohort",
  timeline: [{ month: "M1-2", milestone: "Etik onay" }],
};

const DESIGN_RESPONSE = {
  powerAnalysis: { minimumN: 156, targetN: 187, alpha: 0.05, power: 0.8, effectSize: 0.5, notes: "" },
  scales: [{ name: "OHIP-14", items: 14, validatedTr: true, recommended: true }],
  dataCollection: { method: "Anket", platform: "QR kod", notes: "" },
  studyDesign: { type: "Prospektif kohort", inclusionCriteria: "18+", exclusionCriteria: "Gebelik" },
};

const EXECUTE_RESPONSE = {
  dataDiagnostics: { missingData: "%3", outlierRisk: "Düşük", normalityAssessment: "Non-normal", distributionType: "non-parametric" },
  testSelection: { primaryTest: "Binary Logistic Regression", rationale: "İkili outcome", alternativeTest: "Mann-Whitney U" },
  analysisplan: { dependentVariable: "İmplant başarısı", independentVariables: ["Sigara", "HbA1c"], covariates: [], reportedStatistics: ["OR", "CI"] },
  interpretationGuide: { significanceThreshold: 0.05, clinicalRelevanceNotes: "OR>2 anlamlı", limitations: "Tek merkez" },
};

const PUBLISH_RESPONSE = {
  manuscript: { title: "Test Title", introduction: "Intro...", methods: "Methods...", results: "Results...", discussion: "Discussion..." },
  titleAlternatives: ["Alt 1", "Alt 2"],
  journalRecommendations: [{ name: "J Periodontology", impactFactor: 5.2, scopeMatch: "Yüksek", submissionNote: "" }],
};

const RESPONSES = [DISCOVER_RESPONSE, DESIGN_RESPONSE, EXECUTE_RESPONSE, PUBLISH_RESPONSE];

function mockFetchSequential(responses) {
  let callIndex = 0;
  global.fetch = async () => {
    const response = responses[callIndex % responses.length];
    callIndex++;
    return {
      ok: true,
      status: 200,
      json: async () => ({ content: [{ text: JSON.stringify(response) }] }),
    };
  };
}

describe("pipeline()", () => {
  it("throws when apiKey is missing", async () => {
    await expect(pipeline("diyabet ve implant")).rejects.toThrow("apiKey is required");
  });

  it("runs all 4 phases and returns combined result", async () => {
    mockFetchSequential(RESPONSES);

    const result = await pipeline("diyabet ve implant çalışmak istiyorum", {
      apiKey: "test-key",
    });

    expect(result.discover.pico.P).toContain("diyabet");
    expect(result.design.powerAnalysis.targetN).toBe(187);
    expect(result.execute.testSelection.primaryTest).toBe("Binary Logistic Regression");
    expect(result.publish.manuscript.title).toBe("Test Title");
    expect(result.publish.journalRecommendations[0].impactFactor).toBe(5.2);
  });

  it("calls onProgress for each phase", async () => {
    mockFetchSequential(RESPONSES);

    const progressLog = [];
    await pipeline("test input", {
      apiKey: "test-key",
      onProgress: (phase) => progressLog.push(phase),
    });

    expect(progressLog).toEqual(["discover", "design", "execute", "publish"]);
  });

  it("passes execute phase the combined discover+design context", async () => {
    const capturedBodies = [];
    let callIndex = 0;
    global.fetch = async (url, init) => {
      capturedBodies.push(JSON.parse(init.body));
      const response = RESPONSES[callIndex % RESPONSES.length];
      callIndex++;
      return {
        ok: true,
        status: 200,
        json: async () => ({ content: [{ text: JSON.stringify(response) }] }),
      };
    };

    await pipeline("test input", { apiKey: "test-key" });

    // 3. çağrı execute — hem discover hem design text'ini içermeli
    const executeCall = capturedBodies[2];
    expect(executeCall.messages[0].content).toContain(JSON.stringify(DISCOVER_RESPONSE));
    expect(executeCall.messages[0].content).toContain(JSON.stringify(DESIGN_RESPONSE));
  });
});
