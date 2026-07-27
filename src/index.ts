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

  // If the bot gets invited to the home guild after boot, register commands
  // then too — otherwise they'd wait for the next redeploy.
  client.on('guildCreate', async (guild) => {
    if (guild.id !== config.guildId) return;
    logger.info(`Joined home guild ${guild.name}; registering slash commands`);
    try {
      await registry.registerSlashCommands();
    } catch (error) {
      logger.error('Slash command registration failed', error);
    }
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received; shutting down`);
    scheduler.stop();
    void (async () => {
      // Flush queued store writes before exiting so the last moments of
      // activity/achievement state aren't lost on redeploys.
      await Promise.race([
        Promise.allSettled([client.destroy(), ctx.stores.flushAll()]),
        new Promise((resolve) => setTimeout(resolve, 5_000)),
      ]);
      process.exit(0);
    })();
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
