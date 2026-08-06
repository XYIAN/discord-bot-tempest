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

  it('does NOT truncate a long fact — the 500-char slice destroyed real data', async () => {
    // Regression. sanitize() used to end in .slice(0, 500), which silently cut
    // 19 committed facts mid-sentence on every boot, including four SPINE facts
    // that go into every prompt. The worst was hero-abbreviations, cut at
    // "PB = Panda Brewmaste|r" — losing "SW = Starlight Weaver", the exact
    // entry the fact was written to add.
    //
    // The 500 belongs on the /fact add path, where Discord enforces it on
    // untrusted member input. Committed seeds are reviewed in a diff.
    const long = `Long fact. ${'padding word '.repeat(60)}END-MARKER`;
    expect(long.length).toBeGreaterThan(500);
    await applySeedFacts(ctx, [{ key: 'long', text: long, category: 'general' }]);
    const { facts } = await knowledgeStore(ctx).get();
    expect(facts[0]!.text).toContain('END-MARKER');
    expect(facts[0]!.text.length).toBeGreaterThan(500);
  });

  it('every real seed fact survives sanitize with its meaning intact', async () => {
    // Guards the whole committed corpus, not just a synthetic case: if anyone
    // reintroduces a cap, the facts that would lose text are named.
    const { SEED_FACTS } = await import('./seed-facts.js');
    await applySeedFacts(ctx, SEED_FACTS);
    const { facts } = await knowledgeStore(ctx).get();
    const stored = new Map(facts.map((f) => [f.seedKey, f.text]));

    const mangled: string[] = [];
    for (const seed of SEED_FACTS) {
      const expected = seed.text.replace(/[`#]/g, '').replace(/\s+/g, ' ').trim();
      if (stored.get(seed.key) !== expected) mangled.push(seed.key);
    }
    expect(mangled).toEqual([]);
  });

  it('the abbreviation table still contains the entry it was written for', async () => {
    // The narrowest possible statement of the bug: SW = Starlight Weaver sits
    // at character ~560 of hero-abbreviations and was being cut off, so the
    // module built to stop the bot guessing "SW" never had SW in it.
    const { SEED_FACTS } = await import('./seed-facts.js');
    const abbr = SEED_FACTS.find((f) => f.key === 'hero-abbreviations');
    expect(abbr, 'hero-abbreviations must exist').toBeDefined();
    await applySeedFacts(ctx, [abbr!]);
    const { facts } = await knowledgeStore(ctx).get();
    expect(facts[0]!.text).toContain('SW = Starlight Weaver');
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
