import { loadConfig } from '../config/env.js';
import type { FeatureModule } from '../core/types.js';
import { achievementsFeature } from './achievements/index.js';
import { activityFeature } from './activity/index.js';
import { aiFeature } from './ai/index.js';
import { dailyResetFeature } from './daily-reset/index.js';
import { guildFeature } from './guild/index.js';
import { lobbyFeature } from './lobby/index.js';
import { opsFeature } from './ops/index.js';
import { releasesFeature } from './releases/index.js';
import { welcomeFeature } from './welcome/index.js';

/** The complete feature roster — the only place features are enumerated. */
export function allFeatures(): FeatureModule[] {
  const config = loadConfig();
  return [
    opsFeature(),
    releasesFeature(),
    welcomeFeature(),
    dailyResetFeature(),
    lobbyFeature(),
    activityFeature(),
    achievementsFeature(),
    guildFeature(),
    aiFeature(config),
  ];
}
