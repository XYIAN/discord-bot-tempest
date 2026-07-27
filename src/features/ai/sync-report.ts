import { AttachmentBuilder } from 'discord.js';
import type { BotContext } from '../../core/types.js';
import { getHomeGuild } from '../../lib/discord/home-guild.js';
import { resolveTextChannel } from '../../lib/discord/resolve.js';
import { COLORS, stormEmbed } from '../../lib/discord/send.js';
import { knowledgeStore } from './knowledge.js';

/**
 * Weekly knowledge sync: the autonomous replacement for the archero2 bot's
 * manually-run sync-facts CLI. Posts a digest of what the AI learned to
 * bot-logs with a full JSON export attached (the attachment doubles as an
 * off-site backup of the knowledge base). Skips quietly when nothing
 * changed since the last run — unless forced via /fact sync.
 */

interface SyncReportState {
  lastRunAt: string;
  lastSeenFactId: number;
}

export async function runSyncReport(ctx: BotContext, force = false): Promise<string> {
  const log = ctx.logger.child('sync-report');
  const store = ctx.stores.store<SyncReportState>('sync-report', { lastRunAt: '', lastSeenFactId: 0 });
  const state = await store.get();
  const knowledge = await knowledgeStore(ctx).get();

  const newFacts = knowledge.facts.filter((f) => f.id > state.lastSeenFactId);
  const pending = knowledge.facts.filter((f) => f.status === 'pending');
  const approvedTotal = knowledge.facts.filter((f) => f.status === 'approved').length;

  if (!force && newFacts.length === 0 && pending.length === 0) {
    log.info('Sync report skipped — no new facts since last run');
    return 'Nothing new to sync — the knowledge base is unchanged since the last report.';
  }

  const guild = getHomeGuild(ctx);
  if (!guild) return 'Home guild unavailable.';
  const channel = resolveTextChannel(guild, ctx.guild.channels.botLogs);
  if (!channel) return `Channel #${ctx.guild.channels.botLogs.name} not found.`;

  const contributors = new Map<string, number>();
  for (const fact of newFacts) {
    if (fact.addedBy) contributors.set(fact.addedBy, (contributors.get(fact.addedBy) ?? 0) + 1);
  }
  const contributorLine =
    [...contributors.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, n]) => `<@${userId}> (${n})`)
      .join(', ') || 'memory-sync / none';

  const embed = stormEmbed('🧠 Weekly knowledge sync', [
    `**New facts since last sync:** ${newFacts.length}`,
    `**Awaiting review:** ${pending.length}${pending.length > 0 ? ` — \`/fact list status:pending\` → \`/fact approve <id>\`` : ''}`,
    `**Total verified:** ${approvedTotal}`,
    `**Contributors this period:** ${contributorLine}`,
    '',
    'Full knowledge base attached (keep as backup).',
  ].join('\n')).setColor(COLORS.primary);

  const backup = new AttachmentBuilder(Buffer.from(JSON.stringify(knowledge, null, 2), 'utf8'), {
    name: `knowledge-${new Date().toISOString().slice(0, 10)}.json`,
  });

  try {
    await channel.send({ embeds: [embed], files: [backup], allowedMentions: { parse: [] } });
  } catch (error) {
    log.error('Failed to post sync report', error);
    return 'Failed to post the sync report — see logs.';
  }

  await store.set({
    lastRunAt: new Date().toISOString(),
    lastSeenFactId: knowledge.facts.reduce((max, f) => Math.max(max, f.id), state.lastSeenFactId),
  });
  log.info(`Sync report posted: ${newFacts.length} new, ${pending.length} pending`);
  return `Sync report posted to #${ctx.guild.channels.botLogs.name}: ${newFacts.length} new fact(s), ${pending.length} pending review.`;
}
