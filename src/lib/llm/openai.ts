import type { ChatTurn, CompletionRequest, LlmClient } from './types.js';

const DEFAULT_MODEL = 'gpt-4o-mini';

/** OpenAI takes images as data: URLs inside the content array. */
function toContent(content: ChatTurn['content']): unknown {
  if (typeof content === 'string') return content;
  return content.map((part) =>
    part.type === 'text'
      ? { type: 'text', text: part.text }
      : { type: 'image_url', image_url: { url: `data:${part.mediaType};base64,${part.data}` } },
  );
}

/**
 * Thin fetch-based OpenAI adapter — fallback provider for the key the
 * sibling bots already use. No SDK dependency needed for one endpoint.
 */
export function createOpenAiClient(apiKey: string, model = DEFAULT_MODEL): LlmClient {
  return {
    providerName: `openai:${model}`,
    // gpt-4o-mini is a vision model; keep this in sync if DEFAULT_MODEL changes.
    supportsImages: true,
    async complete({ system, turns, maxTokens }: CompletionRequest): Promise<string> {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: system },
            ...turns.map((t) => ({ role: t.role, content: toContent(t.content) })),
          ],
        }),
      });
      if (!response.ok) {
        throw new Error(`OpenAI API error ${response.status}: ${(await response.text()).slice(0, 300)}`);
      }
      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      return data.choices?.[0]?.message?.content?.trim() ?? '';
    },
  };
}
