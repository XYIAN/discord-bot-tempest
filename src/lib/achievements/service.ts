import type { BotContext } from '../../core/types.js';
import { getHomeGuild } from '../discord/home-guild.js';
import { sendToChannel, stormEmbed } from '../discord/send.js';
import { ACHIEVEMENTS, type UserStats } from './definitions.js';

/**
 * Shared achievement engine. Features record stat changes through these
 * functions (features never import each other — this lib is the contract);
 * new unlocks are announced in general automatically.
 */

interface AchievementsState {
  stats: Record<string, UserStats>;
  unlocked: Record<string, string[]>;
}

const EMPTY_STATS: UserStats = { messages: 0, daysActive: [], factsApproved: 0, aiQuestions: 0, joinedGuild: false };
const MAX_DAYS_TRACKED = 60;

function achievementsStore(ctx: BotContext) {
  return ctx.stores.store<AchievementsState>('achievements', { stats: {}, unlocked: {} });
}

async function applyStatChange(
  ctx: BotContext,
  userId: string,
  mutate: (stats: UserStats) => void,
): Promise<void> {
  const newlyUnlocked: string[] = [];
  await achievementsStore(ctx).update((state) => {
    const stats = state.stats[userId] ?? structuredClone(EMPTY_STATS);
    mutate(stats);
    if (stats.daysActive.length > MAX_DAYS_TRACKED) stats.daysActive = stats.daysActive.slice(-MAX_DAYS_TRACKED);
    state.stats[userId] = stats;

    const already = new Set(state.unlocked[userId] ?? []);
    for (const def of ACHIEVEMENTS) {
      if (!already.has(def.id) && def.unlocked(stats)) {
        already.add(def.id);
        newlyUnlocked.push(def.id);
      }
    }
    state.unlocked[userId] = [...already];
    return state;
  });

  if (newlyUnlocked.length === 0) return;
  const guild = getHomeGuild(ctx);
  if (!guild) return;
  for (const id of newlyUnlocked) {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) continue;
    await sendToChannel(
      guild,
      ctx.guild.channels.general,
      {
        embeds: [
          stormEmbed(`${def.emoji} Achievement unlocked!`, `<@${userId}> earned **${def.name}** — ${def.description}`),
        ],
      },
      ctx.logger.child('achievements'),
    );
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function recordMessage(ctx: BotContext, userId: string): Promise<void> {
  return applyStatChange(ctx, userId, (stats) => {
    stats.messages += 1;
    const day = today();
    if (!stats.daysActive.includes(day)) stats.daysActive.push(day);
  });
}

export function recordAiQuestion(ctx: BotContext, userId: string): Promise<void> {
  return applyStatChange(ctx, userId, (stats) => {
    stats.aiQuestions += 1;
  });
}

export function recordFactApproved(ctx: BotContext, userId: string): Promise<void> {
  return applyStatChange(ctx, userId, (stats) => {
    stats.factsApproved += 1;
  });
}

export function recordGuildJoin(ctx: BotContext, userId: string): Promise<void> {
  return applyStatChange(ctx, userId, (stats) => {
    stats.joinedGuild = true;
  });
}

export async function getUserAchievements(ctx: BotContext, userId: string) {
  const state = await achievementsStore(ctx).get();
  const unlockedIds = new Set(state.unlocked[userId] ?? []);
  return {
    stats: state.stats[userId] ?? EMPTY_STATS,
    unlocked: ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)),
    locked: ACHIEVEMENTS.filter((a) => !unlockedIds.has(a.id)),
  };
}
