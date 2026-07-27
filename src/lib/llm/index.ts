import type { AppConfig } from '../../config/env.js';
import { createAnthropicClient } from './anthropic.js';
import { createOpenAiClient } from './openai.js';
import type { LlmClient } from './types.js';

export type { ChatTurn, CompletionRequest, LlmClient } from './types.js';

/** Anthropic preferred when both keys exist; undefined when neither does. */
export function createLlmClient(config: AppConfig): LlmClient | undefined {
  if (config.anthropicApiKey) return createAnthropicClient(config.anthropicApiKey);
  if (config.openaiApiKey) return createOpenAiClient(config.openaiApiKey);
  return undefined;
}
