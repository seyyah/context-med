import { getSession, updateSession, addMessage, completePhase, clearSession } from "../../src/mock/session-memory.js";

const PROJECT_ID = "test-proj-001";

afterEach(() => clearSession(PROJECT_ID));

describe("session-memory (mock)", () => {
  it("creates empty session on first access", () => {
    const session = getSession(PROJECT_ID);
    expect(session.projectId).toBe(PROJECT_ID);
    expect(session.currentPhase).toBe("DISCOVER");
    expect(session.conversationHistory).toHaveLength(0);
    expect(session.milestones).toHaveLength(4);
  });

  it("persists updates", () => {
    updateSession(PROJECT_ID, { title: "İmplant + Diyabet", persona: "periodontology-resident" });
    const session = getSession(PROJECT_ID);
    expect(session.title).toBe("İmplant + Diyabet");
    expect(session.persona).toBe("periodontology-resident");
  });

  it("adds messages to conversation history", () => {
    addMessage(PROJECT_ID, "user", "diyabet ve implant çalışmak istiyorum");
    addMessage(PROJECT_ID, "nokta", "PICO analizinizi oluşturuyorum...");
    const session = getSession(PROJECT_ID);
    expect(session.conversationHistory).toHaveLength(2);
    expect(session.conversationHistory[0].role).toBe("user");
    expect(session.conversationHistory[1].role).toBe("nokta");
  });

  it("marks phase as completed and advances currentPhase", () => {
    completePhase(PROJECT_ID, "DISCOVER", { researchQuestion: "test RQ" });
    const session = getSession(PROJECT_ID);
    const discover = session.milestones.find((m) => m.phase === "DISCOVER");
    expect(discover.status).toBe("completed");
    expect(discover.artifact.researchQuestion).toBe("test RQ");
    expect(session.currentPhase).toBe("DESIGN");
  });

  it("deep merges nested updates", () => {
    updateSession(PROJECT_ID, { decisions: { sampleSize: 187 } });
    updateSession(PROJECT_ID, { decisions: { statisticalTest: "logistic" } });
    const session = getSession(PROJECT_ID);
    expect(session.decisions.sampleSize).toBe(187);
    expect(session.decisions.statisticalTest).toBe("logistic");
  });
});
