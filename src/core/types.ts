import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import type { AppConfig } from '../config/env.js';
import type { GuildConfig } from '../config/guild.js';
import type { Logger } from './logger.js';
import type { StoreProvider } from '../lib/store/json-store.js';

/** Everything a feature is allowed to depend on. Features never import each other. */
export interface BotContext {
  client: Client;
  config: AppConfig;
  guild: GuildConfig;
  stores: StoreProvider;
  logger: Logger;
}

export interface SlashCommand {
  data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute(interaction: ChatInputCommandInteraction, ctx: BotContext): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction, ctx: BotContext): Promise<void>;
}

export interface EventBinding {
  event: keyof ClientEvents;
  once?: boolean;
  handler(ctx: BotContext, ...args: unknown[]): void | Promise<void>;
}

/** Type-preserving helper so feature code gets fully typed event args. */
export function defineEvent<K extends keyof ClientEvents>(binding: {
  event: K;
  once?: boolean;
  handler(ctx: BotContext, ...args: ClientEvents[K]): void | Promise<void>;
}): EventBinding {
  return binding as unknown as EventBinding;
}

export interface ScheduledJob {
  name: string;
  /** Standard 5/6-field cron expression. */
  cron: string;
  /** IANA timezone, e.g. "America/Los_Angeles". Defaults to UTC. */
  timezone?: string;
  run(ctx: BotContext): Promise<void>;
}

/**
 * A self-contained feature. The core composes modules; modules never
 * reach into the core or into each other.
 */
export interface FeatureModule {
  name: string;
  commands?: SlashCommand[];
  events?: EventBinding[];
  jobs?: ScheduledJob[];
  /** Runs once after the client is ready. */
  init?(ctx: BotContext): void | Promise<void>;
}
