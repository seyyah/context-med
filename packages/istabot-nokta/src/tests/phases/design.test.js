import { design } from "../../src/phases/design.js";

const VALID_RESPONSE = {
  powerAnalysis: {
    minimumN: 156,
    targetN: 187,
    alpha: 0.05,
    power: 0.80,
    effectSize: 0.5,
    notes: "Cohen d=0.5 orta etki büyüklüğü varsayımı ile hesaplandı.",
  },
  scales: [
    { name: "OHIP-14", items: 14, validatedTr: true, recommended: true },
    { name: "Visual Analog Scale", items: 1, validatedTr: true, recommended: false },
  ],
  dataCollection: {
    method: "Anket + klinik kayıt",
    platform: "QR kod ile online form",
    notes: "Kliniğe asılacak poster üzerinden QR erişim.",
  },
  studyDesign: {
    type: "Prospektif kohort",
    inclusionCriteria: "18+ yaş, Tip 2 diyabet tanısı, dental implant adayı",
    exclusionCriteria: "Gebelik, immunosupresif tedavi, eksik kayıt",
  },
};

function mockFetchWithResponse(responseText) {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ content: [{ text: responseText }] }),
  });
}

describe("design()", () => {
  it("throws when apiKey is missing", async () => {
    await expect(design("research question metni")).rejects.toThrow("apiKey is required");
  });

  it("returns text + parsed fields on valid JSON response", async () => {
    mockFetchWithResponse(JSON.stringify(VALID_RESPONSE));

    const result = await design("Tip 2 diyabetli hastalarda implant başarısı araştırması", {
      apiKey: "test-key",
    });

    expect(result.text).toBeTruthy();
    expect(result.powerAnalysis.minimumN).toBe(156);
    expect(result.powerAnalysis.targetN).toBe(187);
    expect(result.scales).toHaveLength(2);
    expect(result.scales[0].name).toBe("OHIP-14");
    expect(result.studyDesign.type).toBe("Prospektif kohort");
  });

  it("returns null parsed fields when LLM returns non-JSON", async () => {
    mockFetchWithResponse("Üzgünüm, yeterli bilgi yok.");

    const result = await design("eksik input", { apiKey: "test-key" });

    expect(result.text).toBeTruthy();
    expect(result.powerAnalysis).toBeNull();
    expect(result.scales).toBeNull();
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

    await design("cardiovascular study design", { apiKey: "test-key", language: "en" });

    expect(capturedBody.system).toContain("Respond in English");
  });
});
