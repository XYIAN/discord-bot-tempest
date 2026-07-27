import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadConfig } from './config/env.js';
import { guildConfig } from './config/guild.js';
import { createLogger } from './core/logger.js';
import { startHealthServer } from './core/health.js';
import { loginWithRetry } from './core/login.js';
import { FeatureRegistry } from './core/registry.js';
import { Scheduler } from './core/scheduler.js';
import type { BotContext } from './core/types.js';
import { createStoreProvider } from './lib/store/json-store.js';
import { readVersion } from './lib/version.js';
import { allFeatures } from './features/index.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const version = readVersion();
  logger.info(`Starting ${guildConfig.identity.botName} v${version}`);

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.Channel],
  });

  const ctx: BotContext = {
    client,
    config,
    guild: guildConfig,
    stores: createStoreProvider(config.dataDir, logger),
    logger,
  };

  const modules = allFeatures();
  const registry = new FeatureRegistry(modules, ctx);
  const scheduler = new Scheduler(modules, ctx);

  let degradedReason: string | undefined;
  startHealthServer(config.port, client, version, logger, () => degradedReason);

  registry.bindEvents();

  client.once('clientReady', async () => {
    logger.info(`Logged in as ${client.user?.tag}`);
    try {
      await registry.registerSlashCommands();
    } catch (error) {
      logger.error('Slash command registration failed', error);
    }
    await registry.initModules();
    scheduler.start();
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received; shutting down`);
    scheduler.stop();
    void client.destroy();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => logger.error('Unhandled rejection', reason));

  const result = await loginWithRetry(client, config.discordToken, logger);
  degradedReason = result.degradedReason;
}

main().catch((error) => {
  console.error('Fatal boot error:', error);
  process.exit(1);
});
