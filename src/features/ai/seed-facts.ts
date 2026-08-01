import type { CATEGORIES } from './knowledge.js';

export interface SeedFact {
  /**
   * Stable, permanent identifier. Edit an entry's `text` freely — the key is
   * what ties it to the fact already in the store. NEVER reuse or renumber a
   * key: changing it orphans the old fact and files a duplicate.
   */
  key: string;
  text: string;
  category: (typeof CATEGORIES)[number];
}

/**
 * The curated base knowledge base, applied on boot (see seed.ts).
 *
 * This file is the source of truth for facts we author ourselves — it is
 * version-controlled, reviewable in a diff, and survives losing the data
 * volume. Community `/fact add` submissions and memory-sync candidates still
 * live only in the store; they are not mirrored here.
 *
 * Rules for entries:
 * - One self-contained claim per fact. The AI sees them as an unordered
 *   bulleted list grouped by category, so a fact that only makes sense next
 *   to its neighbour will get separated and misread.
 * - Single line, no markdown, under 500 characters (sanitized on load).
 * - Name the subject explicitly. "It scales with attack" is useless once the
 *   relevance filter drops the fact that said what "it" was.
 * - Numbers that a balance patch can change should say so, so the AI hedges
 *   instead of stating a stale value as gospel.
 *
 * Example:
 *   { key: 'hero-blaze-ult', category: 'heroes',
 *     text: 'Blaze\'s ultimate deals area fire damage and scales with attack power; as of the 2026-07 patch its cooldown is 30 seconds.' },
 */
export const SEED_FACTS: SeedFact[] = [];
