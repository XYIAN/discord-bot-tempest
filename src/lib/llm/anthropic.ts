import Anthropic from '@anthropic-ai/sdk';
import type { CompletionRequest, LlmClient } from './types.js';

const DEFAULT_MODEL = 'claude-opus-5';

export function createAnthropicClient(apiKey: string, model = DEFAULT_MODEL): LlmClient {
  const client = new Anthropic({ apiKey });
  return {
    providerName: `anthropic:${model}`,
    async complete({ system, turns, maxTokens }: CompletionRequest): Promise<string> {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        // Community Q&A is not intelligence-sensitive; keep latency and cost low.
        output_config: { effort: 'low' },
        messages: turns.map((t) => ({ role: t.role, content: t.content })),
      });
      if (response.stop_reason === 'refusal') {
        return "I can't help with that one.";
      }
      return response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim();
    },
  };
}
