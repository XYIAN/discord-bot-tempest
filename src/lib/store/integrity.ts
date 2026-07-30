import type { BotContext } from '../../core/types.js';

/**
 * Startup integrity check for persisted state.
 *
 * Lesson learned from the archero2 bot: its contribution ledger silently came
 * up empty in production for months (a storage volume shadowed the committed
 * file), and because "missing" was treated as "empty", nothing ever complained
 * — every member's earned rank quietly evaporated. Empty critical state must be
 * loud, not silent.
 *
 * Tempest isn't vulnerable to that same shadowing (its data has only ever lived
 * on the volume), but a detached/recreated volume would look identical: stores
 * silently return defaults. This surfaces that immediately in #bot-logs.
 */

interface IntegrityState {
  /** Highest counts ever observed, so a drop to zero is detectable. */
  peaks: Record<string, number>;
}

export interface StoreCheck {
  name: string;
  /** Current size of the collection (facts, users, …). */
  count: number;
}

/**
 * Compare current store sizes against the high-water marks recorded on previous
 * boots. Returns human-readable warnings for anything that lost data.
 */
export async function checkStoreIntegrity(ctx: BotContext, checks: StoreCheck[]): Promise<string[]> {
  const store = ctx.stores.store<IntegrityState>('integrity', { peaks: {} });
  const warnings: string[] = [];

  await store.update((state) => {
    for (const { name, count } of checks) {
      const peak = state.peaks[name] ?? 0;
      if (peak > 0 && count === 0) {
        warnings.push(`**${name}** is EMPTY but previously held ${peak} record(s) — data may have been lost.`);
      } else if (peak > 0 && count < Math.floor(peak / 2)) {
        warnings.push(`**${name}** dropped from ${peak} to ${count} record(s) — unexpected data loss?`);
      }
      // Track the high-water mark (never lower it on a suspicious drop).
      state.peaks[name] = Math.max(peak, count);
    }
    return state;
  });

  return warnings;
}
