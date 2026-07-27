import { MessageFlags, REST, Routes, type Interaction } from 'discord.js';
import type { BotContext, FeatureModule, SlashCommand } from './types.js';

/**
 * Wires feature modules into the client: registers slash commands with
 * Discord, binds event handlers, and routes interactions. Every handler is
 * wrapped so a single feature's error is logged, reported to the user when
 * possible, and never crashes the bot.
 */
export class FeatureRegistry {
  private readonly commands = new Map<string, SlashCommand>();

  constructor(
    private readonly modules: FeatureModule[],
    private readonly ctx: BotContext,
  ) {}

  async registerSlashCommands(): Promise<void> {
    const log = this.ctx.logger.child('registry');
    const body = [];
    for (const mod of this.modules) {
      for (const command of mod.commands ?? []) {
        if (this.commands.has(command.data.name)) {
          throw new Error(`Duplicate slash command "${command.data.name}" (module ${mod.name})`);
        }
        this.commands.set(command.data.name, command);
        body.push(command.data);
      }
    }
    const rest = new REST().setToken(this.ctx.config.discordToken);
    await rest.put(Routes.applicationGuildCommands(this.ctx.config.clientId, this.ctx.config.guildId), {
      body,
    });
    log.info(`Registered ${body.length} slash commands for guild ${this.ctx.config.guildId}`);
  }

  bindEvents(): void {
    const log = this.ctx.logger.child('events');
    for (const mod of this.modules) {
      for (const binding of mod.events ?? []) {
        const wrapped = async (...args: unknown[]) => {
          try {
            await binding.handler(this.ctx, ...args);
          } catch (error) {
            log.error(`${mod.name}.${String(binding.event)} handler failed`, error);
          }
        };
        if (binding.once) this.ctx.client.once(binding.event, wrapped);
        else this.ctx.client.on(binding.event, wrapped);
      }
    }
    this.ctx.client.on('interactionCreate', (interaction) => void this.routeInteraction(interaction));
  }

  private async routeInteraction(interaction: Interaction): Promise<void> {
    const log = this.ctx.logger.child('interactions');
    if (interaction.isChatInputCommand()) {
      const command = this.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, this.ctx);
      } catch (error) {
        log.error(`/${interaction.commandName} failed`, error);
        const message = { content: 'Something went wrong running that command.', flags: MessageFlags.Ephemeral as const };
        try {
          if (interaction.deferred || interaction.replied) await interaction.followUp(message);
          else await interaction.reply(message);
        } catch {
          // interaction already expired — nothing to report to
        }
      }
    } else if (interaction.isAutocomplete()) {
      const command = this.commands.get(interaction.commandName);
      try {
        await command?.autocomplete?.(interaction, this.ctx);
      } catch (error) {
        log.error(`autocomplete for /${interaction.commandName} failed`, error);
      }
    }
  }

  async initModules(): Promise<void> {
    for (const mod of this.modules) {
      try {
        await mod.init?.(this.ctx);
        this.ctx.logger.debug(`Initialized module ${mod.name}`);
      } catch (error) {
        this.ctx.logger.error(`Module ${mod.name} init failed`, error);
      }
    }
  }
}
