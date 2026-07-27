import type { AppConfig } from '../../config/env.js';
import type { FeatureModule } from '../../core/types.js';
import { defineEvent } from '../../core/types.js';
import { createLlmClient } from '../../lib/llm/index.js';
import { handleAiMessage } from './chat.js';
import { factCommand } from './facts-command.js';
import { runMemorySync } from './memory-sync.js';

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
    jobs: llm
      ? [
          {
            name: 'memory-sync',
            // Nightly at 04:00 UTC — quiet hours for a mostly-US guild.
            cron: '0 4 * * *',
            run: (ctx) => runMemorySync(ctx, llm),
          },
        ]
      : [],
    init(ctx) {
      if (llm) ctx.logger.info(`Tempest AI online via ${llm.providerName}`);
      else ctx.logger.warn('Tempest AI disabled — set ANTHROPIC_API_KEY (or OPENAI_API_KEY)');
    },
  };
}
