const API_URL = "https://api.openai.com/v1/chat/completions";
export const DEFAULT_MODEL = "gpt-4o";

function buildHeaders(apiKey) {
  return {
    "Authorization": `Bearer ${apiKey}`,
    "content-type": "application/json",
  };
}

function buildBody({ model, systemPrompt, userMessage, maxTokens, stream }) {
  return JSON.stringify({
    model: model || DEFAULT_MODEL,
    max_tokens: maxTokens,
    stream: stream || false,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
}

export async function openaiCall({ apiKey, model, systemPrompt, userMessage, maxTokens = 2000, fetchFn }) {
  const response = await fetchFn(API_URL, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: buildBody({ model, systemPrompt, userMessage, maxTokens, stream: false }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function openaiStream({ apiKey, model, systemPrompt, userMessage, maxTokens = 2000, onChunk, fetchFn }) {
  const response = await fetchFn(API_URL, {
    method: "POST",
    headers: buildHeaders(apiKey),
    body: buildBody({ model, systemPrompt, userMessage, maxTokens, stream: true }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${error}`);
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
        const chunk = event.choices?.[0]?.delta?.content;
        if (chunk) {
          fullText += chunk;
          onChunk?.(chunk);
        }
      } catch { /* skip malformed */ }
    }
  }

  if (buffer.trim().startsWith("data: ")) {
    const data = buffer.trim().slice(6).trim();
    try {
      const event = JSON.parse(data);
      const chunk = event.choices?.[0]?.delta?.content;
      if (chunk) {
        fullText += chunk;
        onChunk?.(chunk);
      }
    } catch { /* skip */ }
  }

  return fullText;
}
