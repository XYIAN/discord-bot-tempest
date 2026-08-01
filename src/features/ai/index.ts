import type { AppConfig } from '../../config/env.js';
import type { BotContext, FeatureModule } from '../../core/types.js';
import { defineEvent } from '../../core/types.js';
import { createLlmClient } from '../../lib/llm/index.js';
import { handleAiMessage } from './chat.js';
import { factCommand } from './facts-command.js';
import { runMemorySync } from './memory-sync.js';
import { applySeedFacts } from './seed.js';
import { runSyncReport } from './sync-report.js';

/**
 * Tempest AI: answers game questions in the AI channel using the community
 * knowledge base, learns via /fact submissions, and autonomously extracts
 * new candidate facts from conversations every night.
 */
export function aiFeature(config: AppConfig): FeatureModule {
  const llm = createLlmClient(config);

  return {
    name: 'ai',
    commands: [factCommand],
    events: llm
      ? [
          defineEvent({
            event: 'messageCreate',
            handler: (ctx, message) => handleAiMessage(ctx, llm, message),
          }),
        ]
      : [],
    jobs: [
      ...(llm
        ? [
            {
              name: 'memory-sync',
              // Nightly at 04:00 UTC — quiet hours for a mostly-US guild.
              cron: '0 4 * * *',
              run: (ctx: BotContext) => runMemorySync(ctx, llm),
            },
          ]
        : []),
      {
        name: 'weekly-sync-report',
        // Saturday 10:00 Pacific; skips itself when nothing changed.
        cron: '0 10 * * 6',
        timezone: 'America/Los_Angeles',
        run: async (ctx: BotContext) => {
          await runSyncReport(ctx);
        },
      },
    ],
    async init(ctx) {
      if (llm) ctx.logger.info(`Tempest AI online via ${llm.providerName}`);
      else ctx.logger.warn('Tempest AI disabled — set ANTHROPIC_API_KEY (or OPENAI_API_KEY)');

      const seeded = await applySeedFacts(ctx);
      if (seeded.added || seeded.updated) {
        ctx.logger.info(
          `Seed knowledge applied: ${seeded.added} added, ${seeded.updated} updated, ${seeded.retired} retired`,
        );
      }
    },
  };
}
