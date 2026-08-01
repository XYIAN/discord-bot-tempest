import type { BotContext } from '../../core/types.js';
import { CATEGORIES, knowledgeStore, type Fact, type KnowledgeState } from './knowledge.js';
import { SEED_FACTS, type SeedFact } from './seed-facts.js';

export interface SeedResult {
  added: number;
  updated: number;
  /** Seeds skipped because a moderator deleted or rejected them. */
  retired: number;
}

/** Seeded facts are inlined into the AI prompt — keep them single-line and markdown-flat. */
function sanitize(text: string): string {
  // Strip markdown before collapsing whitespace, not after — otherwise a
  // removed "# " leaves a double space behind.
  return text.replace(/[`#]/g, '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

/**
 * Apply the committed seed knowledge base to the store, idempotently.
 *
 * Facts are keyed by `SeedFact.key`, not by text, so editing an entry corrects
 * the fact in place rather than filing a near-duplicate — which is the whole
 * point: a wrong number gets fixed in a PR and ships on the next deploy.
 *
 * Moderator decisions win over the file. A seeded fact that was rejected keeps
 * its status, and one that was deleted outright stays gone (`seededKeys`
 * remembers it was applied), so `/fact remove` isn't undone by a redeploy.
 */
export async function applySeedFacts(ctx: BotContext, seeds: SeedFact[] = SEED_FACTS): Promise<SeedResult> {
  const result: SeedResult = { added: 0, updated: 0, retired: 0 };
  if (seeds.length === 0) return result;

  const valid = seeds.filter((s) => (CATEGORIES as readonly string[]).includes(s.category));
  for (const seed of seeds) {
    if (!valid.includes(seed)) {
      ctx.logger.child('ai').warn(`Seed fact "${seed.key}" has unknown category "${seed.category}" — skipped`);
    }
  }

  await knowledgeStore(ctx).update((state: KnowledgeState) => {
    // Stores written before seeding existed have no seededKeys — the store
    // loader returns the file as-is and does not merge in new defaults.
    const applied = new Set(state.seededKeys ?? []);
    const byKey = new Map<string, Fact>();
    for (const fact of state.facts) {
      if (fact.seedKey) byKey.set(fact.seedKey, fact);
    }

    for (const seed of valid) {
      const text = sanitize(seed.text);
      const existing = byKey.get(seed.key);

      if (existing) {
        if (existing.text !== text || existing.category !== seed.category) {
          existing.text = text;
          existing.category = seed.category;
          result.updated++;
        }
        continue;
      }
      if (applied.has(seed.key)) {
        // Applied before, no fact now: a moderator removed it. Leave it dead.
        result.retired++;
        continue;
      }

      state.facts.push({
        id: state.nextId,
        text,
        category: seed.category,
        // Curated in-repo and reviewed in a PR — the same trust level as a
        // moderator's own /fact add, which is also auto-approved.
        status: 'approved',
        // Empty addedBy: seeds credit nobody, so they can't inflate anyone's
        // contributor tier.
        addedBy: '',
        addedByName: 'seed',
        addedAt: new Date().toISOString(),
        source: 'seed',
        seedKey: seed.key,
      });
      state.nextId += 1;
      applied.add(seed.key);
      result.added++;
    }

    state.seededKeys = [...applied];
    return state;
  });

  return result;
}
