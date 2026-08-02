import type { Message } from 'discord.js';
import type { Logger } from '../../core/logger.js';
import { isSupportedImageType, type ImagePart } from './types.js';

/**
 * Members post screenshots constantly — hero rosters, loadouts, event screens —
 * and before this the bot could only reply "I can't see your list of characters".
 * This pulls image attachments off a Discord message and turns them into content
 * parts the LLM can actually look at.
 */

/** Anthropic rejects images over 5MB; stay under it and skip anything larger. */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
/** A roster screenshot is one image. More than a few is cost, not signal. */
const MAX_IMAGES = 3;
const FETCH_TIMEOUT_MS = 10_000;

export interface CollectedImages {
  images: ImagePart[];
  /** Human-readable reasons attachments were skipped, for the reply. */
  skipped: string[];
}

export async function collectImageAttachments(
  message: Message,
  log: Logger,
): Promise<CollectedImages> {
  const images: ImagePart[] = [];
  const skipped: string[] = [];

  const candidates = [...message.attachments.values()].filter((a) =>
    isSupportedImageType(a.contentType),
  );
  const nonImages = message.attachments.size - candidates.length;
  if (nonImages > 0) {
    skipped.push(`${nonImages} attachment(s) that aren't images I can read`);
  }

  for (const attachment of candidates.slice(0, MAX_IMAGES)) {
    if (attachment.size > MAX_IMAGE_BYTES) {
      skipped.push(`**${attachment.name}** (too large — keep screenshots under 4MB)`);
      continue;
    }
    try {
      const response = await fetch(attachment.url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        skipped.push(`**${attachment.name}** (couldn't download it)`);
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      // Re-check after download: Discord's reported size can't be trusted blindly.
      if (buffer.byteLength > MAX_IMAGE_BYTES) {
        skipped.push(`**${attachment.name}** (too large — keep screenshots under 4MB)`);
        continue;
      }
      images.push({
        type: 'image',
        mediaType: attachment.contentType as ImagePart['mediaType'],
        data: buffer.toString('base64'),
      });
    } catch (error) {
      log.warn(`Failed to fetch attachment ${attachment.name}`, error);
      skipped.push(`**${attachment.name}** (couldn't download it)`);
    }
  }

  if (candidates.length > MAX_IMAGES) {
    skipped.push(`${candidates.length - MAX_IMAGES} extra image(s) — I look at the first ${MAX_IMAGES}`);
  }

  return { images, skipped };
}
