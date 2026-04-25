import { callClaude } from "../src/client.js";

const MOCK_RESPONSE = {
  content: [{ text: '{"pico":{"P":"test"}}' }],
};

function mockFetch(ok = true, body = MOCK_RESPONSE) {
  global.fetch = async () => ({
    ok,
    status: ok ? 200 : 401,
    json: async () => body,
    text: async () => "Unauthorized",
  });
}

describe("callClaude", () => {
  it("throws when apiKey is missing", async () => {
    await expect(
      callClaude({ systemPrompt: "x", userMessage: "y" })
    ).rejects.toThrow("apiKey is required");
  });

  it("returns text on success", async () => {
    mockFetch(true);
    const result = await callClaude({
      apiKey: "test-key",
      systemPrompt: "system",
      userMessage: "user",
    });
    expect(result).toBe('{"pico":{"P":"test"}}');
  });

  it("throws on API error", async () => {
    mockFetch(false);
    await expect(
      callClaude({ apiKey: "test-key", systemPrompt: "s", userMessage: "u" })
    ).rejects.toThrow("Claude API error 401");
  });
});
