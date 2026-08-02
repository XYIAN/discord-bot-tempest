import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Message } from 'discord.js';
import { createLogger } from '../../core/logger.js';
import { collectImageAttachments } from './attachments.js';
import { isSupportedImageType, turnToText } from './types.js';

const log = createLogger('error');

function messageWith(attachments: { name: string; contentType: string | null; size: number; url: string }[]) {
  return {
    attachments: new Map(attachments.map((a, i) => [String(i), a])),
  } as unknown as Message;
}

// Node Buffers share a pooled ArrayBuffer, so `.buffer` would hand back the
// whole pool. Build a standalone ArrayBuffer for the fetch mock instead.
const PNG_BYTES = new TextEncoder().encode('fake-png-bytes');
const pngArrayBuffer = () => PNG_BYTES.slice().buffer;

describe('collectImageAttachments', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, arrayBuffer: async () => pngArrayBuffer() })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns nothing when there are no attachments', async () => {
    const { images, skipped } = await collectImageAttachments(messageWith([]), log);
    expect(images).toEqual([]);
    expect(skipped).toEqual([]);
  });

  it('base64-encodes a supported image', async () => {
    const { images } = await collectImageAttachments(
      messageWith([{ name: 'roster.png', contentType: 'image/png', size: 1000, url: 'https://cdn/x.png' }]),
      log,
    );
    expect(images).toHaveLength(1);
    expect(images[0].mediaType).toBe('image/png');
    expect(Buffer.from(images[0].data, 'base64').toString()).toBe('fake-png-bytes');
  });

  it('skips non-image attachments and says how many', async () => {
    const { images, skipped } = await collectImageAttachments(
      messageWith([{ name: 'save.zip', contentType: 'application/zip', size: 10, url: 'https://cdn/x.zip' }]),
      log,
    );
    expect(images).toEqual([]);
    expect(skipped[0]).toContain("1 attachment(s) that aren't images");
  });

  it('skips oversized images rather than failing the whole request', async () => {
    const { images, skipped } = await collectImageAttachments(
      messageWith([
        { name: 'huge.png', contentType: 'image/png', size: 50 * 1024 * 1024, url: 'https://cdn/h.png' },
        { name: 'ok.png', contentType: 'image/png', size: 100, url: 'https://cdn/o.png' },
      ]),
      log,
    );
    // The good one still goes through — one bad attachment must not lose the rest.
    expect(images).toHaveLength(1);
    expect(skipped.join(' ')).toContain('huge.png');
  });

  it('caps how many images it reads and reports the overflow', async () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      name: `s${i}.png`,
      contentType: 'image/png',
      size: 100,
      url: `https://cdn/${i}.png`,
    }));
    const { images, skipped } = await collectImageAttachments(messageWith(many), log);
    expect(images).toHaveLength(3);
    expect(skipped.join(' ')).toContain('3 extra image(s)');
  });

  it('reports a download failure instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, arrayBuffer: async () => pngArrayBuffer() })));
    const { images, skipped } = await collectImageAttachments(
      messageWith([{ name: 'gone.png', contentType: 'image/png', size: 100, url: 'https://cdn/g.png' }]),
      log,
    );
    expect(images).toEqual([]);
    expect(skipped.join(' ')).toContain('gone.png');
  });
});

describe('image type guard', () => {
  it('accepts the four supported types and rejects others', () => {
    expect(isSupportedImageType('image/png')).toBe(true);
    expect(isSupportedImageType('image/webp')).toBe(true);
    expect(isSupportedImageType('image/svg+xml')).toBe(false);
    expect(isSupportedImageType(null)).toBe(false);
    expect(isSupportedImageType(undefined)).toBe(false);
  });
});

describe('turnToText', () => {
  it('passes plain strings through', () => {
    expect(turnToText('hello')).toBe('hello');
  });

  it('replaces image parts with a placeholder so history stays small', () => {
    const text = turnToText([
      { type: 'text', text: 'my roster' },
      { type: 'image', mediaType: 'image/png', data: 'AAAA' },
    ]);
    expect(text).toBe('my roster [screenshot]');
    expect(text).not.toContain('AAAA');
  });
});
