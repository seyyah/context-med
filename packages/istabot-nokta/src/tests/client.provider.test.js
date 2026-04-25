import { callLLM, callLLMStream } from "../src/client.js";

const CLAUDE_BODY = { content: [{ text: "claude response" }] };
const OPENAI_BODY = { choices: [{ message: { content: "openai response" } }] };

function mockFetch(body) {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => "",
  });
}

describe("callLLM — provider routing", () => {
  it("routes to Claude by default", async () => {
    mockFetch(CLAUDE_BODY);
    const result = await callLLM({ apiKey: "test", systemPrompt: "s", userMessage: "u" });
    expect(result).toBe("claude response");
  });

  it("routes to Claude when provider='claude'", async () => {
    mockFetch(CLAUDE_BODY);
    const result = await callLLM({ apiKey: "test", provider: "claude", systemPrompt: "s", userMessage: "u" });
    expect(result).toBe("claude response");
  });

  it("routes to OpenAI when provider='openai'", async () => {
    mockFetch(OPENAI_BODY);
    const result = await callLLM({ apiKey: "test", provider: "openai", systemPrompt: "s", userMessage: "u" });
    expect(result).toBe("openai response");
  });

  it("throws with OpenAI message when provider='openai' and no apiKey", async () => {
    const savedEnv = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    await expect(
      callLLM({ provider: "openai", systemPrompt: "s", userMessage: "u" })
    ).rejects.toThrow("OPENAI_API_KEY");
    if (savedEnv) process.env.OPENAI_API_KEY = savedEnv;
  });

  it("throws with Claude message when provider='claude' and no apiKey", async () => {
    const savedEnv = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    await expect(
      callLLM({ provider: "claude", systemPrompt: "s", userMessage: "u" })
    ).rejects.toThrow("ANTHROPIC_API_KEY");
    if (savedEnv) process.env.ANTHROPIC_API_KEY = savedEnv;
  });

  it("falls back to OPENAI_API_KEY env for openai provider", async () => {
    process.env.OPENAI_API_KEY = "env-openai-key";
    let capturedInit;
    global.fetch = async (url, init) => {
      capturedInit = init;
      return { ok: true, status: 200, json: async () => OPENAI_BODY };
    };
    await callLLM({ provider: "openai", systemPrompt: "s", userMessage: "u" });
    expect(capturedInit.headers["Authorization"]).toBe("Bearer env-openai-key");
    delete process.env.OPENAI_API_KEY;
  });
});

describe("discover() with provider option", () => {
  it("passes provider to callLLM", async () => {
    const { discover } = await import("../src/phases/discover.js");
    let capturedUrl = "";
    global.fetch = async (url, init) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => OPENAI_BODY,
      };
    };

    await discover("test input", { apiKey: "test-key", provider: "openai" });
    expect(capturedUrl).toContain("openai.com");
  });
});
