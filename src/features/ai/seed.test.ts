import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLogger } from '../../core/logger.js';
import { createStoreProvider } from '../../lib/store/json-store.js';
import type { BotContext } from '../../core/types.js';
import { knowledgeStore, removeFact, setFactStatus } from './knowledge.js';
import { applySeedFacts } from './seed.js';
import type { SeedFact } from './seed-facts.js';

const SEEDS: SeedFact[] = [
  { key: 'a', text: 'Storm runes boost lightning damage.', category: 'runes' },
  { key: 'b', text: 'The daily reset is at 9am Pacific.', category: 'game-modes' },
];

describe('applySeedFacts', () => {
  let dir: string;
  let ctx: BotContext;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tempest-seed-'));
    ctx = {
      stores: createStoreProvider(dir, createLogger('error')),
      logger: createLogger('error'),
    } as unknown as BotContext;
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('files seeds as approved facts credited to nobody', async () => {
    expect(await applySeedFacts(ctx, SEEDS)).toEqual({ added: 2, updated: 0, retired: 0 });
    const { facts } = await knowledgeStore(ctx).get();
    expect(facts).toHaveLength(2);
    expect(facts.every((f) => f.status === 'approved' && f.source === 'seed')).toBe(true);
    // Empty addedBy: seeds must not inflate anyone's contributor tier.
    expect(facts.every((f) => f.addedBy === '')).toBe(true);
    expect(facts.map((f) => f.id)).toEqual([1, 2]);
  });

  it('is idempotent across boots', async () => {
    await applySeedFacts(ctx, SEEDS);
    expect(await applySeedFacts(ctx, SEEDS)).toEqual({ added: 0, updated: 0, retired: 0 });
    expect((await knowledgeStore(ctx).get()).facts).toHaveLength(2);
  });

  it('corrects a fact in place when its text is edited', async () => {
    await applySeedFacts(ctx, SEEDS);
    const edited: SeedFact[] = [{ ...SEEDS[0], text: 'Storm runes boost lightning damage by 15%.' }, SEEDS[1]];
    expect(await applySeedFacts(ctx, edited)).toEqual({ added: 0, updated: 1, retired: 0 });

    const { facts } = await knowledgeStore(ctx).get();
    expect(facts).toHaveLength(2);
    expect(facts.find((f) => f.seedKey === 'a')?.text).toBe('Storm runes boost lightning damage by 15%.');
  });

  it('does not resurrect a fact a moderator deleted', async () => {
    await applySeedFacts(ctx, SEEDS);
    const { facts } = await knowledgeStore(ctx).get();
    await removeFact(ctx, facts.find((f) => f.seedKey === 'a')!.id);

    expect(await applySeedFacts(ctx, SEEDS)).toEqual({ added: 0, updated: 0, retired: 1 });
    expect((await knowledgeStore(ctx).get()).facts).toHaveLength(1);
  });

  it('leaves a rejected seed rejected', async () => {
    await applySeedFacts(ctx, SEEDS);
    const { facts } = await knowledgeStore(ctx).get();
    await setFactStatus(ctx, facts.find((f) => f.seedKey === 'b')!.id, 'rejected', 'mod');

    await applySeedFacts(ctx, SEEDS);
    const after = await knowledgeStore(ctx).get();
    expect(after.facts.find((f) => f.seedKey === 'b')?.status).toBe('rejected');
  });

  it('skips entries with an unknown category rather than filing them as general', async () => {
    const bad = [{ key: 'x', text: 'Nonsense.', category: 'weapons' } as unknown as SeedFact];
    expect(await applySeedFacts(ctx, bad)).toEqual({ added: 0, updated: 0, retired: 0 });
    expect((await knowledgeStore(ctx).get()).facts).toHaveLength(0);
  });

  it('flattens multi-line text so it cannot break the prompt layout', async () => {
    await applySeedFacts(ctx, [{ key: 'm', text: 'Line one.\n\n# Line two `x`', category: 'general' }]);
    const { facts } = await knowledgeStore(ctx).get();
    expect(facts[0].text).toBe('Line one. Line two x');
  });

  it('seeds a store written before seededKeys existed', async () => {
    // Simulates the live volume: the loader returns the file verbatim, so a
    // pre-existing knowledge.json has no seededKeys field at all.
    await knowledgeStore(ctx).set({ nextId: 5, facts: [] } as never);
    expect(await applySeedFacts(ctx, SEEDS)).toEqual({ added: 2, updated: 0, retired: 0 });
    const state = await knowledgeStore(ctx).get();
    expect(state.facts.map((f) => f.id)).toEqual([5, 6]);
    expect(state.seededKeys).toEqual(['a', 'b']);
  });
});
