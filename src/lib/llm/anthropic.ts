import Anthropic from '@anthropic-ai/sdk';
import type { ChatTurn, CompletionRequest, LlmClient } from './types.js';

const DEFAULT_MODEL = 'claude-opus-5';

function toContent(content: ChatTurn['content']): Anthropic.MessageParam['content'] {
  if (typeof content === 'string') return content;
  return content.map((part) =>
    part.type === 'text'
      ? ({ type: 'text', text: part.text } as const)
      : ({
          type: 'image',
          source: { type: 'base64', media_type: part.mediaType, data: part.data },
        } as const),
  );
}

export function createAnthropicClient(apiKey: string, model = DEFAULT_MODEL): LlmClient {
  const client = new Anthropic({ apiKey });
  return {
    providerName: `anthropic:${model}`,
    supportsImages: true,
    async complete({ system, turns, maxTokens }: CompletionRequest): Promise<string> {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        // Community Q&A is not intelligence-sensitive; keep latency and cost low.
        output_config: { effort: 'low' },
        messages: turns.map((t) => ({ role: t.role, content: toContent(t.content) })),
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
