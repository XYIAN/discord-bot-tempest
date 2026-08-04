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
  // Keep the handle: the health server holds an open listener (and keep-alive
  // sockets from Railway's probe), so it must be closed on shutdown rather
  // than left for process.exit to tear down.
  const healthServer = startHealthServer(config.port, client, version, logger, () => degradedReason);

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

  // Exit fast and cleanly on shutdown. Railway sends SIGTERM when retiring a
  // container during a redeploy and SIGKILLs it if it lingers past the grace
  // window — a SIGKILL reads as a "crash". So: flush persisted state (the only
  // thing worth waiting for, with a tight cap), fire the gateway teardown
  // without blocking on it, and exit(0) promptly. Idempotent against repeat
  // signals.
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received; shutting down`);
    scheduler.stop();
    // Stop accepting probes first so Railway sees the listener go away
    // immediately, rather than the container appearing to linger.
    healthServer.close();
    healthServer.closeAllConnections?.();
    void client.destroy();
    void (async () => {
      await Promise.race([
        ctx.stores.flushAll(),
        new Promise((resolve) => setTimeout(resolve, 2_000)),
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
