import 'dotenv/config';

export interface AppConfig {
  discordToken: string;
  clientId: string;
  guildId: string;
  ownerId: string;
  anthropicApiKey: string | undefined;
  openaiApiKey: string | undefined;
  port: number;
  dataDir: string;
  lobbyChannelIds: string[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Injected by Railway on deploys; used for autonomous release notices. */
  railway: {
    commitSha: string | undefined;
    commitMessage: string | undefined;
    deploymentId: string | undefined;
  };
}

function required(name: string, problems: string[]): string {
  const value = process.env[name]?.trim();
  if (!value) problems.push(`Missing required env var: ${name}`);
  return value ?? '';
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

function parseLogLevel(value: string | undefined, problems: string[]): AppConfig['logLevel'] {
  if (value === undefined) return 'info';
  if ((LOG_LEVELS as readonly string[]).includes(value)) return value as AppConfig['logLevel'];
  problems.push(`LOG_LEVEL must be one of ${LOG_LEVELS.join(', ')} (got "${value}")`);
  return 'info';
}

/**
 * Parse and validate all environment configuration up front so a
 * misconfigured deploy fails at boot with every problem listed at once.
 */
export function loadConfig(): AppConfig {
  const problems: string[] = [];

  const config: AppConfig = {
    discordToken: required('DISCORD_TOKEN', problems),
    clientId: required('DISCORD_CLIENT_ID', problems),
    guildId: required('GUILD_ID', problems),
    ownerId: required('OWNER_ID', problems),
    anthropicApiKey: optional('ANTHROPIC_API_KEY'),
    openaiApiKey: optional('OPENAI_API_KEY'),
    port: Number(optional('PORT') ?? 3000),
    dataDir: optional('DATA_DIR') ?? 'data',
    lobbyChannelIds: (optional('LOBBY_CHANNEL_IDS') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
    logLevel: parseLogLevel(optional('LOG_LEVEL'), problems),
    railway: {
      commitSha: optional('RAILWAY_GIT_COMMIT_SHA'),
      commitMessage: optional('RAILWAY_GIT_COMMIT_MESSAGE'),
      deploymentId: optional('RAILWAY_DEPLOYMENT_ID'),
    },
  };

  if (Number.isNaN(config.port)) problems.push('PORT must be a number');
  if (problems.length > 0) {
    throw new Error(`Invalid configuration:\n  - ${problems.join('\n  - ')}`);
  }
  return config;
}
