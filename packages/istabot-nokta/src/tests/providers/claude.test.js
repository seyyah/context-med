import { claudeCall, claudeStream } from "../../src/providers/claude.js";

const MOCK_RESPONSE = { content: [{ text: '{"pico":{"P":"test"}}' }] };

function makeFetchFn(ok = true, body = MOCK_RESPONSE) {
  return async () => ({
    ok,
    status: ok ? 200 : 401,
    json: async () => body,
    text: async () => "Unauthorized",
  });
}

describe("claudeCall", () => {
  it("returns text on success", async () => {
    const result = await claudeCall({
      apiKey: "test-key",
      systemPrompt: "system",
      userMessage: "user",
      fetchFn: makeFetchFn(true),
    });
    expect(result).toBe('{"pico":{"P":"test"}}');
  });

  it("throws on API error", async () => {
    await expect(
      claudeCall({ apiKey: "test-key", systemPrompt: "s", userMessage: "u", fetchFn: makeFetchFn(false) })
    ).rejects.toThrow("Claude API error 401");
  });

  it("sends correct headers", async () => {
    let capturedInit;
    const fetchFn = async (url, init) => {
      capturedInit = init;
      return { ok: true, status: 200, json: async () => MOCK_RESPONSE };
    };
    await claudeCall({ apiKey: "my-key", systemPrompt: "s", userMessage: "u", fetchFn });
    expect(capturedInit.headers["x-api-key"]).toBe("my-key");
    expect(capturedInit.headers["anthropic-version"]).toBeTruthy();
  });

  it("sends model and messages in body", async () => {
    let capturedBody;
    const fetchFn = async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return { ok: true, status: 200, json: async () => MOCK_RESPONSE };
    };
    await claudeCall({ apiKey: "k", model: "claude-opus-4-7", systemPrompt: "sys", userMessage: "msg", fetchFn });
    expect(capturedBody.model).toBe("claude-opus-4-7");
    expect(capturedBody.system).toBe("sys");
    expect(capturedBody.messages[0].content).toBe("msg");
  });
});

describe("claudeStream", () => {
  it("assembles SSE chunks into full text", async () => {
    const chunks = ["Hello", " world"];
    const lines = chunks.map((c) =>
      `data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: c } })}`
    );
    lines.push("data: [DONE]");
    const encoder = new TextEncoder();
    const encoded = encoder.encode(lines.join("\n"));
    let offset = 0;
    const readable = new ReadableStream({
      pull(controller) {
        if (offset >= encoded.length) { controller.close(); return; }
        controller.enqueue(encoded.slice(offset, offset + 64));
        offset += 64;
      },
    });

    const fetchFn = async () => ({ ok: true, status: 200, body: readable });
    const result = await claudeStream({ apiKey: "k", systemPrompt: "s", userMessage: "u", fetchFn });
    expect(result).toBe("Hello world");
  });
});
