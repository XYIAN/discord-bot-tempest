/** Media types both providers accept. Anything else is dropped before the call. */
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

export interface ImagePart {
  type: 'image';
  mediaType: SupportedImageType;
  /** Base64-encoded bytes, no data: prefix. */
  data: string;
}

export interface TextPart {
  type: 'text';
  text: string;
}

export type ContentPart = TextPart | ImagePart;

export interface ChatTurn {
  role: 'user' | 'assistant';
  /**
   * Plain string for text-only turns. The array form carries images — used
   * for the live request only. Persisted history always stores the string
   * form, so the conversations store never fills up with base64.
   */
  content: string | ContentPart[];
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
  /** False when the provider/model can't accept images, so callers can say so. */
  readonly supportsImages: boolean;
}

export function isSupportedImageType(value: string | null | undefined): value is SupportedImageType {
  return !!value && (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(value);
}

/** Collapse a turn to plain text — for persisted history and text-only providers. */
export function turnToText(content: string | ContentPart[]): string {
  if (typeof content === 'string') return content;
  return content
    .map((p) => (p.type === 'text' ? p.text : '[screenshot]'))
    .join(' ')
    .trim();
}
