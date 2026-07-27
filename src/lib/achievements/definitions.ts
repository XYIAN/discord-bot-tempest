/** Stats tracked per user; achievements are conditions over these. */
export interface UserStats {
  messages: number;
  daysActive: string[]; // distinct YYYY-MM-DD dates with activity (capped)
  factsApproved: number;
  aiQuestions: number;
  joinedGuild: boolean;
}

export interface AchievementDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocked(stats: UserStats): boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-words',
    name: 'First Words',
    emoji: '💬',
    description: 'Send your first message',
    unlocked: (s) => s.messages >= 1,
  },
  {
    id: 'chatterbox',
    name: 'Chatterbox',
    emoji: '🗣️',
    description: 'Send 100 messages',
    unlocked: (s) => s.messages >= 100,
  },
  {
    id: 'storm-veteran',
    name: 'Storm Veteran',
    emoji: '🌩️',
    description: 'Send 1,000 messages',
    unlocked: (s) => s.messages >= 1000,
  },
  {
    id: 'daily-defender',
    name: 'Daily Defender',
    emoji: '📅',
    description: 'Be active 7 different days',
    unlocked: (s) => s.daysActive.length >= 7,
  },
  {
    id: 'storm-chaser',
    name: 'Storm Chaser',
    emoji: '🌀',
    description: 'Be active 30 different days',
    unlocked: (s) => s.daysActive.length >= 30,
  },
  {
    id: 'curious-mind',
    name: 'Curious Mind',
    emoji: '❓',
    description: 'Ask Tempest AI your first question',
    unlocked: (s) => s.aiQuestions >= 1,
  },
  {
    id: 'lore-keeper',
    name: 'Lore Keeper',
    emoji: '📚',
    description: 'Get a fact approved into Tempest AI',
    unlocked: (s) => s.factsApproved >= 1,
  },
  {
    id: 'sage-of-storms',
    name: 'Sage of Storms',
    emoji: '🧙',
    description: 'Get 10 facts approved into Tempest AI',
    unlocked: (s) => s.factsApproved >= 10,
  },
  {
    id: 'tempest-proven',
    name: 'Tempest Proven',
    emoji: '⚔️',
    description: 'Join the Tempest guild in game',
    unlocked: (s) => s.joinedGuild,
  },
];
