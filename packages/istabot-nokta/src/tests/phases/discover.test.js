import { discover } from "../../src/phases/discover.js";

const VALID_RESPONSE = {
  pico: {
    P: "Tip 2 diyabetli dental implant adayları",
    I: "Sigara içme durumu (kombine diyabet + sigara)",
    C: "Yalnızca diyabetli veya yalnızca sigara içen hastalar",
    O: "12 aylık implant başarı oranı",
  },
  researchQuestion:
    "Tip 2 diyabetli sigara içen hastalarda dental implant başarı oranı, yalnızca diyabetli veya yalnızca sigara içenlere kıyasla anlamlı farklılık gösterir mi?",
  literatureGap:
    "Türk popülasyonunda sigara + diyabet kombine faktörünün implant osseointegrasyonuna etkisi çalışılmamış.",
  methodology:
    "Retrospektif kohort çalışması. Veri: klinik kayıtlar. Analiz: Binary Logistic Regression.",
  timeline: [
    { month: "M1-2", milestone: "Etik kurul onayı + çalışma tasarımı" },
    { month: "M3-6", milestone: "Veri toplama (hedef n=187)" },
    { month: "M7", milestone: "İstatistiksel analiz" },
    { month: "M8-9", milestone: "Manuscript yazımı" },
    { month: "M10", milestone: "Dergi submission" },
  ],
};

function mockFetchWithResponse(responseText) {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      content: [{ text: responseText }],
    }),
    text: async () => responseText,
  });
}

describe("discover()", () => {
  it("throws when apiKey is missing", async () => {
    await expect(discover("diyabet ve implant")).rejects.toThrow("apiKey is required");
  });

  it("returns text + parsed fields on valid JSON response", async () => {
    const responseText = JSON.stringify(VALID_RESPONSE);
    mockFetchWithResponse(responseText);

    const result = await discover("diyabet ve implant çalışmak istiyorum", {
      apiKey: "test-key",
    });

    expect(result.text).toBe(responseText);
    expect(result.pico.P).toContain("diyabet");
    expect(result.researchQuestion).toContain("implant");
    expect(result.literatureGap).toBeTruthy();
    expect(result.timeline).toHaveLength(5);
  });

  it("returns null parsed fields when LLM returns non-JSON", async () => {
    mockFetchWithResponse("Üzgünüm, bu konuda yardımcı olamıyorum.");

    const result = await discover("anlamsız input", { apiKey: "test-key" });

    expect(result.text).toBeTruthy();
    expect(result.pico).toBeNull();
    expect(result.researchQuestion).toBeNull();
  });

  it("passes domain and language to the prompt", async () => {
    let capturedBody;
    global.fetch = async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({ content: [{ text: JSON.stringify(VALID_RESPONSE) }] }),
      };
    };

    await discover("cardiovascular risk", {
      apiKey: "test-key",
      domain: "cardiology",
      language: "en",
    });

    expect(capturedBody.system).toContain("cardiology");
    expect(capturedBody.system).toContain("Respond in English");
  });

  it("uses ANTHROPIC_API_KEY env variable when apiKey not passed", async () => {
    process.env.ANTHROPIC_API_KEY = "env-key";
    let capturedHeaders;
    global.fetch = async (url, init) => {
      capturedHeaders = init.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({ content: [{ text: JSON.stringify(VALID_RESPONSE) }] }),
      };
    };

    await discover("test input");

    expect(capturedHeaders["x-api-key"]).toBe("env-key");
    delete process.env.ANTHROPIC_API_KEY;
  });
});
