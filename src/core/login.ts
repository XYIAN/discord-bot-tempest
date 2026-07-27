import type { Client } from 'discord.js';
import type { Logger } from './logger.js';

const MAX_ATTEMPTS = 8;
const BASE_DELAY_MS = 5_000;

/** Errors that retrying will never fix (bad token, missing intents). */
function isFatal(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('invalid token') ||
    message.includes('token_invalid') ||
    message.includes('disallowed intents') ||
    message.includes('used disallowed intents')
  );
}

/**
 * Login with exponential backoff + jitter. On fatal or exhausted retries,
 * resolves with a degraded reason instead of throwing so the health server
 * stays up and Railway shows *why* instead of crash-looping.
 */
export async function loginWithRetry(
  client: Client,
  token: string,
  logger: Logger,
): Promise<{ degradedReason?: string }> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await client.login(token);
      return {};
    } catch (error) {
      if (isFatal(error)) {
        const reason = `Fatal Discord login error: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(reason);
        return { degradedReason: reason };
      }
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1) + Math.random() * 1_000;
      logger.warn(`Discord login attempt ${attempt}/${MAX_ATTEMPTS} failed; retrying in ${Math.round(delay / 1000)}s`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return { degradedReason: `Discord login failed after ${MAX_ATTEMPTS} attempts` };
}
