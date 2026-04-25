const API_URL = "https://api.anthropic.com/v1/messages";
export const DEFAULT_MODEL = "claude-sonnet-4-6";

function buildHeaders(apiKey) {
  return {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };
}

function buildBody({ model, systemPrompt, userMessage, maxTokens, stream }) {
  return JSON.stringify({
    model: model || DEFAULT_MODEL,
    max_tokens: maxTokens,
    stream: stream || false,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
}

export async function claudeCall({ apiKey, model, systemPrompt, userMessage, maxTokens = 2000, fetchFn }) {
  const response = await fetchFn(API_URL, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: buildBody({ model, systemPrompt, userMessage, maxTokens, stream: false }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

export async function claudeStream({ apiKey, model, systemPrompt, userMessage, maxTokens = 2000, onChunk, fetchFn }) {
  const response = await fetchFn(API_URL, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: buildBody({ model, systemPrompt, userMessage, maxTokens, stream: true }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error ${response.status}: ${error}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const event = JSON.parse(data);
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          fullText += event.delta.text;
          onChunk?.(event.delta.text);
        }
      } catch { /* skip malformed */ }
    }
  }

  if (buffer.trim().startsWith("data: ")) {
    const data = buffer.trim().slice(6).trim();
    try {
      const event = JSON.parse(data);
      if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        fullText += event.delta.text;
        onChunk?.(event.delta.text);
      }
    } catch { /* skip */ }
  }

  return fullText;
}
