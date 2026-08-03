/**
 * Who may run which moderation action, and against whom.
 *
 * Pure and separately tested: this is the part that must never be wrong, and
 * it should be verifiable without a Discord connection. The Discord glue in
 * index.ts is thin on purpose.
 */

/** Actions in rough order of how hard they are to undo. */
export const MOD_ACTIONS = ['role', 'timeout', 'untimeout', 'kick', 'ban', 'unban'] as const;
export type ModAction = (typeof MOD_ACTIONS)[number];

/** What a caller is, from the bot's point of view. */
export interface ActorContext {
  isOwner: boolean;
  isAdmin: boolean;
  isOfficer: boolean;
}

/**
 * Officers handle day-to-day moderation; only admins and the owner can remove
 * someone from the server. Splitting it this way means a compromised officer
 * account cannot empty the guild — timeouts are reversible, bans are not.
 */
const ADMIN_ONLY: ReadonlySet<ModAction> = new Set<ModAction>(['kick', 'ban', 'unban']);

export function canRunAction(actor: ActorContext, action: ModAction): boolean {
  if (actor.isOwner || actor.isAdmin) return true;
  if (!actor.isOfficer) return false;
  return !ADMIN_ONLY.has(action);
}

export interface TargetCheckInput {
  actorId: string;
  targetId: string;
  ownerId: string;
  /** Guild owner — untouchable regardless of anyone's roles. */
  guildOwnerId: string;
  /** Highest role position held by the actor. */
  actorTopRole: number;
  /** Highest role position held by the target. */
  targetTopRole: number;
  /** Highest role position held by the bot itself. */
  botTopRole: number;
  targetIsBot: boolean;
  actorIsOwner: boolean;
}

export type TargetCheck = { ok: true } | { ok: false; reason: string };

/**
 * Whether the actor may act on this target at all.
 *
 * Discord enforces its own hierarchy server-side, but a rejection there is an
 * opaque 50013. Checking first means the moderator gets a sentence explaining
 * why, and we never attempt something that was always going to fail.
 */
export function canTargetMember(input: TargetCheckInput): TargetCheck {
  if (input.actorId === input.targetId) {
    return { ok: false, reason: "You can't moderate yourself." };
  }
  if (input.targetId === input.guildOwnerId) {
    return { ok: false, reason: "The server owner can't be moderated." };
  }
  if (input.targetId === input.ownerId) {
    return { ok: false, reason: "The bot owner can't be moderated." };
  }
  if (input.targetIsBot) {
    return { ok: false, reason: 'Use the server settings to manage bots.' };
  }
  // The bot can only act below its own highest role — this is a Discord rule,
  // not ours, and it is the most common reason an action fails.
  if (input.botTopRole <= input.targetTopRole) {
    return {
      ok: false,
      reason: "That member is above the bot in the role list, so I can't action them. Move my role higher.",
    };
  }
  // The owner is exempt from the peer check: they are expected to outrank
  // everyone, and their role position may not reflect that.
  if (!input.actorIsOwner && input.actorTopRole <= input.targetTopRole) {
    return { ok: false, reason: 'You can only moderate members below you in the role list.' };
  }
  return { ok: true };
}

/** Discord allows a timeout of at most 28 days. */
export const MAX_TIMEOUT_MINUTES = 28 * 24 * 60;

export type DurationResult = { ok: true; minutes: number } | { ok: false; reason: string };

/**
 * Parse a human duration: `30m`, `2h`, `7d`, or a bare number of minutes.
 * Rejecting bad input beats silently defaulting — a timeout that quietly
 * became one minute instead of one day is worse than an error.
 */
export function parseDuration(input: string): DurationResult {
  const trimmed = input.trim().toLowerCase();
  const match = /^(\d+)\s*(m|min|mins|minutes|h|hr|hrs|hours|d|day|days)?$/.exec(trimmed);
  if (!match) return { ok: false, reason: 'Use a duration like `30m`, `2h` or `7d`.' };
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, reason: 'Duration must be greater than zero.' };
  }
  const unit = match[2] ?? 'm';
  const multiplier = unit.startsWith('d') ? 1440 : unit.startsWith('h') ? 60 : 1;
  const minutes = value * multiplier;
  if (minutes > MAX_TIMEOUT_MINUTES) {
    return { ok: false, reason: 'Discord allows a maximum timeout of 28 days.' };
  }
  return { ok: true, minutes };
}
