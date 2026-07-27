export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  system: string;
  turns: ChatTurn[];
  maxTokens: number;
}

/**
 * Minimal LLM abstraction so the AI feature doesn't care which provider
 * backs it. Implementations: Anthropic (preferred), OpenAI (fallback for
 * the key already used by the sibling bots).
 */
export interface LlmClient {
  readonly providerName: string;
  complete(request: CompletionRequest): Promise<string>;
}
