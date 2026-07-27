import { Cron } from 'croner';
import type { BotContext, FeatureModule, ScheduledJob } from './types.js';

/**
 * Runs feature-declared cron jobs. Uses a real cron library (croner) with
 * timezone support and overrun protection instead of hand-rolled
 * setTimeout math — the reference bots lost scheduled posts to DST bugs
 * and redeploy-reset counters.
 */
export class Scheduler {
  private readonly crons: Cron[] = [];

  constructor(
    private readonly modules: FeatureModule[],
    private readonly ctx: BotContext,
  ) {}

  start(): void {
    const log = this.ctx.logger.child('scheduler');
    for (const mod of this.modules) {
      for (const job of mod.jobs ?? []) {
        const cron = new Cron(
          job.cron,
          { timezone: job.timezone ?? 'UTC', protect: true, name: `${mod.name}:${job.name}` },
          async () => {
            log.info(`Running job ${mod.name}:${job.name}`);
            try {
              await job.run(this.ctx);
            } catch (error) {
              log.error(`Job ${mod.name}:${job.name} failed`, error);
            }
          },
        );
        this.crons.push(cron);
        log.info(`Scheduled ${mod.name}:${job.name} (${job.cron} ${job.timezone ?? 'UTC'}), next run ${cron.nextRun()?.toISOString() ?? 'never'}`);
      }
    }
  }

  stop(): void {
    for (const cron of this.crons) cron.stop();
  }

  jobs(): ScheduledJob[] {
    return this.modules.flatMap((m) => m.jobs ?? []);
  }
}
