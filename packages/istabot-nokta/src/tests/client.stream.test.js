import { callClaudeStream, callClaude } from "../src/client.js";

function makeStreamResponse(chunks) {
  const lines = chunks.map((c) => `data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: c } })}`);
  lines.push("data: [DONE]");
  const body = lines.join("\n");
  const encoder = new TextEncoder();
  const encoded = encoder.encode(body);

  let offset = 0;
  const readable = new ReadableStream({
    pull(controller) {
      if (offset >= encoded.length) {
        controller.close();
        return;
      }
      const chunk = encoded.slice(offset, offset + 64);
      offset += 64;
      controller.enqueue(chunk);
    },
  });

  return {
    ok: true,
    status: 200,
    body: readable,
  };
}

describe("callClaudeStream", () => {
  it("throws when apiKey is missing", async () => {
    await expect(
      callClaudeStream({ systemPrompt: "x", userMessage: "y" })
    ).rejects.toThrow("apiKey is required");
  });

  it("assembles chunks into full text", async () => {
    global.fetch = async () => makeStreamResponse(["Merhaba", " dünya", "!"]);

    const result = await callClaudeStream({
      apiKey: "test-key",
      systemPrompt: "system",
      userMessage: "user",
    });

    expect(result).toBe("Merhaba dünya!");
  });

  it("calls onChunk for each text delta", async () => {
    global.fetch = async () => makeStreamResponse(["A", "B", "C"]);

    const chunks = [];
    await callClaudeStream({
      apiKey: "test-key",
      systemPrompt: "s",
      userMessage: "u",
      onChunk: (c) => chunks.push(c),
    });

    expect(chunks).toEqual(["A", "B", "C"]);
  });

  it("throws on API error", async () => {
    global.fetch = async () => ({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(
      callClaudeStream({ apiKey: "test-key", systemPrompt: "s", userMessage: "u" })
    ).rejects.toThrow("Claude API error 401");
  });
});

describe("retry logic", () => {
  it("retries on 429 and eventually throws", async () => {
    let callCount = 0;
    global.fetch = async () => {
      callCount++;
      return {
        ok: false,
        status: 429,
        headers: { get: () => "0" },
        text: async () => "rate limited",
      };
    };

    await expect(
      callClaude({ apiKey: "test-key", systemPrompt: "s", userMessage: "u" })
    ).rejects.toThrow("rate limited");

    expect(callCount).toBe(3);
  }, 10000);
});
