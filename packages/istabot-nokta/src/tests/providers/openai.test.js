import { openaiCall, openaiStream } from "../../src/providers/openai.js";

const MOCK_RESPONSE = { choices: [{ message: { content: '{"pico":{"P":"test"}}' } }] };

function makeFetchFn(ok = true, body = MOCK_RESPONSE) {
  return async () => ({
    ok,
    status: ok ? 200 : 401,
    json: async () => body,
    text: async () => "Unauthorized",
  });
}

describe("openaiCall", () => {
  it("returns text on success", async () => {
    const result = await openaiCall({
      apiKey: "sk-test",
      systemPrompt: "system",
      userMessage: "user",
      fetchFn: makeFetchFn(true),
    });
    expect(result).toBe('{"pico":{"P":"test"}}');
  });

  it("throws on API error", async () => {
    await expect(
      openaiCall({ apiKey: "sk-test", systemPrompt: "s", userMessage: "u", fetchFn: makeFetchFn(false) })
    ).rejects.toThrow("OpenAI API error 401");
  });

  it("sends Authorization header", async () => {
    let capturedInit;
    const fetchFn = async (url, init) => {
      capturedInit = init;
      return { ok: true, status: 200, json: async () => MOCK_RESPONSE };
    };
    await openaiCall({ apiKey: "my-openai-key", systemPrompt: "s", userMessage: "u", fetchFn });
    expect(capturedInit.headers["Authorization"]).toBe("Bearer my-openai-key");
  });

  it("sends system + user messages in correct format", async () => {
    let capturedBody;
    const fetchFn = async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return { ok: true, status: 200, json: async () => MOCK_RESPONSE };
    };
    await openaiCall({ apiKey: "k", model: "gpt-4o-mini", systemPrompt: "sys", userMessage: "msg", fetchFn });
    expect(capturedBody.model).toBe("gpt-4o-mini");
    expect(capturedBody.messages[0]).toEqual({ role: "system", content: "sys" });
    expect(capturedBody.messages[1]).toEqual({ role: "user", content: "msg" });
  });
});

describe("openaiStream", () => {
  it("assembles SSE chunks into full text", async () => {
    const chunks = ["Merhaba", " dünya"];
    const lines = chunks.map((c) =>
      `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}`
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
    const result = await openaiStream({ apiKey: "k", systemPrompt: "s", userMessage: "u", fetchFn });
    expect(result).toBe("Merhaba dünya");
  });
});
