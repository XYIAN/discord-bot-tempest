import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../core/logger.js';
import { createStoreProvider } from './json-store.js';
import { checkStoreIntegrity } from './integrity.js';
import type { BotContext } from '../../core/types.js';

describe('checkStoreIntegrity', () => {
  let dir: string;
  let ctx: BotContext;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tempest-integrity-'));
    ctx = { stores: createStoreProvider(dir, createLogger('error')) } as unknown as BotContext;
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('is silent on a first boot (no history to compare against)', async () => {
    expect(await checkStoreIntegrity(ctx, [{ name: 'knowledge', count: 0 }])).toEqual([]);
    expect(await checkStoreIntegrity(ctx, [{ name: 'activity', count: 12 }])).toEqual([]);
  });

  it('is silent while data grows normally', async () => {
    await checkStoreIntegrity(ctx, [{ name: 'knowledge', count: 10 }]);
    expect(await checkStoreIntegrity(ctx, [{ name: 'knowledge', count: 25 }])).toEqual([]);
  });

  it('screams when a populated store comes up empty (the archero2 failure)', async () => {
    await checkStoreIntegrity(ctx, [{ name: 'knowledge', count: 52 }]);
    const warnings = await checkStoreIntegrity(ctx, [{ name: 'knowledge', count: 0 }]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('EMPTY');
    expect(warnings[0]).toContain('52');
  });

  it('warns on a large partial loss', async () => {
    await checkStoreIntegrity(ctx, [{ name: 'activity', count: 100 }]);
    const warnings = await checkStoreIntegrity(ctx, [{ name: 'activity', count: 20 }]);
    expect(warnings[0]).toContain('dropped from 100 to 20');
  });

  it('keeps the high-water mark so a loss stays detectable', async () => {
    await checkStoreIntegrity(ctx, [{ name: 'k', count: 50 }]);
    await checkStoreIntegrity(ctx, [{ name: 'k', count: 0 }]);
    const again = await checkStoreIntegrity(ctx, [{ name: 'k', count: 0 }]);
    expect(again[0]).toContain('50');
  });
});
