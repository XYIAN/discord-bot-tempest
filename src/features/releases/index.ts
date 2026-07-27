import { readFile } from 'node:fs/promises';
import type { BotContext, FeatureModule } from '../../core/types.js';
import { addLogListener } from '../../core/logger.js';
import { getHomeGuild } from '../../lib/discord/home-guild.js';
import { COLORS, sendToChannel, stormEmbed } from '../../lib/discord/send.js';
import { readVersion } from '../../lib/version.js';
import { extractVersionNotes } from './changelog.js';

/**
 * Autonomous release + debug-log pipeline:
 *
 * 1. Every deploy posts a notice to bot-logs with version + git metadata
 *    (Railway injects the commit sha/message — nothing manual).
 * 2. When the deployed version is new (persisted dedupe, not
 *    channel-history scraping), release notes go to #changelog: the
 *    CHANGELOG.md section if one exists, otherwise the commit message.
 * 3. warn/error log lines are batched and forwarded to bot-logs so the
 *    debug channel stays a live view of bot health.
 */

interface ReleaseState {
  lastAnnouncedVersion: string;
  lastAnnouncedDeployment: string;
}

const FLUSH_INTERVAL_MS = 15_000;
const MAX_LINES_PER_FLUSH = 12;

async function announceDeploy(ctx: BotContext, version: string): Promise<void> {
  const guild = getHomeGuild(ctx);
  if (!guild) return;
  const log = ctx.logger.child('releases');
  const { railway } = ctx.config;
  const store = ctx.stores.store<ReleaseState>('releases', { lastAnnouncedVersion: '', lastAnnouncedDeployment: '' });
  const state = await store.get();

  // Dedupe the deploy notice per deployment (or per version when running
  // outside Railway) so crash-loop restarts don't spam bot-logs.
  const deployKey = railway.deploymentId ?? `local:${version}`;
  if (state.lastAnnouncedDeployment !== deployKey) {
    const shortSha = railway.commitSha?.slice(0, 7);
    const sent = await sendToChannel(
      guild,
      ctx.guild.channels.botLogs,
      {
        embeds: [
          stormEmbed('🚀 Deployed', [
            `**Version:** v${version}`,
            shortSha ? `**Commit:** \`${shortSha}\` ${railway.commitMessage ?? ''}` : '**Commit:** local/dev run',
            railway.deploymentId ? `**Deployment:** ${railway.deploymentId}` : null,
          ].filter(Boolean).join('\n')).setColor(COLORS.success),
        ],
      },
      log,
    );
    if (sent) await store.update((s) => ({ ...s, lastAnnouncedDeployment: deployKey }));
  }

  if (state.lastAnnouncedVersion === version) return;

  let notes: string | undefined;
  try {
    notes = extractVersionNotes(await readFile('CHANGELOG.md', 'utf8'), version);
  } catch {
    // no changelog file — fall through to commit message
  }
  notes ??= railway.commitMessage;

  const sent = await sendToChannel(
    guild,
    ctx.guild.channels.changelog,
    {
      embeds: [
        stormEmbed(`📦 ${ctx.guild.identity.botName} v${version}`, (notes ?? 'New release.').slice(0, 3900)),
      ],
    },
    log,
  );
  if (sent) await store.update((s) => ({ ...s, lastAnnouncedVersion: version }));
}

function startLogForwarding(ctx: BotContext): void {
  const buffer: string[] = [];
  let dropped = 0;
  addLogListener((level, line) => {
    if (level !== 'warn' && level !== 'error') return;
    if (buffer.length >= MAX_LINES_PER_FLUSH) dropped++;
    else buffer.push(line);
  });
  setInterval(() => {
    void (async () => {
      if (buffer.length === 0) return;
      const guild = getHomeGuild(ctx);
      if (!guild) return;
      const lines = buffer.splice(0, buffer.length);
      const extra = dropped > 0 ? `\n…and ${dropped} more` : '';
      dropped = 0;
      // Log lines can embed user/API content: neutralize code-fence escapes,
      // mask long token-like strings, and never allow mentions.
      const safe = lines
        .join('\n')
        .replaceAll('```', "'''")
        .replace(/[A-Za-z0-9_-]{35,}/g, (m) => `${m.slice(0, 6)}…[redacted]`)
        .slice(0, 1800);
      // Send directly (not via logger-aware helpers) to avoid feedback loops:
      // a failed forward must not log a warn that gets forwarded again.
      const channel = guild.channels.cache.find(
        (c) => c.isTextBased() && 'name' in c && c.name === ctx.guild.channels.botLogs.name,
      );
      if (channel?.isTextBased()) {
        await channel
          .send({ content: `\`\`\`\n${safe}${extra}\n\`\`\``, allowedMentions: { parse: [] } })
          .catch(() => undefined);
      }
    })();
  }, FLUSH_INTERVAL_MS).unref();
}

export function releasesFeature(): FeatureModule {
  return {
    name: 'releases',
    async init(ctx) {
      startLogForwarding(ctx);
      await announceDeploy(ctx, readVersion());
    },
  };
}
