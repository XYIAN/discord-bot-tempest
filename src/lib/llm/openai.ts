import type { CompletionRequest, LlmClient } from './types.js';

const DEFAULT_MODEL = 'gpt-4o-mini';

/**
 * Thin fetch-based OpenAI adapter — fallback provider for the key the
 * sibling bots already use. No SDK dependency needed for one endpoint.
 */
export function createOpenAiClient(apiKey: string, model = DEFAULT_MODEL): LlmClient {
  return {
    providerName: `openai:${model}`,
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
          messages: [{ role: 'system', content: system }, ...turns],
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
