import { publish } from "../../src/phases/publish.js";

const VALID_RESPONSE = {
  manuscript: {
    title: "Combined Effect of Smoking and Diabetes on Dental Implant Success: A Turkish Cohort Study",
    introduction: "Dental implant başarısı sistemik faktörlerden etkilenmektedir...",
    methods: "Prospektif kohort tasarımıyla 187 hasta dahil edildi...",
    results: "Sigara + diyabet kombine OR: 2.8 (95% CI: 1.4-5.6, p<0.001)...",
    discussion: "Bulgular literatürle uyumludur. Sınırlılık: tek merkez...",
  },
  titleAlternatives: [
    "Smoking and Type 2 Diabetes as Combined Risk Factors for Dental Implant Failure",
    "İmplant Başarısında Sigara ve Diyabetin Kombine Etkisi: Türk Kohort Çalışması",
  ],
  journalRecommendations: [
    {
      name: "Journal of Periodontology",
      impactFactor: 5.2,
      scopeMatch: "Yüksek — implant + periodontal risk faktörleri",
      submissionNote: "Open access ücreti $3.200, submission ücretsiz.",
    },
    {
      name: "Clinical Oral Implants Research",
      impactFactor: 4.8,
      scopeMatch: "Yüksek — implant klinik çalışmaları",
      submissionNote: "Kelime limiti 4.000, structured abstract zorunlu.",
    },
  ],
};

function mockFetchWithResponse(responseText) {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ content: [{ text: responseText }] }),
  });
}

describe("publish()", () => {
  it("throws when apiKey is missing", async () => {
    await expect(publish("araştırma bağlamı")).rejects.toThrow("apiKey is required");
  });

  it("returns text + parsed fields on valid JSON response", async () => {
    mockFetchWithResponse(JSON.stringify(VALID_RESPONSE));

    const result = await publish("tüm araştırma bağlamı...", { apiKey: "test-key" });

    expect(result.text).toBeTruthy();
    expect(result.manuscript.title).toContain("Implant");
    expect(result.manuscript.results).toContain("OR");
    expect(result.titleAlternatives).toHaveLength(2);
    expect(result.journalRecommendations[0].name).toBe("Journal of Periodontology");
    expect(result.journalRecommendations[0].impactFactor).toBe(5.2);
  });

  it("returns null parsed fields when LLM returns non-JSON", async () => {
    mockFetchWithResponse("Yeterli bağlam sağlanmadı.");

    const result = await publish("eksik bağlam", { apiKey: "test-key" });

    expect(result.text).toBeTruthy();
    expect(result.manuscript).toBeNull();
    expect(result.journalRecommendations).toBeNull();
  });

  it("uses maxTokens 4000 by default", async () => {
    let capturedBody;
    global.fetch = async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ content: [{ text: JSON.stringify(VALID_RESPONSE) }] }),
      };
    };

    await publish("bağlam", { apiKey: "test-key" });

    expect(capturedBody.max_tokens).toBe(4000);
  });
});
