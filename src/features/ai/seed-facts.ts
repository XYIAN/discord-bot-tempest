import type { CATEGORIES } from './knowledge.js';

export interface SeedFact {
  /**
   * Stable, permanent identifier. Edit an entry's `text` freely — the key is
   * what ties it to the fact already in the store. NEVER reuse or renumber a
   * key: changing it orphans the old fact and files a duplicate.
   */
  key: string;
  text: string;
  category: (typeof CATEGORIES)[number];
}

/**
 * The curated base knowledge base, applied on boot (see seed.ts).
 *
 * This file is the source of truth for facts we author ourselves — it is
 * version-controlled, reviewable in a diff, and survives losing the data
 * volume. Community `/fact add` submissions and memory-sync candidates still
 * live only in the store; they are not mirrored here.
 *
 * Rules for entries:
 * - One self-contained claim per fact. The AI sees them as an unordered
 *   bulleted list grouped by category, so a fact that only makes sense next
 *   to its neighbour will get separated and misread.
 * - Single line, no markdown, under 500 characters (sanitized on load).
 * - Name the subject explicitly. "It scales with attack" is useless once the
 *   relevance filter drops the fact that said what "it" was.
 * - Numbers that a balance patch can change should say so, so the AI hedges
 *   instead of stating a stale value as gospel.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * PROVENANCE — read before adding to this file.
 *
 * These facts come from a screen-by-screen capture of the Hero Gallery on
 * Kyle's account, cross-checked by an adversarial audit pass. Two categories
 * were deliberately EXCLUDED and must stay out:
 *
 * 1. ACCOUNT STATE — hero levels, power, ATK/HP/DEF totals, which heroes or
 *    skins Kyle owns, star counts, and any skin bonus that includes a
 *    "Star Up" component. These are true of one player, not of the game.
 * 2. UNRESOLVED RULES — claims the capture could not settle, most notably
 *    what determines a skin's bonus SIZE. Three hypotheses (skin rarity,
 *    hero rarity, levelability) were each falsified by counterexamples in
 *    the data. The AI must not invent a rule here.
 *
 * Tallies were also dropped on purpose. Several counts ("confirmed on 6
 * heroes", "26 heroes, zero exceptions") disagreed across the notes, so the
 * RULE is seeded without the number. A wrong count is worse than none.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const SEED_FACTS: SeedFact[] = [
  // ── Roster shape ────────────────────────────────────────────────────────
  {
    key: 'roster-size-by-rarity',
    category: 'heroes',
    text: 'Wittle Defender heroes are grouped by rarity: Sublime (the top tier), then Mythic, Legendary, Epic and Common. As captured from the Hero Gallery there are 42 heroes total — 2 Sublime, 24 Mythic, 8 Legendary, 4 Epic and 4 Common.',
  },
  {
    key: 'roster-coverage-caveat',
    category: 'heroes',
    text: 'The hero list Tempest AI knows comes from one player\'s Hero Gallery, which is complete for Mythic and below but PARTIAL at S-tier and Sublime — more of those exist in the game than were captured. Never state or imply the hero list is exhaustive at the top rarities.',
  },
  {
    key: 'sublime-aka-xenoscape',
    category: 'heroes',
    text: 'The top hero rarity is labelled Sublime in the Hero Gallery, but players also call it Xenoscape or Sage — all three names mean the same tier.',
  },
  {
    key: 'elements-list',
    category: 'heroes',
    text: 'Wittle Defender has five hero elements: Frost (also called Ice), Fire, Electric (called Electro in skill text), Wind, and Xenoscape. Xenoscape is the element used by Sublime-tier heroes. The in-game lineup filter labels them Ice-themed, Fire, Electro, Wind and Xenoscape, so members may use either name for the same element.',
  },
  {
    key: 'element-naming-variants',
    category: 'heroes',
    text: 'Wittle Defender is inconsistent about element names: hero skill descriptions say "Electro DMG" and "Electro RES" while players often say Electric, and the game calls the Frost element "Ice-themed" in its lineup filter. Treat Electro and Electric as the same element, and Frost and Ice as the same element.',
  },
  {
    key: 'roles-list',
    category: 'heroes',
    text: 'Wittle Defender heroes have one of four roles: Fighter, Mage, Ranger or Support. The Hero Gallery can be filtered by role and by element.',
  },
  {
    key: 'title-vs-name',
    category: 'heroes',
    text: 'Every Wittle Defender hero has both a TITLE and a NAME — the title is the large text on the hero page (e.g. Monkey King, Fabled Lyra, Northern Tyrant) and the name is the subtitle beneath it (Sun Wukong, Roxy, Ulfric). The name does not change when you swap skins. Skins are a separate thing with their own names.',
  },

  // ── Skill / bubble structure ────────────────────────────────────────────
  {
    key: 'bubble-count-by-rarity',
    category: 'heroes',
    text: 'The number of skill bubbles on a hero page depends on rarity: Sublime heroes have 4 (Main Skill, Talent, Passive, Xenoscape), S-tier Mythics have 4 (Main Skill, Talent, Passive, SP Skill), plain Mythics and Legendaries have 3 (Main Skill, Talent, Passive), and Epic and Common heroes have just 1 (Main Skill).',
  },
  {
    key: 'sp-skill-is-s-tier-bonus',
    category: 'heroes',
    text: 'The SP Skill is what an S-tier Mythic gets over a plain Mythic — an entire extra skill in a 4th bubble. Sublime heroes have no SP Skill; their 4th bubble is the Xenoscape skill instead.',
  },
  {
    key: 'passive-is-team-slot',
    category: 'strategy',
    text: 'A hero\'s Passive (the 3rd bubble) is usually the most important one for team composition, because that is where team-wide effects live. Some heroes\' passives only buff themselves, so always check rather than assuming a hero contributes to the team.',
  },

  // ── Chain skills ────────────────────────────────────────────────────────
  {
    key: 'chain-skill-what-it-is',
    category: 'heroes',
    text: 'A Chain Skill is an extra bonus that only activates when a hero is deployed alongside one specific partner hero. It appears as a separate bubble beside the hero portrait, and the modal names the required partner.',
  },
  {
    key: 'chain-skill-bubble-count-rule',
    category: 'heroes',
    text: 'Whether a Wittle Defender hero has a Chain Skill is determined by bubble count: heroes with 3 bubbles (plain Mythics and Legendaries) always have one, and heroes with 4 bubbles (S-tier Mythics and Sublimes) never do — they get an SP Skill or Xenoscape skill instead. Epic and Common heroes have none.',
  },
  {
    key: 'chain-skill-tradeoff',
    category: 'strategy',
    text: 'Counter-intuitively, the strongest Wittle Defender heroes have no Chain Skill: S-tier Mythics and Sublime heroes trade the chain for a 4th skill bubble. So a chain skill is not a sign of a better hero, and comps built around chains are built around mid-tier heroes.',
  },
  {
    key: 'chain-skill-no-reciprocity-rule',
    category: 'heroes',
    text: 'Chain Skill partners are recorded per hero — hero A\'s chain bubble naming hero B does NOT guarantee B\'s chain names A. Some pairs are reciprocal and some are one-sided, so check the specific hero rather than assuming the pairing works both ways.',
  },

  // ── Star tiers and progression ──────────────────────────────────────────
  {
    key: 'star-tiers-four-levels',
    category: 'heroes',
    text: 'Wittle Defender heroes star up using hero shards for that specific character. There are four star tiers, five stars each: yellow stars, then red moons, then purple diamonds, then a final MAX star tier.',
  },
  {
    key: 'star-unlock-ladder',
    category: 'strategy',
    text: 'Within each star tier the same unlocks appear in the same order: 1 star gives an Ascend (a main-skill upgrade), 2 stars flat Stats, 3 stars a Passive level, 4 stars percent Stats, and 5 stars a Battle Assistance all-ally buff. This pattern repeats for yellow stars, red moons and purple diamonds; the MAX tier adds one final Ascend.',
  },
  {
    key: 'star-up-power-spikes',
    category: 'strategy',
    text: 'When deciding whether to star up a Wittle Defender hero, the biggest jumps are the Ascend at the first star of each tier (it changes what the main skill actually does, not just its numbers) and the Passive level partway through each tier. The Stats entries in between are small by comparison.',
  },
  {
    key: 'battle-assistance-scaling',
    category: 'strategy',
    text: 'Battle Assistance is an all-ally buff unlocked at the 5th star of a tier, and it scales sharply: all allies ATK and Max HP +3% at yellow-star tier, +8% at red-moon tier, and +15% at purple-diamond tier. A purple-diamond hero therefore contributes roughly five times the team buff of a yellow-star one. Epic and Common heroes have no Battle Assistance.',
  },
  {
    key: 'talent-stats-mythic-sublime',
    category: 'heroes',
    text: 'For Mythic and Sublime heroes the Talent Stats entries are the same for every hero: ATK+80/MaxHP+160/DEF+40 then +5% at yellow-star tier, ATK+200/MaxHP+400/DEF+100 then +12% at red-moon tier, and ATK+800/MaxHP+1600/DEF+400 then +20% at purple-diamond tier.',
  },
  {
    key: 'talent-stats-legendary-smaller',
    category: 'heroes',
    text: 'Legendary heroes use a smaller Talent Stats table than Mythic and Sublime heroes do — the same ladder shape but lower values. Epic and Common heroes have no Talent at all. So Talent Stats are NOT identical across every rarity.',
  },
  {
    key: 'talent-stats-not-level-scaled',
    category: 'heroes',
    text: 'Talent Stats values in Wittle Defender are fixed game constants, not scaled by hero level — a level 1 hero and a level 219 hero of the same rarity show identical Talent Stats entries.',
  },
  {
    key: 'ascend-widens-scope-at-high-tiers',
    category: 'strategy',
    text: 'A hero\'s four Ascend upgrades are qualitatively different, not just bigger numbers, and the purple-diamond and MAX Ascends are typically where a hero stops buffing only itself and starts buffing the whole team. That makes the higher tiers disproportionately valuable for team composition.',
  },
  {
    key: 'epic-common-no-team-value',
    category: 'strategy',
    text: 'Epic and Common heroes in Wittle Defender have a single Main Skill and nothing else — no Talent, no Passive, no Chain Skill, no skins and no star tiers. Their tiles read "Max Star: Reached" permanently, which is the tier\'s normal state and not an achievement. They contribute nothing to the team beyond their own attack.',
  },

  // ── Passives / auras ────────────────────────────────────────────────────
  {
    key: 'aura-passive-curve-varies',
    category: 'heroes',
    text: 'Many Wittle Defender team-buff passives scale 4% / 12% / 27% across their three levels, but this is a common curve rather than a rule — other passives use 10/20/30, 5/15/30 or 10/20/50. Always check the specific hero\'s passive rather than assuming the 4/12/27 numbers.',
  },

  // ── Skins ───────────────────────────────────────────────────────────────
  {
    key: 'skins-are-not-cosmetic',
    category: 'gear',
    text: 'Skins in Wittle Defender are not cosmetic. Every unlockable skin grants an account-wide bonus to ALL deployed heroes, not just the hero wearing it, and some skins carry a skill on top. Never describe skins as purely visual.',
  },
  {
    key: 'default-skins-no-bonus',
    category: 'gear',
    text: 'A hero\'s Default skin carries no bonus at all — it has no rarity chip and no bonus line. Only unlocked non-default skins grant the account-wide ATK/HP/DEF bonus.',
  },
  {
    key: 'skin-bonus-not-predictable',
    category: 'gear',
    text: 'The SIZE of a skin\'s bonus is authored per skin and cannot be predicted from the skin\'s rarity, the hero\'s rarity, or whether the skin can level up. The same hero can carry two Legendary skins with different bonuses, so always check the specific skin rather than inferring from rarity.',
  },
  {
    key: 'skin-bonus-extra-stat',
    category: 'gear',
    text: 'A skin bonus is usually ATK%, HP% and DEF% to all deployed heroes, but some skins add a fourth stat such as Healing Bonus, Skill CD reduction, an elemental damage bonus or a role damage bonus. Do not assume the bonus is always the ATK/HP/DEF trio.',
  },
  {
    key: 'skin-levelable-test',
    category: 'gear',
    text: 'A Wittle Defender skin can be levelled up (using duplicates of that skin) if its page shows "Star Up to change skin appearance" or a "(Star Up bonus +X%)" suffix on its bonus. If neither appears, the skin is fixed and its bonus is a constant. A skin having a skill icon does NOT mean it can be levelled.',
  },
  {
    key: 'skin-bonus-star-up-is-account-state',
    category: 'gear',
    text: 'The bonus shown on a levelable skin includes whatever Star Up levels that player has already earned, so it reflects their account rather than a fixed game value. Only the bonus on a non-levelable skin is a constant that applies to everyone.',
  },
  {
    key: 'skin-skill-level-template',
    category: 'gear',
    text: 'A levelable skin skill has up to 10 levels, gated by gold diamonds for levels 1-5 then red diamonds for 6-10. Levels 2, 4, 6, 7 and 9 give a flat team-wide ATK/DEF/HP bonus, while levels 1, 3, 5, 8 and 10 give hero-specific effects. Not every skin skill has 10 levels — some have fewer and some have none.',
  },
  {
    key: 'skin-chip-vocabulary',
    category: 'gear',
    text: 'On a Wittle Defender skin page: a "Default" chip means the skin grants no bonus; "Unlock Skill after Obtaining Skin" means the skin\'s skill is gated behind obtaining it; and greyed-out silhouettes in the carousel are unreleased skins that cannot be obtained yet.',
  },
  {
    key: 'argent-skin-line',
    category: 'gear',
    text: 'Argent skins (named "Argent" plus the hero\'s title) are a recurring line on Mythic and Sublime heroes. They carry a Mythic rarity chip, grant +1% ATK/HP/DEF to all deployed heroes, are bought from the Event Market exchange rather than a limited event, and their skill is "Silver Oath", which makes that hero\'s Chain Skill active by default. Not every hero has one.',
  },
  {
    key: 'skin-sources',
    category: 'economy',
    text: 'Skins in Wittle Defender come from seasonal Gala and themed events (for example Spring Festival Gala, Mid-Autumn Gala, Frost Festival) and from the Event Market exchange. Event Market skins are the reliably obtainable ones since they are not limited to an event window.',
  },

  // ── Summons ─────────────────────────────────────────────────────────────
  {
    key: 'summon-types',
    category: 'economy',
    text: 'Wittle Defender has two summon types: rate-up summons, aimed at Mythics, where you pick a specific hero to get elevated rates while everyone else keeps normal rates; and normal summons, which use normal scrolls and can produce any hero including rare Mythics.',
  },
  {
    key: 's-tier-is-above-mythic',
    category: 'heroes',
    text: 'Some Mythic heroes carry an "S" badge, marking them a step above a normal Mythic. Normal Mythics unlock through regular play, while S-tier ones take substantially longer to obtain and are the heroes that get a 4th skill bubble (an SP Skill).',
  },

  // ── Per-hero facts (extracted from the Hero Gallery capture, adversarially verified) ──
  {
    key: 'epic-common-tier-structure',
    category: 'heroes',
    text: 'Epic and Common heroes in Wittle Defender have a single skill bubble — their Main Skill — and nothing else: no Talent ladder, no Passive, no Chain Skill, no SP/Xenoscape skill, and no skins. Neither tier has a star system, so Epic and Common heroes have no star progression to invest in.',
  },
  {
    key: 'epic-tier-main-skill-style',
    category: 'heroes',
    text: 'Epic main skills read as the plain version of a higher-rarity skill: one clause, one verb, no numbers, no bracketed [Buff] terms and no scaling (Arrow "fires deadly arrows", Ice Arrow "fires piercing ice arrows", Ball Lightning "releases homing lightning orbs"). The tier gap is visible in the skill text itself.',
  },
  {
    key: 'epic-common-tier-team-value',
    category: 'strategy',
    text: 'Because Epic and Common heroes have no passive, no chain skill and no talent, they bring nothing to a team beyond their own body and one attack — no team buff and no chain partner. Treat them as filler when building a comp and lean on Legendary or higher for anything team-facing.',
  },
  {
    key: 'hero-archon-armor-identity',
    category: 'heroes',
    text: 'Archon Armor (character name Aegis) is a Mythic Electric-element Support hero; it is an animated suit of armour with no gender, so refer to it as "it" or by the name Aegis.',
  },
  {
    key: 'hero-archon-armor-main-skill',
    category: 'heroes',
    text: 'Archon Armor\'s Main Skill, Thunder Afterimage, releases electric current to attack enemies and summons an Afterimage that protects allies and launches a Bouncing Electric Orb at enemies.',
  },
  {
    key: 'hero-archon-armor-ascend-early',
    category: 'heroes',
    text: 'Archon Armor\'s first two Ascend upgrades: at 1 star, team DMG Reduction increases by 12% while it is deployed; at 2 stars, when any ally who is below 90% HP takes damage they gain 4s of Invincibility, triggering at most once every 30s.',
  },
  {
    key: 'hero-archon-armor-ascend-late',
    category: 'heroes',
    text: 'Archon Armor\'s last two Ascend upgrades: at 3 stars, allies also gain a 50% DMG increase for the duration of the Invincibility it grants; at the max tier, both the Invincibility and that DMG increase extend to 6s.',
  },
  {
    key: 'hero-archon-armor-passive',
    category: 'heroes',
    text: 'Archon Armor\'s passive Voltaic Field increases Team CRIT DMG by 20% at Lv.1, 40% at Lv.2 and 60% at Lv.3, active whenever it is deployed.',
  },
  {
    key: 'hero-archon-armor-chain',
    category: 'heroes',
    text: 'Archon Armor\'s Chain Skill, Afterimage Tempest, requires both Archon Armor and God Ruler deployed: when the Afterimage ends it triggers an extra electric explosion.',
  },
  {
    key: 'hero-archon-armor-synergy',
    category: 'strategy',
    text: 'Archon Armor is a pure team-support anchor with no personal damage ambition: up to +60% team CRIT DMG, +12% team DMG Reduction, and an ally Invincibility window that also becomes a +50% DMG window. It stacks with other CRIT DMG buffers such as Fabled Lyra and Panda Brewmaster, and fits Electric comps with Levin Archangel, Valkyrie and God Ruler (also its chain partner).',
  },
  {
    key: 'hero-archon-armor-skins',
    category: 'gear',
    text: 'Archon Armor\'s non-levelable skins: Thunder Will (Legendary, obtained from the Flash Overture event) grants all deployed heroes +1% ATK, HP and DEF, and Argent Archon Armor (Mythic, obtained from Event Market exchange) also grants +1% each and unlocks its skill once the skin is obtained. Its Default skin carries no bonus at all.',
  },
  {
    key: 'hero-blazing-archer-identity',
    category: 'heroes',
    text: 'Blazing Archer (character name Parody) is a Mythic Fire-element Ranger, depicted as a male-presenting horned lava-demon archer. The game\'s own skill text never uses gendered pronouns for him, so treat the presentation as art rather than a stated gender.',
  },
  {
    key: 'hero-blazing-archer-main-skill',
    category: 'heroes',
    text: 'Blazing Archer\'s Main Skill, Flame Arrow, shoots flaming arrows and periodically enters a frenzy that greatly increases his shooting speed.',
  },
  {
    key: 'hero-blazing-archer-ascend-early',
    category: 'heroes',
    text: 'Blazing Archer\'s first two Ascend upgrades: at 1 star, the arrows of a servant called Pyro Servant are enchanted with fire and both his own damage and the servant\'s damage greatly increase - Pyro Servant is named only in this Ascend and is described nowhere else in his kit; at 2 stars, his base fire rate increases.',
  },
  {
    key: 'hero-blazing-archer-ascend-late',
    category: 'heroes',
    text: 'Blazing Archer\'s last two Ascend upgrades: at 3 stars his base fire rate increases further, and at the max tier his CRIT Rate greatly increases. His Ascend line adds no new mechanics and no team effects - fire rate twice, then CRIT Rate.',
  },
  {
    key: 'hero-blazing-archer-passive',
    category: 'heroes',
    text: 'Blazing Archer\'s passive Crit Power Aura increases Team CRIT DMG by 10% at Lv.1, 20% at Lv.2 and 50% at Lv.3, active while he is deployed.',
  },
  {
    key: 'hero-blazing-archer-chain',
    category: 'heroes',
    text: 'Blazing Archer\'s Chain Skill, Burning Ground, requires both Blazing Archer and Demon Spawn deployed: Flame Blade and Flame Arrow hits ignite Burning Ground, dealing massive damage.',
  },
  {
    // A new member asked for exactly this: "all the heroes have too many names
    // and people use two letter abbreviations that I don't really understand".
    // The bot had no abbreviation data and guessed — it read "SW" as Swordmaster
    // when the member meant Starlight Weaver, then called Swordmaster a Xeno
    // hero, because Starlight Weaver IS Xenoscape and Swordmaster is Wind.
    key: 'hero-abbreviations',
    text: 'Members abbreviate hero names to their initials. Unambiguous ones: AA = Archon Armor; BA = Blazing Archer; CA = Cat Assassin; DE = Draconic Empress; DH = Demon Hunter; DS = Demon Spawn; EI = Elemental Invoker; ER = Elf Ranger; FM = Fire Mage; FV = Fiery Vanguard; FW = Fire Witch; GR = God Ruler; ID = Ice Demon; IM = Ice Mage; IQ = Ice Queen; IW = Ice Witch; IWP = Ice Wolf Pup; LA = Levin Archangel; MK = Monkey King; NB = Night Baron; NP = Novice Priest; NT = Northern Tyrant; PB = Panda Brewmaster; PC = Polar Captain; PD = Phoenix Dancer; RFM = Rogue Fire Mage; SR = Scarlet Reaper; SS = Sword Saint; SW = Starlight Weaver; TP = Thunder Pharaoh; UL = Unyielding Lancer; VW = Void Witch; WR = Windborne Ranger. Note SW is Starlight Weaver, NOT Swordmaster - Swordmaster is one word so it does not abbreviate to two letters. High Priest is deliberately NOT abbreviated: HP means hit points in this game, so treat HP as the stat and expect his full name.',
    category: 'general',
  },
  {
    key: 'hero-abbreviations-ambiguous',
    text: 'Three hero abbreviations are ambiguous and must never be guessed: FA could be Fire Apprentice or Frost Archer; FL could be Fabled Lyra or Frost Lich; a bare S could be Swordmaster or Seraph. If a member uses one of these, or any abbreviation not on the known list, ask which hero they mean before answering. Guessing an abbreviation is how a wrong hero - with the wrong element and the wrong role - gets built into a whole team recommendation.',
    category: 'general',
  },
  {
    // From Kyle (guild owner). Cross-checked against the three heroes' own
    // facts: Polar Captain GENERATES summons (Tide tentacles, plus up to 3
    // giant tentacles from Soul Pact on ally deaths) while Tyrant and Lich both
    // MULTIPLY summon output. That is why the trio compounds rather than merely
    // stacking, and the two of them even share a chain skill.
    key: 'strategy-ice-summon-core',
    text: 'The strongest Ice core is Northern Tyrant + Polar Captain + Frost Lich, widely considered one of the best combos in the whole game. Polar Captain is the main damage dealer of the three: his Tide summons tentacles and his Soul Pact turns allied deaths into up to 3 giant tentacles. The other two multiply that output rather than adding their own - Northern Tyrant\'s Wolf Fury gives the team +4% DMG per allied summoned unit (up to +36%) and his Bitter Frigidity gives every allied summon a 5x-damage proc chance, while Frost Lich\'s Necrotic Fury raises allied summon DMG by up to +45%. Because Polar Captain produces summons and both partners scale off allied summons, the three compound instead of just stacking. Frost Lich and Polar Captain also share the Freezing Exhale chain skill.',
    category: 'strategy',
  },
  {
    key: 'strategy-ice-summon-flex-slots',
    text: 'The Ice summon core (Northern Tyrant, Polar Captain, Frost Lich) leaves two flex slots, and the usual answer is a healer plus a CRIT booster. Most players pick a CRIT DMG booster over CRIT Rate, because the CRIT DMG heroes tend to double as damage and support - Panda Brewmaster is the standard example, giving Team CRIT DMG +25/50/75%, +15% team HP and a team Dodge window all at once. A healer is wanted because Polar Captain\'s Soul Pact pays off when allies die, but a team that is actually dying is losing the summons that Wolf Fury and Necrotic Fury scale off.',
    category: 'strategy',
  },
  {
    // Checking a hero's element meant consulting 45 separate identity facts, so
    // the bot didn't reliably do it — it listed Seraph (Electric) under a "Fire
    // Team" heading for a beginner, unflagged. This makes the check one lookup.
    key: 'roster-by-element',
    text: 'Every hero grouped by element, for checking an element team at a glance. FIRE (11): Blazing Archer, Cheffy, Demon Spawn, Draconic Empress, Fiery Vanguard, Fire Apprentice, Fire Mage, Fire Witch, Phoenix Dancer, Rogue Fire Mage, Scarlet Reaper. WIND (10): Cat Assassin, Demon Hunter, Elf Ranger, Fabled Lyra, Night Baron, Panda Brewmaster, Sword Saint, Swordmaster, Unyielding Lancer, Windborne Ranger. ICE/FROST (9): Frost Archer, Frost Lich, Ice Demon, Ice Mage, Ice Queen, Ice Witch, Ice Wolf Pup, Northern Tyrant, Polar Captain. ELECTRIC (10): Archon Armor, Frankenstein, God Ruler, High Priest, Levin Archangel, Novice Priest, Robot, Seraph, Thunder Pharaoh, Valkyrie. XENOSCAPE (5): Elemental Invoker, Monkey King, Peacekeeper, Starlight Weaver, Void Witch. Check this list before naming heroes in an element team - Seraph and Cheffy are the two most often misfiled, Seraph being Electric and Cheffy Fire despite both being healers.',
    category: 'heroes',
  },
  {
    // The bot listed Blazing Archer and Cheffy, both FIRE heroes, in a WIND
    // team; a member had to catch it. Every hero's element is recorded, so this
    // was a discipline failure rather than a data gap.
    key: 'strategy-element-team-discipline',
    text: 'When asked for an element team (a Wind team, a Fire team and so on), every hero named must actually BE that element - check each hero\'s identity fact before listing them. A hero whose kit buffs an element is not necessarily of that element: Blazing Archer buffs team CRIT DMG and is Fire, Cheffy heals and is Fire, so neither belongs in a Wind team. If an off-element hero is worth including anyway, say plainly that they are off-element and why they still earn the slot.',
    category: 'strategy',
  },
  {
    // Kyle (guild owner) reported the bot calling Blazing Archer "your main
    // damage dealer". Retrieval was fixed and it still said so, because the
    // facts describe his MECHANICS and left the role conclusion to the model.
    // This states the conclusion the mechanics already support.
    key: 'role-reading-a-heros-job',
    text: 'How to read a hero\'s job from their kit, when no fact states a role outright: a passive or aura that buffs the TEAM is support value, and it applies whether or not that hero is dealing the damage. An Ascend line that only raises the hero\'s own numbers is personal scaling. A hero whose team contribution is an aura and whose Ascends are personal-only is an ENABLER — his job is multiplying the damage dealers around him, not being the damage. Never call a hero the main damage dealer just because his kit mentions damage, CRIT or attack speed; almost every hero in this game has those.',
    category: 'strategy',
  },
  {
    key: 'hero-blazing-archer-role',
    text: 'Blazing Archer is a crit ENABLER, not the main damage dealer. His whole team contribution is Crit Power Aura (Team CRIT DMG up to +50%), and his Ascend line explicitly adds no new mechanics and no team effects - just his own fire rate twice and then his own CRIT Rate. Build the team so a real damage dealer benefits from his +50% Team CRIT DMG, and pair him with a CRIT Rate source such as Sword Saint, since rate and damage multiply. Confirmed by the guild owner after the bot repeatedly described him as a main DPS.',
    category: 'heroes',
  },
  {
    key: 'hero-blazing-archer-synergy',
    category: 'strategy',
    text: 'Blazing Archer is the CRIT DMG half of a crit comp - his passive gives the team up to +50% CRIT DMG and his max Ascend raises his own CRIT Rate. Pair him with Sword Saint, who buffs team CRIT Rate, because rate and damage multiply; he also stacks with the CRIT DMG from Fabled Lyra and Panda Brewmaster.',
  },
  {
    key: 'hero-blazing-archer-skins',
    category: 'gear',
    text: 'Blazing Archer\'s bonus-carrying skin is Argent Blazing Archer (Mythic, obtained from Event Market exchange): it grants all deployed heroes +1% ATK, HP and DEF and carries the skin skill Silver Oath, which makes Blazing Archer\'s Chain Skill active by default. His Default skin carries no bonus.',
  },
  {
    key: 'hero-cat-assassin-identity',
    category: 'heroes',
    text: 'Cat Assassin (in-game name Viora) is a Legendary-rarity hero in Wittle Defender: Wind element, Ranger role, female, in a purple cat-eared hood and red scarf with a dagger.',
  },
  {
    key: 'hero-cat-assassin-main-skill',
    category: 'heroes',
    text: 'Cat Assassin\'s Main Skill, Dart, throws darts at the nearest enemies.',
  },
  {
    key: 'hero-cat-assassin-ascend',
    category: 'heroes',
    text: 'Cat Assassin\'s four Dart Ascend upgrades are: Star - darts return after being thrown; Moon - Dart Count +1; Diamond - Dart Count +1 again; Max - Dart Final DMG +20% with enhanced knockback.',
  },
  {
    key: 'hero-cat-assassin-assistance',
    category: 'heroes',
    text: 'Cat Assassin\'s Talent ladder grants Battle Assistance while she is deployed: all allies gain ATK +3% and Max HP +3% at 5 stars, +8% at 5 moons, and +15% at 5 diamonds.',
  },
  {
    key: 'hero-cat-assassin-passive',
    category: 'heroes',
    text: 'Cat Assassin\'s passive Wind Break Aura is a debuff rather than a buff: it reduces enemy Wind RES by 4% at Lv.1, 12% at Lv.2 and 27% at Lv.3 while she is deployed.',
  },
  {
    key: 'hero-cat-assassin-chain',
    category: 'heroes',
    text: 'Cat Assassin\'s Chain Skill, Scatter Shot, requires Cat Assassin and Demon Hunter both deployed: hits from Musket Burst and Dart trigger Scatter Shot, which attacks random enemies.',
  },
  {
    key: 'hero-cat-assassin-synergy',
    category: 'strategy',
    text: 'Cat Assassin and Demon Hunter are a self-contained Wind package built to run together: a reciprocal Scatter Shot chain, both Wind Rangers, and auras that multiply each other - Cat Assassin strips up to 27% enemy Wind RES while Demon Hunter adds up to 27% team Wind DMG. The pair amplifies a whole Wind comp for Legendary shard cost.',
  },
  {
    key: 'hero-cat-assassin-skins',
    category: 'gear',
    text: 'Cat Assassin has no skins - her hero page has no Skin button at all.',
  },
  {
    key: 'hero-cheffy-identity',
    category: 'heroes',
    text: 'Cheffy (character name Aromi) is a Mythic Fire-element Support hero, female.',
  },
  {
    key: 'hero-cheffy-main-skill',
    category: 'heroes',
    text: 'Cheffy\'s Main Skill, Bunzooka, throws the Bunzooka to heal all allies every 5s.',
  },
  {
    key: 'hero-cheffy-ascend',
    category: 'heroes',
    text: 'Cheffy\'s Ascend upgrades: the 1-star and 3-star tiers both simply increase Bunzooka damage and healing; the 2-star tier increases Bunzooka damage and adds a 5% team DMG boost for 3s; the max tier increases Bunzooka damage again and raises that team DMG boost to 10%.',
  },
  {
    key: 'hero-cheffy-passive',
    category: 'heroes',
    text: 'Cheffy\'s passive Umami Embrace increases her own healing by 20% at Lv.1, 40% at Lv.2 and 70% at Lv.3.',
  },
  {
    key: 'hero-cheffy-chain',
    category: 'heroes',
    text: 'Cheffy\'s Chain Skill, Flavor Symphony, requires both Cheffy and Fiery Vanguard deployed: the Bunzooka ignites Burning Ground where it lands.',
  },
  {
    key: 'hero-cheffy-synergy',
    category: 'strategy',
    text: 'Cheffy is a dedicated healer: her main skill is a repeating team heal every 5s, scaled up to +70% by her passive. She is a natural partner for Scarlet Reaper, whose kit switches on above 50% HP, and for Fire comps with Phoenix Dancer and Draconic Empress - and her chain partner Fiery Vanguard anchors that same Fire package.',
  },
  {
    key: 'hero-cheffy-skins',
    category: 'gear',
    text: 'Cheffy\'s non-levelable skins: Kitchen Whiz (Legendary) grants all deployed heroes +1% ATK, HP and DEF; Sweet Malice (Legendary, from the Halloween Marvels event) grants +2% each; Argent Cheffy (Mythic, from Event Market exchange) grants +1% each and unlocks its skill once the skin is obtained. Her Default skin carries no bonus.',
  },
  {
    key: 'hero-demon-spawn-identity',
    category: 'heroes',
    text: 'Demon Spawn (character name Zain) is a Mythic Fire-element Fighter, a male horned imp swordsman in a red cape.',
  },
  {
    key: 'hero-demon-spawn-main-skill',
    category: 'heroes',
    text: 'Demon Spawn\'s Main Skill, Flame Blade, slashes enemies with waves of fire.',
  },
  {
    key: 'hero-demon-spawn-ascend-early',
    category: 'heroes',
    text: 'Demon Spawn\'s first two Ascend upgrades: at 1 star, a skill called Hell Slash releases a large number of Flame Blades and Flame Blade kills restore his own health - Hell Slash is named only in his Ascend text and is described nowhere else in his kit; at 2 stars, Flame Blade Penetration increases by 1.',
  },
  {
    key: 'hero-demon-spawn-ascend-late',
    category: 'heroes',
    text: 'Demon Spawn\'s last two Ascend upgrades: at 3 stars, Flame Blade Penetration increases by 1 again (word-for-word the same as his 2-star Ascend); at the max tier, Hell Slash releases even more Flame Blades. His ladder is effectively two upgrades bought twice each rather than four distinct ones.',
  },
  {
    key: 'hero-demon-spawn-passive',
    category: 'heroes',
    text: 'Demon Spawn\'s passive Demonic Rage increases his OWN ATK by 12% at Lv.1, 25% at Lv.2 and 50% at Lv.3, but only while he is below 50% HP - it gives the team nothing.',
  },
  {
    key: 'hero-demon-spawn-chain',
    category: 'heroes',
    text: 'Demon Spawn\'s Chain Skill, Burning Ground, requires both Demon Spawn and Blazing Archer deployed: Flame Blade and Flame Arrow hits ignite Burning Ground, dealing massive damage.',
  },
  {
    key: 'hero-demon-hunter-identity',
    category: 'heroes',
    text: 'Demon Hunter (in-game name Charina) is a Legendary-rarity hero in Wittle Defender: Wind element, Ranger role, female, fighting with an oversized musket.',
  },
  {
    key: 'hero-demon-hunter-main-skill',
    category: 'heroes',
    text: 'Demon Hunter\'s Main Skill, Musket Burst, fires a barrage of projectiles at the nearest enemy.',
  },
  {
    key: 'hero-demon-hunter-ascend',
    category: 'heroes',
    text: 'Demon Hunter\'s four Musket Burst Ascend upgrades are: Star - Projectile bounce +1; Moon - Projectile explosion AoE +100%; Diamond - Projectile bounce +1 again; Max - Explosion DMG +100%. Her ladder buys only two mechanics, bounce count and explosion, twice each.',
  },
  {
    key: 'hero-demon-hunter-assistance',
    category: 'heroes',
    text: 'Demon Hunter\'s Talent ladder grants Battle Assistance while she is deployed: all allies gain ATK +3% and Max HP +3% at 5 stars, +8% at 5 moons, and +15% at 5 diamonds.',
  },
  {
    key: 'hero-demon-hunter-passive',
    category: 'heroes',
    text: 'Demon Hunter\'s passive Tempest Fury Aura increases Team Wind DMG by 4% at Lv.1, 12% at Lv.2 and 27% at Lv.3, active while she is deployed.',
  },
  {
    key: 'hero-demon-hunter-chain',
    category: 'heroes',
    text: 'Demon Hunter\'s Chain Skill, Scatter Shot, requires Demon Hunter and Cat Assassin both deployed: hits from Musket Burst and Dart trigger Scatter Shot, which attacks random enemies.',
  },
  {
    key: 'hero-demon-spawn-synergy',
    category: 'strategy',
    text: 'Demon Spawn is a low-HP berserker with zero team buffs, so his real value is chain enabling: he is half of Burning Ground with Blazing Archer and is also the partner named by Fiery Vanguard\'s Focused Fireball, so deploying him can switch on two chains at once. Run him alongside a healer or a Dodge window to keep him alive inside his sub-50% HP damage band.',
  },
  {
    key: 'hero-demon-hunter-synergy',
    category: 'strategy',
    text: 'Demon Hunter is a budget Wind amplifier: her personal kit is pure single-target projectile damage with no utility, but Tempest Fury Aura hands the team up to +27% Wind DMG for Legendary shard cost. Run her in a Wind comp beside heroes like Panda Brewmaster, Windborne Ranger, Swordmaster and Fabled Lyra.',
  },
  {
    key: 'hero-demon-spawn-skins',
    category: 'gear',
    text: 'Demon Spawn\'s bonus-carrying skin is Argent Demon Spawn (Mythic, obtained from Event Market exchange): it grants all deployed heroes +1% ATK, HP and DEF and carries the skin skill Silver Oath, which makes Demon Spawn\'s Chain Skill active by default. His Default skin carries no bonus.',
  },
  {
    key: 'hero-demon-hunter-skins',
    category: 'gear',
    text: 'Demon Hunter has no skins - her hero page has no Skin button at all.',
  },
  {
    key: 'hero-draconic-empress-identity',
    category: 'heroes',
    text: 'Draconic Empress (name: Drakaina) is a female Mythic hero carrying the S-tier grade badge, with the Fire element and the Mage role.',
  },
  {
    key: 'hero-draconic-empress-main-skill',
    category: 'heroes',
    text: 'Draconic Empress\'s Main Skill, Empress\'s Decree, summons an Inferno Wyrmling that flies toward the target and sprays flames along the way, dealing AoE damage.',
  },
  {
    key: 'hero-draconic-empress-ascend-1-2',
    category: 'heroes',
    text: 'Draconic Empress Ascend tiers 1-2: the star Ascend gives [Empress\'s Decree] +120% DMG and increases the AoE of the dragon it summons; the moon Ascend gives [Empress\'s Decree] +25% Skill CD SPD.',
  },
  {
    key: 'hero-draconic-empress-ascend-3-4',
    category: 'heroes',
    text: 'Draconic Empress Ascend tiers 3-4: the diamond Ascend makes [Empress\'s Decree] summon 2 Wyrmlings per cast (each slightly weaker) and raises the stack limit to 2 for the Gold Wyrmling and Onyx Wyrmling effects, which are named only in this Ascend and described nowhere else in her kit; the final Ascend adds +60% DMG, gives all Fire allies +40% EX-Weapon DMG, and grants 30 EX-Weapon Energy instantly on entering PvP battle.',
  },
  {
    key: 'hero-draconic-empress-passive',
    category: 'heroes',
    text: 'Draconic Empress\'s Passive, Everflame, is self-focused: every second it ignites the enemy with the highest ATK for damage over time and drains 3 EX-Weapon Energy. Lv.2 and Lv.3 each add +100% ignite damage and raise the drain to 6 then 10 Energy.',
  },
  {
    key: 'hero-draconic-empress-sp-skill',
    category: 'heroes',
    text: 'Draconic Empress\'s SP Skill, Dragon Commander, gives her +50% own Final DMG REDUC and +10% own Final DMG Bonus while any ally is alive.',
  },
  {
    key: 'hero-draconic-empress-chain',
    category: 'heroes',
    text: 'Draconic Empress has no Chain Skill.',
  },
  {
    key: 'hero-draconic-empress-synergy',
    category: 'strategy',
    text: 'Draconic Empress fits a Fire-element, EX-Weapon-focused team: her final Ascend grants all Fire allies +40% EX-Weapon DMG and hands her 30 EX-Weapon Energy the moment a PvP battle starts, while her Everflame passive drains the enemy\'s EX-Weapon Energy.',
  },
  {
    key: 'hero-draconic-empress-skins',
    category: 'gear',
    text: 'Draconic Empress skins with fixed bonuses: Pale Wyrmkin [Legendary] gives all deployed heroes +1% ATK/HP/DEF and comes from the [Illusory Enigma] event; Argent Draconic Empress [Mythic] gives +1% ATK/HP/DEF, unlocks a skill on obtaining, and is bought from the Event Market exchange. Her default skin carries no bonus at all.',
  },
  {
    key: 'hero-elf-ranger-identity',
    category: 'heroes',
    text: 'Elf Ranger (in-game name "Windaro") is an Epic-rarity Wind-element Ranger, a male blond elf with pointed ears, a green tunic and a wooden bow. As an Epic he has no star tier.',
  },
  {
    key: 'hero-elf-ranger-main-skill',
    category: 'heroes',
    text: 'Elf Ranger\'s Main Skill, Arrow, fires deadly arrows at the nearest enemy. It is his only skill — Epic heroes have nothing beyond the Main Skill.',
  },
  {
    key: 'hero-fabled-lyra-identity',
    category: 'heroes',
    text: 'Fabled Lyra (character name Roxy) is a Mythic Wind-element Support hero, female. "Roxy" is her character name, not a skin - it stays on the sub-line for every skin in her carousel.',
  },
  {
    key: 'hero-fabled-lyra-main-skill',
    category: 'heroes',
    text: 'Fabled Lyra\'s Main Skill, Tune, summons Tunes that attack enemies and bounce on contact.',
  },
  {
    key: 'hero-fabled-lyra-ascend-early',
    category: 'heroes',
    text: 'Fabled Lyra\'s first two Ascend upgrades: at 1 star, Tune DMG increases and an effect called Stirring Overture adds a further +20% team CRIT DMG on top of her Sonata passive (Stirring Overture is named only in her Ascend text and is described nowhere else in her kit); at 2 stars, Tune DMG increases and the team gains a 10% DMG Bonus while she is on the field.',
  },
  {
    key: 'hero-fabled-lyra-ascend-late',
    category: 'heroes',
    text: 'Fabled Lyra\'s last two Ascend upgrades: at 3 stars, Tune DMG increases and Stirring Overture\'s team CRIT DMG boost rises to 40%; at the max tier, Tune DMG increases and the team gains a 15% Wind DMG Bonus while she is on the field.',
  },
  {
    key: 'hero-fabled-lyra-passive',
    category: 'heroes',
    text: 'Fabled Lyra\'s passive Sonata increases Team CRIT DMG by 20% at Lv.1, adds Team DMG +10% at Lv.2, and adds Team Wind DMG +15% at Lv.3.',
  },
  {
    key: 'hero-fabled-lyra-chain',
    category: 'heroes',
    text: 'Fabled Lyra\'s Chain Skill, Blade & Ballad, requires both Fabled Lyra and Sword Saint deployed: her Tunes grant the team an 8% Dodge bonus for 5s.',
  },
  {
    key: 'hero-fabled-lyra-synergy',
    category: 'strategy',
    text: 'Fabled Lyra is a team-buff Support whose entire Ascend line is team-facing (team CRIT DMG +20%, then team DMG +10%, then CRIT DMG to 40%, then team Wind DMG +15%), matching her passive. Slot her into crit-damage comps and especially Wind comps, where her buffs multiply everyone else\'s output rather than her own.',
  },
  {
    key: 'hero-fabled-lyra-skins',
    category: 'gear',
    text: 'Fabled Lyra\'s non-levelable skins: Futuristic Sound (Legendary, from the Melodic Invitation event) grants all deployed heroes +1% ATK, HP and DEF; Stellar Aria (Legendary, from the Mid-Autumn Gala event) grants +2% each; Argent Fabled Lyra (Mythic, from Event Market exchange) grants +1% each plus the Silver Oath skill, making her Chain Skill active by default. Her Default skin carries no bonus.',
  },
  {
    key: 'hero-fiery-vanguard-identity',
    category: 'heroes',
    text: 'Fiery Vanguard (character name Kilonek) is a Mythic Fire-element Support hero, male.',
  },
  {
    key: 'hero-fiery-vanguard-main-skill',
    category: 'heroes',
    text: 'Fiery Vanguard\'s Main Skill, Firestream, fires a compressed stream of flame in a straight line.',
  },
  {
    key: 'hero-fiery-vanguard-ascend-early',
    category: 'heroes',
    text: 'Fiery Vanguard\'s first two Ascend upgrades: at 1 star, Firestream gains movement speed and damage and an effect called Scorching Harbinger provides an additional 10% Fire DMG aura; at 2 stars, Firestream damage increases and an effect called Thermal Diffusion increases to 15%. Neither Scorching Harbinger nor Thermal Diffusion is described anywhere else in his skill text.',
  },
  {
    key: 'hero-fiery-vanguard-ascend-late',
    category: 'heroes',
    text: 'Fiery Vanguard\'s last two Ascend upgrades: at 3 stars, Firestream damage increases and his Fire DMG aura increases to 20%; at the max tier, Firestream damage increases and Thermal Diffusion increases to 25%. His odd tiers scale the Fire DMG aura and his even tiers scale Thermal Diffusion - an effect the game never describes anywhere else in his skill text, so what it does is not known.',
  },
  {
    key: 'hero-fiery-vanguard-passive',
    category: 'heroes',
    text: 'Fiery Vanguard\'s passive Blaze Fury Aura increases Team Fire DMG by 4% at Lv.1, 12% at Lv.2 and 27% at Lv.3, active while he is deployed.',
  },
  {
    key: 'hero-fiery-vanguard-chain',
    category: 'heroes',
    text: 'Fiery Vanguard\'s Chain Skill, Focused Fireball, requires both Fiery Vanguard and Demon Spawn deployed: Firestream emits Focused Fireballs.',
  },
  {
    key: 'hero-fiery-vanguard-synergy',
    category: 'strategy',
    text: 'Fiery Vanguard is the hinge of a Fire comp: both Cheffy\'s and Scarlet Reaper\'s Chain Skills name him as the required partner, his passive gives the team up to +27% Fire DMG, and his Ascend line adds a second Fire DMG aura worth up to 20%. Stack him with Cheffy, Scarlet Reaper, Phoenix Dancer and Draconic Empress.',
  },
  {
    key: 'hero-fiery-vanguard-skins',
    category: 'gear',
    text: 'Fiery Vanguard\'s non-levelable skins: Ashen Vanguard (Legendary, from the Molten Nexus event) grants all deployed heroes +1% ATK, HP and DEF; Purgatory Fire (Legendary, from the Mid-Autumn Gala event) grants +2% each; Argent Fiery Vanguard (Mythic, from Event Market exchange) grants +1% each and unlocks its skill once obtained. His Default skin carries no bonus.',
  },
  {
    key: 'hero-fire-mage-identity',
    category: 'heroes',
    text: 'Fire Mage (in-game name Oberon) is a Legendary-rarity hero in Wittle Defender: Fire element, Mage role, male, a blonde pointed-eared elf-lord in a black cape with red lining.',
  },
  {
    key: 'hero-fire-mage-main-skill',
    category: 'heroes',
    text: 'Fire Mage\'s Main Skill, Boulder, releases boulders that crush enemies in a line - he is a Fire-element hero with a rock-themed attack, so a skill\'s flavour does not always match a hero\'s element.',
  },
  {
    key: 'hero-fire-mage-ascend',
    category: 'heroes',
    text: 'Fire Mage\'s four Boulder Ascend upgrades are: Star - boulders inflict burn for continuous DMG; Moon - Boulder Count +1; Diamond - crushed enemies briefly have Move SPD and ATK reduced; Max - targets killed by Boulders leave a large burning zone.',
  },
  {
    key: 'hero-fire-mage-assistance',
    category: 'heroes',
    text: 'Fire Mage\'s Talent ladder grants Battle Assistance while he is deployed: all allies gain ATK +3% and Max HP +3% at 5 stars, +8% at 5 moons, and +15% at 5 diamonds.',
  },
  {
    key: 'hero-fire-mage-passive',
    category: 'heroes',
    text: 'Fire Mage\'s passive Fire Break Aura reduces enemy Fire RES by 4% at Lv.1, 12% at Lv.2 and 27% at Lv.3 while he is deployed.',
  },
  {
    key: 'hero-fire-mage-chain',
    category: 'heroes',
    text: 'Fire Mage\'s Chain Skill, Fireball Splash, requires Fire Mage and Fire Witch both deployed: Boulder and Meteor generate Splash Fireballs.',
  },
  {
    key: 'hero-fire-witch-identity',
    category: 'heroes',
    text: 'Fire Witch (in-game name Flica) is a Legendary-rarity hero in Wittle Defender: Fire element, Mage role, female, a flame-haired witch in black-and-gold robes.',
  },
  {
    key: 'hero-fire-witch-main-skill',
    category: 'heroes',
    text: 'Fire Witch\'s Main Skill, Meteor, summons meteors at random locations.',
  },
  {
    key: 'hero-fire-witch-ascend',
    category: 'heroes',
    text: 'Fire Witch\'s four Meteor Ascend upgrades are: Star - meteors have a chance to explode twice; Moon - Meteor Count +1; Diamond - Meteor Count +1 again; Max - Meteor kills increase team ATK, a team-scaling payoff rather than the personal number bump most Legendary Max Ascends give.',
  },
  {
    key: 'hero-fire-witch-assistance',
    category: 'heroes',
    text: 'Fire Witch\'s Talent ladder grants Battle Assistance while she is deployed: all allies gain ATK +3% and Max HP +3% at 5 stars, +8% at 5 moons, and +15% at 5 diamonds.',
  },
  {
    key: 'hero-fire-witch-passive',
    category: 'heroes',
    text: 'Fire Witch\'s passive Vitality Aura increases Team HP by 4% at Lv.1, 12% at Lv.2 and 27% at Lv.3 while she is deployed.',
  },
  {
    key: 'hero-fire-witch-chain',
    category: 'heroes',
    text: 'Fire Witch\'s Chain Skill, Fireball Splash, requires Fire Witch and Fire Mage both deployed: Boulder and Meteor generate Splash Fireballs.',
  },
  {
    key: 'hero-fire-apprentice-identity',
    category: 'heroes',
    text: 'Fire Apprentice (in-game name "Funa") is an Epic-rarity Fire-element Mage, a female tiny mage almost entirely hidden under an oversized red-and-gold star-hat and holding a gold-tipped wand. As an Epic she has no star tier.',
  },
  {
    key: 'hero-fire-apprentice-main-skill',
    category: 'heroes',
    text: 'Fire Apprentice\'s Main Skill, Fireblast, casts Fire Shots at the nearest enemy. It is her only skill — Epic heroes have nothing beyond the Main Skill.',
  },
  {
    key: 'hero-fire-mage-synergy',
    category: 'strategy',
    text: 'Fire Mage is a Fire comp\'s cheap amplifier: stripping up to 27% enemy Fire RES multiplies every Fire hero on the team (Draconic Empress, Phoenix Dancer, Scarlet Reaper, Fiery Vanguard, Blazing Archer, Fire Witch). With his Move SPD/ATK debuff and burning zones he is a control-and-amplify slot, not a carry. He pairs by design with Fire Witch.',
  },
  {
    key: 'hero-fire-witch-synergy',
    category: 'strategy',
    text: 'Fire Witch is a strong team-value Legendary: up to +27% team HP from Vitality Aura plus a Max Ascend that turns her kills into team ATK. Team HP does not overlap with what Demon Hunter (Wind DMG), Cat Assassin, Fire Mage and Ice Witch (RES shred) or Seraph (healing) give, so she stacks with them. Run her with Fire Mage - his Fire Break Aura and the Fireball Splash chain.',
  },
  {
    key: 'hero-fire-mage-skins',
    category: 'gear',
    text: 'Fire Mage has no skins - his hero page has no Skin button at all.',
  },
  {
    key: 'hero-fire-witch-skins',
    category: 'gear',
    text: 'Fire Witch has no skins - her hero page has no Skin button at all.',
  },
  {
    key: 'hero-frankenstein-identity',
    category: 'heroes',
    text: 'Frankenstein (in-game name "Frank") is a Common-rarity Electric-element Mage, a male green-skinned Frankenstein\'s-monster figure with flat brown hair, a neck bolt and brown trousers. "Frankenstein" is the hero title and "Frank" is the character name. As a Common he has no star tier.',
  },
  {
    key: 'hero-frankenstein-main-skill',
    category: 'heroes',
    text: 'Frankenstein\'s Main Skill, Forked Lightning, fires multiple lightning bolts in a fan-shaped area. It is his only skill — Common heroes have nothing beyond the Main Skill.',
  },
  {
    key: 'hero-frost-lich-identity',
    category: 'heroes',
    text: 'Frost Lich (character name Necrym) is a Mythic Frost-element Support hero, a male lich.',
  },
  {
    key: 'hero-frost-lich-main-skill',
    category: 'heroes',
    text: 'Frost Lich\'s Main Skill, Wyvern Call, summons a Frost Wyvern every 10s that is treated as a hero unit; it unleashes breath attacks and every 5s releases a Frost Vortex dealing damage over time and slowing enemies in range.',
  },
  {
    key: 'hero-frost-lich-ascend-early',
    category: 'heroes',
    text: 'Frost Lich\'s first two Ascend upgrades: at 1 star, the team gains +15% Ice DMG while he is present; at 2 stars, the Frost Wyvern summon cooldown is reduced by 5s.',
  },
  {
    key: 'hero-frost-lich-ascend-late',
    category: 'heroes',
    text: 'Frost Lich\'s last two Ascend upgrades: at 3 stars, Frost Vortex range increases and it additionally reduces targets\' CRIT Rate by 20% and DMG Reduction by 12%; at the max tier that shred grows to CRIT Rate -40% and DMG Reduction -24%.',
  },
  {
    key: 'hero-frost-lich-passive',
    category: 'heroes',
    text: 'Frost Lich\'s passive Necrotic Fury increases allied summon DMG by 15% at Lv.1, 30% at Lv.2 and 45% at Lv.3.',
  },
  {
    key: 'hero-frost-lich-chain',
    category: 'heroes',
    text: 'Frost Lich\'s Chain Skill, Freezing Exhale, requires both Frost Lich and Polar Captain deployed: the Frost Wyvern\'s attack range increases and it gains a chance to Freeze enemies for 3s.',
  },
  {
    key: 'hero-frost-archer-identity',
    category: 'heroes',
    text: 'Frost Archer (in-game name "Syphren") is an Epic-rarity Frost-element Ranger — a hooded archer in a blue-and-gold cloak whose face is shadowed, with gender unspecified in the art. As an Epic there is no star tier.',
  },
  {
    key: 'hero-frost-archer-main-skill',
    category: 'heroes',
    text: 'Frost Archer\'s Main Skill, Ice Arrow, fires piercing ice arrows. It is the hero\'s only skill — Epic heroes have nothing beyond the Main Skill.',
  },
  {
    key: 'hero-frost-lich-synergy',
    category: 'strategy',
    text: 'Frost Lich anchors summon comps: his passive buffs allied summon damage up to +45% and his own Frost Wyvern counts as a hero unit, so pair him with summoners like Northern Tyrant, Draconic Empress, Phoenix Dancer and Panda Brewmaster. His late Ascends strip enemy CRIT Rate and DMG Reduction on top, which makes him PvP-facing rather than a pure damage adder.',
  },
  {
    key: 'hero-frost-lich-skins',
    category: 'gear',
    text: 'Frost Lich\'s non-levelable skins: Chilled Requiem (Legendary) grants all deployed heroes +1% ATK, HP and DEF, and Argent Frost Lich (Mythic, obtained from Event Market exchange) also grants +1% each and unlocks its skill once the skin is obtained. His Default skin carries no bonus.',
  },
  {
    key: 'hero-god-ruler-identity',
    category: 'heroes',
    text: 'God Ruler (in-game name Odin) is a Mythic Electric Fighter — a male, bearded, horned-helm warhammer hero with one glowing eye. He is a standard Mythic, not an S-tier Mythic.',
  },
  {
    key: 'hero-god-ruler-main-skill',
    category: 'heroes',
    text: 'God Ruler\'s Main Skill, Lightning Chain, continuously fires lightning at enemies, and that lightning bounces multiple times between targets.',
  },
  {
    key: 'hero-god-ruler-ascend-early',
    category: 'heroes',
    text: 'God Ruler\'s first two Ascend upgrades scale his base skill: the 1-star Ascend gives Lightning Chain CD -22%, and the 2-star Ascend adds +4 chains and +3 bounces.',
  },
  {
    key: 'hero-god-ruler-ascend-late',
    category: 'heroes',
    text: 'God Ruler\'s last two Ascends are an Infinity Spear upgrade path: the 3-star Ascend makes Infinity Spear trigger a lightning storm that deals AoE damage and stuns enemies on landing, and the 4-star (MAX) Ascend grows the spear larger and evolves its lightning into Godstorm, dealing massive damage over a wide area.',
  },
  {
    key: 'hero-god-ruler-passive',
    category: 'heroes',
    text: 'God Ruler\'s Passive, Storm Fury Aura, increases Team Electro DMG for the whole team while he is deployed: 4% at Lv.1, 12% at Lv.2, and 27% at Lv.3.',
  },
  {
    key: 'hero-god-ruler-chain',
    category: 'heroes',
    text: 'God Ruler\'s Chain Skill, Multi Lightning, requires both God Ruler and Robot deployed; his Lightning Chain hits may then trigger Multi Lightning.',
  },
  {
    key: 'hero-god-ruler-crowd-control',
    category: 'strategy',
    text: 'God Ruler\'s only crowd control is the stun on the lightning storm his 3-star Ascend adds (the Ascend text calls the trigger Infinity Spear, a skill named nowhere else in his kit), so a low-star God Ruler is chain damage with no lockdown.',
  },
  {
    key: 'hero-god-ruler-synergy',
    category: 'strategy',
    text: 'God Ruler is the Electric element anchor: Storm Fury Aura is a team-wide Electro DMG multiplier (up to +27%), so he multiplies other Electric heroes instead of competing with them. Paired with Levin Archangel\'s Electro RES shred on enemies, a mono-Electric comp gains damage and strips resistance at the same time — those multiply.',
  },
  {
    key: 'hero-god-ruler-skins',
    category: 'gear',
    text: 'God Ruler\'s non-levelable skins: Golden Sovereign (Legendary, Shock & Sear event) gives all deployed heroes ATK% +1%, HP% +1%, DEF% +1%; Fallen Leviathan (Legendary, Halloween Marvels event) gives +2% of each; Argent God Ruler (Mythic, Event Market exchange) gives +1% of each plus Silver Oath — "God Ruler: Chain Skill active by default". His Default skin has no bonus.',
  },
  {
    key: 'hero-high-priest-identity',
    category: 'heroes',
    text: 'High Priest (in-game name Volta) is a Legendary-rarity hero in Wittle Defender: Electric element, Mage role, male, a white-bearded old man in a blue robe reading a large tome.',
  },
  {
    key: 'hero-high-priest-main-skill',
    category: 'heroes',
    text: 'High Priest\'s Main Skill, Spinning Orb, releases rotating lightning orbs around him.',
  },
  {
    key: 'hero-high-priest-ascend',
    category: 'heroes',
    text: 'High Priest\'s four Spinning Orb Ascend upgrades are all distinct: Star - the orb periodically fires a bolt of electricity; Moon - electric current hits inflict Stun; Diamond - Orb DMG +40% while pulling enemies toward it; Max - the orb creates new orbs in an extra orbit.',
  },
  {
    key: 'hero-high-priest-assistance',
    category: 'heroes',
    text: 'High Priest\'s Talent ladder grants Battle Assistance while he is deployed: all allies gain ATK +3% and Max HP +3% at 5 stars, +8% at 5 moons, and +15% at 5 diamonds.',
  },
  {
    key: 'hero-high-priest-passive',
    category: 'heroes',
    text: 'High Priest\'s passive Electro Power Aura is self-only despite the Aura name: it increases his own ATK by 4% at Lv.1, 12% at Lv.2 and 27% at Lv.3.',
  },
  {
    key: 'hero-high-priest-chain',
    category: 'heroes',
    text: 'High Priest\'s Chain Skill, Conductive, requires High Priest and Seraph both deployed: casting Thunderfall or Spinning Orb triggers Conductive. Seraph\'s Diamond Ascend upgrades Conductive, so ascending her improves the shared chain.',
  },
  {
    key: 'hero-high-priest-synergy',
    category: 'strategy',
    text: 'High Priest is a control Mage: Stun on his electric current at the Moon Ascend and an enemy pull at Diamond. The pull clumps enemies, multiplying every AoE in the comp (Ice Mage\'s Frost Nova, Phoenix Dancer\'s Blazing Orb, Draconic Empress\'s Wyrmling). His passive is selfish, so his team value is Battle Assistance plus the Conductive chain with Seraph.',
  },
  {
    key: 'hero-high-priest-skins',
    category: 'gear',
    text: 'High Priest has no skins - his hero page has no Skin button at all.',
  },
  {
    key: 'hero-ice-demon-identity',
    category: 'heroes',
    text: 'Ice Demon (in-game name Floss) is a Mythic Frost Support — a male-presenting blue ice-spiked elemental creature, with no gendered pronouns anywhere in its skill text. It is a standard Mythic, not an S-tier Mythic.',
  },
  {
    key: 'hero-ice-demon-main-skill',
    category: 'heroes',
    text: 'Ice Demon\'s Main Skill, Frost Summon, summons a Frost Troll to assist in battle for 10 seconds; the Frost Troll inherits 50% of Ice Demon\'s ATK and HP.',
  },
  {
    key: 'hero-ice-demon-ascends',
    category: 'heroes',
    text: 'Ice Demon\'s Ascend ladder is a summon-count curve: the 1-star Ascend gives Initial Summon Count +1, the 2-star Ascend cuts Summon CD by 1s, the 3-star Ascend gives another Initial Summon Count +1, and the 4-star (MAX) Ascend makes him summon two Ice Bears.',
  },
  {
    key: 'hero-ice-demon-passive',
    category: 'heroes',
    text: 'Ice Demon\'s Passive, Ice Speed Aura, increases Team ATK SPD while he is deployed: 4% at Lv.1, 12% at Lv.2, and 27% at Lv.3.',
  },
  {
    key: 'hero-ice-demon-chain',
    category: 'heroes',
    text: 'Ice Demon\'s Chain Skill, Icicle Storm, requires both Ice Demon and Ice Queen deployed; Frost Summon\'s summoned unit and Ice Storm attacks then generate a massive Icicle Storm.',
  },
  {
    key: 'hero-ice-queen-identity',
    category: 'heroes',
    text: 'Ice Queen (in-game name Shiva) is a Mythic Frost Mage, female. She is a standard Mythic, not an S-tier Mythic.',
  },
  {
    key: 'hero-ice-queen-main-skill',
    category: 'heroes',
    text: 'Ice Queen\'s Main Skill, Ice Storm, channels an ice storm that continuously attacks enemies.',
  },
  {
    key: 'hero-ice-queen-ascends',
    category: 'heroes',
    text: 'Ice Queen\'s Ascends: the 1-star reduces Ice Storm\'s cooldown, the 2-star leaves a stationary hurricane behind when the storm ends, the 3-star increases Ice Storm\'s DMG rate, and the 4-star (MAX) Ascend spawns 2 Frigid Hurricanes. Tiers 2 and 4 are the mechanical ones; tiers 1 and 3 are pure numbers.',
  },
  {
    key: 'hero-ice-queen-passive',
    category: 'heroes',
    text: 'Ice Queen\'s Passive, Arctic Aura, increases Team Ice DMG while she is deployed: 4% at Lv.1, 12% at Lv.2, and 27% at Lv.3.',
  },
  {
    key: 'hero-ice-queen-chain',
    category: 'heroes',
    text: 'Ice Queen\'s Chain Skill, Icicle Storm, requires both Ice Queen and Ice Demon deployed; Frost Summon\'s summoned unit and Ice Storm attacks then generate a massive Icicle Storm. The pair is reciprocal — Ice Demon\'s own chain bubble names Ice Queen back.',
  },
  {
    key: 'hero-ice-mage-identity',
    category: 'heroes',
    text: 'Ice Mage (in-game name Brisa) is a Legendary-rarity hero in Wittle Defender: Frost element, Mage role, female, a pale blue snow-witch in a wide domed hat with a staff.',
  },
  {
    key: 'hero-ice-mage-main-skill',
    category: 'heroes',
    text: 'Ice Mage\'s Main Skill, Frost Nova, deals AoE Ice DMG to random enemies.',
  },
  {
    key: 'hero-ice-mage-ascend',
    category: 'heroes',
    text: 'Ice Mage\'s four Frost Nova Ascend upgrades are: Star - Frost Nova duration +2s; Moon - Frost Nova explodes again as it fades; Diamond - Frost Nova DoT +50%; Max - Frost Nova duration +2s again, repeating the Star upgrade.',
  },
  {
    key: 'hero-ice-mage-assistance',
    category: 'heroes',
    text: 'Ice Mage\'s Talent ladder grants Battle Assistance while she is deployed: all allies gain ATK +3% and Max HP +3% at 5 stars, +8% at 5 moons, and +15% at 5 diamonds.',
  },
  {
    key: 'hero-ice-mage-passive',
    category: 'heroes',
    text: 'Ice Mage\'s passive Ice Power Aura is self-only despite the Aura name: it increases her own ATK by 4% at Lv.1, 12% at Lv.2 and 27% at Lv.3, and gives the rest of the team nothing.',
  },
  {
    key: 'hero-ice-mage-chain',
    category: 'heroes',
    text: 'Ice Mage\'s Chain Skill, Ice Shard, requires Ice Mage and Ice Witch both deployed: Frost Nova and Icicle Sweep spawn Ice Shards.',
  },
  {
    key: 'hero-ice-witch-identity',
    category: 'heroes',
    text: 'Ice Witch (in-game name Anna) is a Legendary-rarity hero in Wittle Defender: Frost element, Mage role, female, blonde in a blue-and-white gown with a gold tiara and a teal crystal-tipped staff.',
  },
  {
    key: 'hero-ice-witch-main-skill',
    category: 'heroes',
    text: 'Ice Witch\'s Main Skill, Icicle Sweep, fires rotating icicles that sweep enemies.',
  },
  {
    key: 'hero-ice-witch-ascend',
    category: 'heroes',
    text: 'Ice Witch\'s four Icicle Sweep Ascend upgrades are: Star - initial icicle trajectory +1; Moon - icicles may trigger Frost Explosions; Diamond - initial icicle trajectory +1 again; Max - Frost Explosion creates an ice pillar that taunts enemies, giving a Mage a genuine aggro tool.',
  },
  {
    key: 'hero-ice-witch-assistance',
    category: 'heroes',
    text: 'Ice Witch\'s Talent ladder grants Battle Assistance while she is deployed: all allies gain ATK +3% and Max HP +3% at 5 stars, +8% at 5 moons, and +15% at 5 diamonds.',
  },
  {
    key: 'hero-ice-witch-passive',
    category: 'heroes',
    text: 'Ice Witch\'s passive Ice Break Aura reduces enemy Ice RES by 4% at Lv.1, 12% at Lv.2 and 27% at Lv.3 while she is deployed.',
  },
  {
    key: 'hero-ice-witch-chain',
    category: 'heroes',
    text: 'Ice Witch\'s Chain Skill, Ice Shard, requires Ice Witch and Ice Mage both deployed: Frost Nova and Icicle Sweep spawn Ice Shards.',
  },
  {
    key: 'hero-ice-wolf-pup-identity',
    category: 'heroes',
    text: 'Ice Wolf Pup (in-game name "Frost Howl") is a Common-rarity Frost-element Fighter — an animal, a blue-and-white wolf cub with red inner ears wearing a belt with a cyan gem, so gender does not apply. "Frost Howl" is a skill-style name, not a personal name. As a Common he has no star tier.',
  },
  {
    key: 'hero-ice-wolf-pup-main-skill',
    category: 'heroes',
    text: 'Ice Wolf Pup\'s Main Skill, Ice Claw, assaults enemies with icy claws. It is his only skill — Common heroes have nothing beyond the Main Skill.',
  },
  {
    key: 'hero-ice-demon-synergy-summons',
    category: 'strategy',
    text: 'Ice Demon is a very dense summon source — Frost Troll on a short cooldown, two extra initial summons from his Ascend ladder, and two Ice Bears at MAX — which makes him the natural partner for Northern Tyrant, whose Wolf Fury passive and Bitter Frigidity SP Skill both scale off allied summoned units.',
  },
  {
    key: 'hero-ice-demon-synergy-atkspd',
    category: 'strategy',
    text: 'Ice Demon\'s team ATK SPD aura buffs uptime rather than hit size, so it stacks cleanly with a CRIT DMG package instead of overlapping it — useful in comps already loaded with crit buffers.',
  },
  {
    key: 'hero-ice-queen-synergy',
    category: 'strategy',
    text: 'Ice Queen is the Frost/Ice element amplifier — up to +27% team Ice DMG, which multiplies other Ice heroes such as Northern Tyrant\'s Frostwolves and Frost Lich\'s whole kit. Her chain partner Ice Demon is Frost too, so a Frost core gets the aura and the chain skill from the same picks.',
  },
  {
    key: 'hero-ice-mage-synergy',
    category: 'strategy',
    text: 'Ice Mage is a pure Frost DPS filler with very low team value: Ice Power Aura buffs only her, so her only team contribution is the standard Battle Assistance. Her worth is the Ice Shard chain with Ice Witch and being a Frost body next to Northern Tyrant, Ice Queen, Ice Demon, Frost Lich or Polar Captain.',
  },
  {
    key: 'hero-ice-witch-synergy',
    category: 'strategy',
    text: 'Ice Witch is the Frost comp\'s RES stripper: up to 27% enemy Ice RES down multiplies every Frost hero at once (Northern Tyrant, Ice Queen, Ice Demon, Frost Lich, Polar Captain, Ice Mage), an inexpensive way to raise a whole Frost team\'s damage. Run her with Ice Mage for the Ice Shard chain - unlike his selfish aura, hers is team-positive.',
  },
  {
    key: 'hero-ice-demon-skins',
    category: 'gear',
    text: 'Ice Demon\'s one unlockable skin is Argent Ice Demon (Mythic, from the Event Market exchange): it gives all deployed heroes ATK% +1%, HP% +1%, DEF% +1% and carries the Silver Oath skill — "Ice Demon: Chain Skill active by default". His Default skin carries no bonus.',
  },
  {
    key: 'hero-ice-queen-skins',
    category: 'gear',
    text: 'Ice Queen\'s unlockable skins: Chilled Whisper (Legendary, limited-time event) gives all deployed heroes ATK% +2%, HP% +2%, DEF% +2% and Support DMG Bonus +2%; Argent Ice Queen (Mythic, Event Market exchange) gives +1% of each and unlocks a skin skill once obtained. Her Default skin carries no bonus.',
  },
  {
    key: 'hero-ice-mage-skins',
    category: 'gear',
    text: 'Ice Mage has no skins - her hero page has no Skin button at all.',
  },
  {
    key: 'hero-ice-witch-skins',
    category: 'gear',
    text: 'Ice Witch has two non-levelable Legendary skins: Fluffy Ice Witch gives all deployed heroes ATK% +1%, HP% +1%, DEF% +1% and came from Pre-registration Milestone Rewards (a launch-era source, no longer obtainable); Crystal Surf gives ATK% +2%, HP% +2%, DEF% +2%, Ice DMG +2% plus the skill Summer Cheers - every 20s, team ATK +2% for 5s (cannot stack) - from a limited-time event.',
  },
  {
    key: 'hero-levin-archangel-identity',
    category: 'heroes',
    text: 'Levin Archangel (name: Elettra) is a female Mythic hero carrying the S-tier badge, with the Electric element and the Fighter role.',
  },
  {
    key: 'hero-levin-archangel-main-skill',
    category: 'heroes',
    text: 'Levin Archangel\'s Main Skill, Lightning Twins, wields twin blades for two lightning-wave attacks whose damage scales with the level of the ally under [Unity Grace]. When that ally ascends she performs [Resonance Ascension], turning the waves into a large fan shape.',
  },
  {
    key: 'hero-levin-archangel-ascend-1-2',
    category: 'heroes',
    text: 'Levin Archangel Ascend tiers 1-2: the star Ascend makes her additionally cast [Thunder Execution] after [Lightning Twins] ends once Resonance Ascension is active; the moon Ascend widens [Thunder Execution] and reduces hit enemies\' DMG RES and Electro DMG RES by 15%.',
  },
  {
    key: 'hero-levin-archangel-ascend-3-4',
    category: 'heroes',
    text: 'Levin Archangel Ascend tiers 3-4: the diamond Ascend greatly reduces [Lightning Twins] CD and grants [Unyielding] for 3s when she would take fatal damage, restoring 50% of her Max HP when it ends (once every 60s); the final Ascend adds a Heavenly Array to [Thunder Execution] and makes [Unity Grace] also give her and the blessed ally +15% DMG Bonus and +15% Electro DMG Bonus.',
  },
  {
    key: 'hero-levin-archangel-passive',
    category: 'heroes',
    text: 'Levin Archangel\'s Passive, Valor Infusion, is a team-wide Total ATK buff: +8% at Lv.1, +16% at Lv.2, and +24% at Lv.3.',
  },
  {
    key: 'hero-levin-archangel-sp-skill',
    category: 'heroes',
    text: 'Levin Archangel\'s SP Skill, Unity Grace, continuously blesses the highest-ATK ally other than herself, granting that ally [Unyielding] (will not die when receiving lethal damage) and sharing 10% of her base ATK.',
  },
  {
    key: 'hero-levin-archangel-chain',
    category: 'heroes',
    text: 'Levin Archangel has no Chain Skill.',
  },
  {
    key: 'hero-levin-archangel-synergy',
    category: 'strategy',
    text: 'Play Levin Archangel beside a high-level, high-ATK carry — her Main Skill damage scales with the level of the ally she blesses with [Unity Grace]. Her team-wide +8/16/24% Total ATK and her 15% enemy Electro DMG RES shred make her an anchor for an Electric comp.',
  },
  {
    key: 'hero-levin-archangel-skins',
    category: 'gear',
    text: 'Levin Archangel skins with fixed bonuses: Celestial Verdict [Legendary] gives all deployed heroes +1% ATK/HP/DEF, and Argent Levin Archangel [Mythic] gives +1% ATK/HP/DEF, unlocks a skill on obtaining, and comes from the Event Market exchange. Her default skin carries no bonus.',
  },
  {
    key: 'hero-monkey-king-identity',
    category: 'heroes',
    text: 'Monkey King (name: Sun Wukong) is a male Sublime hero — Sublime being the Xenoscape/Sage rarity — with the Xenoscape element and the Ranger role.',
  },
  {
    key: 'hero-monkey-king-main-skill',
    category: 'heroes',
    text: 'Monkey King\'s Main Skill, Celestial Crush, wields the Golden Staff to attack 4 times in a row, with each stack of [Cosmic Energy] adding +75% DMG. He gains a Cosmic Energy stack whenever any ally upgrades 3 times (up to 4 stacks), and when any ally ascends he gains [Resonance Ascension], greatly increasing the skill\'s damage and range.',
  },
  {
    key: 'hero-monkey-king-ascend-1-2',
    category: 'heroes',
    text: 'Monkey King Ascend tiers 1-2: the star Ascend makes him cast [Mountain Breaker] when the [Celestial Crush] combo ends once [Resonance Ascension] is active, with each Cosmic Energy stack adding +75% to its damage; the moon Ascend adds +120% [Celestial Crush] DMG and reduces hit enemies\' CRIT RES by 18%.',
  },
  {
    key: 'hero-monkey-king-ascend-3-4',
    category: 'heroes',
    text: 'Monkey King Ascend tiers 3-4: the diamond Ascend has each strike of [Celestial Crush] create a clone that quickly attacks an enemy once and disappears; the final Ascend summons 4 Sage Avatars to attack alongside [Mountain Breaker], raises its DMG count to 5, and massively increases its damage.',
  },
  {
    key: 'hero-monkey-king-passive',
    category: 'heroes',
    text: 'Monkey King\'s Passive, Heaven\'s Equal, is role-specific: while he is deployed it increases Team Ranger DMG by 5% at Lv.1, 12% at Lv.2, and 27% at Lv.3.',
  },
  {
    key: 'hero-monkey-king-xenoscape',
    category: 'heroes',
    text: 'Monkey King\'s Xenoscape skill, Enlightened Spirit, increases his Dodge Rate by 3% whenever any hero upgrades, up to 12 stacks.',
  },
  {
    key: 'hero-monkey-king-chain',
    category: 'heroes',
    text: 'Monkey King has no Chain Skill — his fourth skill slot is the Xenoscape skill Enlightened Spirit.',
  },
  {
    key: 'hero-monkey-king-synergy',
    category: 'strategy',
    text: 'Run Monkey King in a Ranger-heavy comp — his Passive buffs Team Ranger DMG specifically, up to +27%. His own damage scales off allies upgrading and ascending, so he rewards spreading investment across the whole team rather than funnelling it into one carry.',
  },
  {
    key: 'hero-monkey-king-skins',
    category: 'gear',
    text: 'Monkey King skins with fixed bonuses: the Legendary skin also named Monkey King gives all deployed heroes +2% ATK/HP/DEF, unlocks a skill on obtaining, and comes from the [Spring Festival Gala] event; Argent Sun Wukong [Mythic] gives +1% ATK/HP/DEF, unlocks a skill, and comes from the Event Market exchange. His default skin carries no bonus.',
  },
  {
    key: 'hero-night-baron-identity',
    category: 'heroes',
    text: 'Night Baron (in-game name Vesper) is a Mythic Wind Ranger — a male, Zorro-styled duellist with a black hat, domino mask and rapier. He is a standard Mythic, not an S-tier Mythic.',
  },
  {
    key: 'hero-night-baron-main-skill',
    category: 'heroes',
    text: 'Night Baron\'s Main Skill, Thrust, deals piercing damage to enemies in front of him.',
  },
  {
    key: 'hero-night-baron-ascends',
    category: 'heroes',
    text: 'Night Baron\'s Ascends: the 1-star gives Initial Thrust ATK Count +6, the 2-star makes his first Thrust attack land with strong knockback and damage, the 3-star repeats Initial Thrust ATK Count +6, and the 4-star (MAX) Ascend gives Tempest Thrust cast count +1.',
  },
  {
    key: 'hero-night-baron-passive',
    category: 'heroes',
    text: 'Night Baron\'s Passive, Mirage Sword, is self-focused with no team effect: it increases his Dodge while he is below 50% HP — 15% at Lv.1, 20% at Lv.2, and 50% at Lv.3.',
  },
  {
    key: 'hero-night-baron-chain',
    category: 'heroes',
    text: 'Night Baron\'s Chain Skill, Wind Blade, requires both Night Baron and Swordmaster deployed; Whirlwind Slash and Thrust then continuously spawn Wind Blades.',
  },
  {
    key: 'hero-night-baron-synergy',
    category: 'strategy',
    text: 'Night Baron is a self-contained duellist — selfish Ascends, a personal-Dodge passive, and no team buff beyond the universal Battle Assistance. His value is positional: he is the bridge in the Wind chain sequence Fabled Lyra → Sword Saint → Night Baron → Swordmaster, so running the middle pair switches on two chain skills at once.',
  },
  {
    key: 'hero-night-baron-skins',
    category: 'gear',
    text: 'Night Baron\'s one unlockable skin is Argent Night Baron (Mythic, from the Event Market exchange): it gives all deployed heroes ATK% +1%, HP% +1%, DEF% +1% and carries the Silver Oath skill — "Night Baron: Chain Skill active by default". His Default skin carries no bonus.',
  },
  {
    key: 'hero-northern-tyrant-identity',
    category: 'heroes',
    text: 'Northern Tyrant (name: Ulfric) is a male Mythic hero carrying the S-tier badge, with the Frost element and the Fighter role.',
  },
  {
    key: 'hero-northern-tyrant-main-skill',
    category: 'heroes',
    text: 'Northern Tyrant\'s Main Skill, Blizzard Cleaver, throws a spinning cleaver that deals double damage to enemies in its path. On entering battle he also summons 2 Frostwolves — permanent units that stay on the field attacking with Frost Claws for as long as he is alive.',
  },
  {
    key: 'hero-northern-tyrant-ascend-1-2',
    category: 'heroes',
    text: 'Northern Tyrant Ascend tiers 1-2: the star Ascend grants [Permafrost], which every 30s creates a 5s zone that deals damage over time and inflicts a [Freeze] ignoring CC RES (its CD is unaffected by Skill CD SPD bonuses); the moon Ascend makes each [Permafrost] use permanently add +15% Ice DMG to him and his summons, up to 2 stacks.',
  },
  {
    key: 'hero-northern-tyrant-ascend-3-4',
    category: 'heroes',
    text: 'Northern Tyrant Ascend tiers 3-4: the diamond Ascend makes every 3rd Frost Shred cast by the Frostwolf King trigger [Glacial Domain], continuously dealing heavy damage over a large area (the Frostwolf King and Frost Shred are named only in this Ascend and are described nowhere else in his kit); the final Ascend adds +200% Blizzard Cleaver DMG and makes enemies take 18% increased damage from ALL summons, not only his own.',
  },
  {
    key: 'hero-northern-tyrant-passive',
    category: 'heroes',
    text: 'Northern Tyrant\'s Passive, Wolf Fury, gives the team +4% DMG for each allied summoned unit while he is on the field. The stack cap is 3 at Lv.1, 6 at Lv.2, and 9 at Lv.3, so up to +36% team DMG.',
  },
  {
    key: 'hero-northern-tyrant-sp-skill',
    category: 'heroes',
    text: 'Northern Tyrant\'s SP Skill, Bitter Frigidity, gives all allied summoned units a 3% chance to trigger a devastating blow dealing 5x damage.',
  },
  {
    key: 'hero-northern-tyrant-chain',
    category: 'heroes',
    text: 'Northern Tyrant has no Chain Skill.',
  },
  {
    key: 'hero-northern-tyrant-synergy',
    category: 'strategy',
    text: 'Northern Tyrant anchors a summoner comp: his Passive and SP Skill both scale off allied summoned units rather than just his own Frostwolves, and his final Ascend makes enemies take 18% more damage from all summons. Pair him with summoners such as Draconic Empress (Inferno Wyrmling) and Panda Brewmaster (Verdant Bamboo).',
  },
  {
    key: 'hero-northern-tyrant-skins',
    category: 'gear',
    text: 'Northern Tyrant skins with fixed bonuses: Glacial King [Legendary] gives all deployed heroes +1% ATK/HP/DEF, and Argent Northern Tyrant [Mythic] gives +1% ATK/HP/DEF, unlocks a skill on obtaining, and comes from the Event Market exchange. His default skin carries no bonus.',
  },
  {
    key: 'hero-novice-priest-identity',
    category: 'heroes',
    text: 'Novice Priest (in-game name "Zabby") is an Epic-rarity Electric-element Support, a male blond bowl-cut child priest in a white-and-blue robe carrying a glowing yellow orb on a staff. As an Epic he has no star tier.',
  },
  {
    key: 'hero-novice-priest-main-skill',
    category: 'heroes',
    text: 'Novice Priest\'s Main Skill, Ball Lightning, releases homing lightning orbs. It is his only skill — Epic heroes have nothing beyond the Main Skill.',
  },
  {
    key: 'hero-novice-priest-support-caveat',
    category: 'strategy',
    text: 'Novice Priest is labelled a Support, but with no passive, no battle assistance and no chain skill there is nothing team-facing in his kit at all. He is the clearest example that an Epic hero\'s role chip does not imply any team value — don\'t slot him in expecting heals or buffs.',
  },
  {
    key: 'hero-panda-brewmaster-identity',
    category: 'heroes',
    text: 'Panda Brewmaster (name: Bambrew) is a male Mythic hero carrying the S-tier badge, with the Wind element and the Ranger role.',
  },
  {
    key: 'hero-panda-brewmaster-main-skill',
    category: 'heroes',
    text: 'Panda Brewmaster\'s Main Skill, Windstride, leaps 3 times for AoE damage and summons [Verdant Bamboo] that enemies can target. Each Verdant Bamboo permanently increases team total HP by 0.5% when it appears (up to 30 stacks) and deals AoE damage when it disappears.',
  },
  {
    key: 'hero-panda-brewmaster-ascend-1-2',
    category: 'heroes',
    text: 'Panda Brewmaster Ascend tiers 1-2: the star Ascend puts the team into [Wind\'s Wrath] for 12s after [Windstride] attacks 15 times, granting +60% Dodge that gradually decays; the moon Ascend adds +2 attacks to [Windstride] and reduces hit enemies\' DMG REDUC by 20% and Wind RES by 20% for 3s.',
  },
  {
    key: 'hero-panda-brewmaster-ascend-3-4',
    category: 'heroes',
    text: 'Panda Brewmaster Ascend tiers 3-4: the diamond Ascend gives [Wind\'s Wrath] guaranteed Dodge for its first 3s plus an extra trigger whenever an ally drops below 90% HP (max once every 30s); the final Ascend has [Wind\'s Wrath] also grant +30% DMG Bonus and +30% Wind DMG Bonus that do not decay, and boosts Verdant Bamboo\'s vanish damage by 200%.',
  },
  {
    key: 'hero-panda-brewmaster-passive',
    category: 'heroes',
    text: 'Panda Brewmaster\'s Passive, Drunken Master!, raises Team CRIT DMG while he is deployed: +25% at Lv.1, +50% at Lv.2, and +75% at Lv.3.',
  },
  {
    key: 'hero-panda-brewmaster-sp-skill',
    category: 'heroes',
    text: 'Panda Brewmaster\'s SP Skill, Tipsy Endurance, increases the total HP of all allies by 15%.',
  },
  {
    key: 'hero-panda-brewmaster-chain',
    category: 'heroes',
    text: 'Panda Brewmaster has no Chain Skill.',
  },
  {
    key: 'hero-panda-brewmaster-synergy',
    category: 'strategy',
    text: 'Panda Brewmaster is a whole-team buffer: +15% team HP from his SP Skill, more team HP from Verdant Bamboo stacks, +25/50/75% Team CRIT DMG, and a +60% team Dodge window. He pairs naturally with Fabled Lyra, who also grants team CRIT DMG, for a crit-stacking comp.',
  },
  {
    key: 'hero-panda-brewmaster-skins',
    category: 'gear',
    text: 'Panda Brewmaster skins with fixed bonuses, each granting all deployed heroes +1% ATK/HP/DEF: Bamboo Adept [Legendary]; Argent Panda Brewmaster [Mythic], from the Event Market exchange; and Tai Chi Master [Mythic], also from the Event Market exchange. Both Mythic skins unlock a skill on obtaining, and his default skin carries no bonus.',
  },
  {
    key: 'hero-phoenix-dancer-identity',
    category: 'heroes',
    text: 'Phoenix Dancer (in-game name Xiluan) is a Mythic Fire Mage, female. She is a standard Mythic, not an S-tier Mythic.',
  },
  {
    key: 'hero-phoenix-dancer-main-skill',
    category: 'heroes',
    text: 'Phoenix Dancer\'s Main Skill, Blazing Orb, throws a fireball that bounces among enemies and deals area damage.',
  },
  {
    key: 'hero-phoenix-dancer-ascend-early',
    category: 'heroes',
    text: 'Phoenix Dancer\'s 1-star Ascend grants her [Scorching Feathers] (+15% CRIT Rate, ending on death) and [Rebirth] (she automatically revives once per battle) as she enters battle; her 2-star Ascend raises the Scorching Feathers CRIT Rate bonus to +30%.',
  },
  {
    key: 'hero-phoenix-dancer-ascend-late',
    category: 'heroes',
    text: 'Phoenix Dancer\'s 3-star Ascend makes [Scorching Feathers]\' CRIT Rate bonus apply to allies as well as herself, and her 4-star (MAX) Ascend makes her regain [Scorching Feathers] and instantly refresh her EX-Weapon skills when she revives.',
  },
  {
    key: 'hero-phoenix-dancer-passive',
    category: 'heroes',
    text: 'Phoenix Dancer\'s Passive, Phoenix Flame Array, fires after every 3 casts of Blazing Orb and summons Phoenix Hatchlings to attack — the count rises by 1 for every 2 levels gained by any ally, up to 8. Lv.2 doubles the number of Hatchlings summoned, and Lv.3 gives Blazing Orb Skill CD -40%.',
  },
  {
    key: 'hero-phoenix-dancer-chain',
    category: 'heroes',
    text: 'Phoenix Dancer\'s Chain Skill, Dance of Flames, requires both Phoenix Dancer and Scarlet Reaper deployed and greatly increases Team Burn DMG. The pairing is one-sided — Scarlet Reaper\'s own chain bubble names Fiery Vanguard instead.',
  },
  {
    key: 'hero-phoenix-dancer-synergy-crit',
    category: 'strategy',
    text: 'Phoenix Dancer\'s 3-star Ascend converts [Scorching Feathers] from a personal +15% CRIT Rate into +30% CRIT Rate for the whole team, making her one of the biggest team CRIT Rate sources. That stacks multiplicatively with CRIT DMG sources like Fabled Lyra and Panda Brewmaster rather than overlapping them.',
  },
  {
    key: 'hero-phoenix-dancer-synergy-summons',
    category: 'strategy',
    text: 'Phoenix Dancer is a summoner — her Phoenix Hatchlings (up to 8, doubled at tier 2) pair well with Northern Tyrant, whose Wolf Fury gives team DMG per allied summoned unit and whose SP Skill buffs allied summons. [Rebirth] also makes her self-sufficient in fights where she would otherwise be picked off.',
  },
  {
    key: 'hero-phoenix-dancer-skins',
    category: 'gear',
    text: 'Phoenix Dancer\'s non-levelable skins: Scarlet Blaze Ritual (Legendary, Fire of Rebirth event) and Argent Phoenix Dancer (Mythic, Event Market exchange) each give all deployed heroes ATK% +1%, HP% +1%, DEF% +1%; the Argent also carries Silver Oath — "Phoenix Dancer: Chain Skill active by default". Her Default skin has no bonus.',
  },
  {
    key: 'hero-polar-captain-identity',
    category: 'heroes',
    text: 'Polar Captain (in-game name Sarashed) is a Mythic Frost Fighter, male. He is a standard Mythic, not an S-tier Mythic. His EX-Weapon is [Sunken Engulfer], which teaches the skill Ghost Fleet.',
  },
  {
    key: 'hero-polar-captain-main-skill',
    category: 'heroes',
    text: 'Polar Captain\'s Main Skill, Tide, summons waves to attack enemies.',
  },
  {
    key: 'hero-polar-captain-ascends',
    category: 'heroes',
    text: 'Polar Captain\'s Ascends run a summoner track: the 1-star gives tides a chance to summon tentacles when they hit, the 2-star widens Tide\'s attack range and adds final DMG +20%, the 3-star increases Tide\'s fire rate, and the 4-star (MAX) Ascend has Voracious Wave summon a swarm of deep-sea tentacles.',
  },
  {
    key: 'hero-polar-captain-passive',
    category: 'heroes',
    text: 'Polar Captain\'s Passive, Soul Pact, triggers when an allied hero dies while he is on the field: it summons a giant tentacle that deals massive damage — 1 tentacle at Lv.1, 2 at Lv.2, and 3 at Lv.3.',
  },
  {
    key: 'hero-polar-captain-chain',
    category: 'heroes',
    text: 'Polar Captain\'s Chain Skill, Icebound Abyss, requires both Polar Captain and Ice Queen deployed; the summoned units from Tide can then Freeze enemies.',
  },
  {
    key: 'hero-polar-captain-synergy-death',
    category: 'strategy',
    text: 'Polar Captain is a death-payoff hero: Soul Pact turns allied deaths into up to 3 giant tentacles, so his output grows as the team loses members. That makes him a back-line anchor for long attrition fights rather than a burst comp, and his chain partner Ice Queen fits the same Frost core.',
  },
  {
    key: 'hero-polar-captain-synergy-summons',
    category: 'strategy',
    text: 'Polar Captain is also a summon source — tentacles arrive as a chance proc from his 1-star Ascend and as a full swarm at MAX — so he feeds Northern Tyrant\'s Wolf Fury and Bitter Frigidity package, which scale with allied summoned units.',
  },
  {
    key: 'hero-polar-captain-skins',
    category: 'gear',
    text: 'Polar Captain\'s non-levelable skins each give all deployed heroes ATK% +1%, HP% +1%, DEF% +1%: Grand Admiral (Legendary, no skin skill) and Argent Polar Captain (Mythic, from the Event Market exchange, which unlocks a skin skill). His Default skin carries no bonus.',
  },
  {
    key: 'hero-robot-identity',
    category: 'heroes',
    text: 'Robot (in-game name Fystron) is a Mythic Electric Fighter and a machine with no gender — refer to it as "it" or by name. It is a standard Mythic, not an S-tier Mythic.',
  },
  {
    key: 'hero-robot-main-skill',
    category: 'heroes',
    text: 'Robot\'s Main Skill, Volt Fist, charges at enemies and releases an electrified punch.',
  },
  {
    key: 'hero-robot-ascends',
    category: 'heroes',
    text: 'Robot\'s Ascends: the 1-star makes each punch release 1 bouncing charge, the 2-star increases Volt Fist\'s cast speed, the 3-star raises it to 2 bouncing charges per punch, and the 4-star (MAX) Ascend makes Potent Fist cast multiple times.',
  },
  {
    key: 'hero-robot-passive',
    category: 'heroes',
    text: 'Robot\'s Passive, Enfeeble Aura, is an enemy-facing debuff rather than an ally buff: while Robot is deployed, enemy ATK is reduced by 4% at Lv.1, 12% at Lv.2, and 27% at Lv.3.',
  },
  {
    key: 'hero-robot-chain',
    category: 'heroes',
    text: 'Robot\'s Chain Skill, Lightning Orb, requires both Robot and Thunder Pharaoh deployed; hits from Thunder Pharaoh\'s Pulse Laser and Robot\'s Volt Fist then generate Lightning Orbs. The pair is reciprocal — Thunder Pharaoh\'s chain bubble names Robot back.',
  },
  {
    key: 'hero-robot-synergy',
    category: 'strategy',
    text: 'Robot is a defensive/utility anchor rather than a buffer: Enfeeble Aura cuts enemy ATK by up to 27%, a survivability multiplier for the whole comp that stacks alongside the ally-buff and RES-shred auras rather than overlapping them. Its Ascend line is entirely selfish, so Robot\'s team contribution comes from that passive.',
  },
  {
    key: 'hero-robot-skins',
    category: 'gear',
    text: 'Robot\'s one unlockable skin is Argent Robot (Mythic, from the Event Market exchange): it gives all deployed heroes ATK% +1%, HP% +1%, DEF% +1% and unlocks a skin skill once obtained. Robot\'s Default skin carries no bonus.',
  },
  {
    key: 'hero-rogue-fire-mage-identity',
    category: 'heroes',
    text: 'Rogue Fire Mage (in-game name "Ryan") is a Common-rarity Fire-element Mage, a male figure with brown bowl-cut hair and a plain red robe, tossing a small fireball. As a Common he has no star tier.',
  },
  {
    key: 'hero-rogue-fire-mage-main-skill',
    category: 'heroes',
    text: 'Rogue Fire Mage\'s Main Skill, Bouncing Fireball, throws mysterious fireballs at the enemy. It is his only skill — Common heroes have nothing beyond the Main Skill.',
  },
  {
    key: 'hero-rogue-fire-mage-archetype-ladder',
    category: 'strategy',
    text: 'The Fire/Mage archetype recurs at four rarities with escalating names: Rogue Fire Mage (Common), Fire Apprentice (Epic), Fire Mage (Legendary), and Phoenix Dancer / Draconic Empress (Mythic). The naming escalates with the tier, but the kits do not carry over - Fire Mage\'s main skill is a boulder attack, Phoenix Dancer summons Hatchlings and Draconic Empress summons a Wyrmling.',
  },
  {
    key: 'hero-scarlet-reaper-identity',
    category: 'heroes',
    text: 'Scarlet Reaper (in-game name Promethea) is a Mythic-rarity Fire element Ranger, female, and is not one of the S-tier Mythics.',
  },
  {
    key: 'hero-scarlet-reaper-main-skill',
    category: 'heroes',
    text: 'Scarlet Reaper\'s Main Skill is Soulflare Blade: she unleashes a slash that severs enemies\' souls.',
  },
  {
    key: 'hero-scarlet-reaper-ascend',
    category: 'heroes',
    text: 'Scarlet Reaper\'s Ascend upgrades: 1-star increases Soulflare Blade DMG, 2-star gives Soulflare Blade ATK Count +3, 3-star restores 50% of her Max HP once per battle when she drops below 50% HP, and the max 4-star tier grants CRIT DMG +20%, raised to +50% instead while her HP is above 50%.',
  },
  {
    key: 'hero-scarlet-reaper-passive',
    category: 'heroes',
    text: 'Scarlet Reaper\'s Passive, Hellfire Rage, is self-only: while her HP is above 50% her DMG increases by 10% at Lv.1, 30% at Lv.2 and 50% at Lv.3.',
  },
  {
    key: 'hero-scarlet-reaper-chain',
    category: 'heroes',
    text: 'Scarlet Reaper\'s Chain Skill, Evil Cleaver, requires Scarlet Reaper and Fiery Vanguard both deployed: her Soulflare Blade then also casts Evil Cleaver around her.',
  },
  {
    key: 'hero-scarlet-reaper-synergy',
    category: 'strategy',
    text: 'Scarlet Reaper\'s entire kit keys off staying above 50% HP - Hellfire Rage DMG, her max-tier CRIT DMG bonus and her 3-star self-heal all sit on that threshold - so play her as a pure damage seat behind healing and damage mitigation (Cheffy\'s repeating team heal, Archon Armor\'s team DMG Reduction and ally Invincibility window, Panda Brewmaster\'s Dodge window). Phoenix Dancer\'s Chain Skill also names her as its partner.',
  },
  {
    key: 'hero-scarlet-reaper-skins',
    category: 'gear',
    text: 'Scarlet Reaper\'s skins give flat bonuses to all deployed heroes: Neo Reaper (Legendary, Pyrocalypse Twin event) +1% ATK/HP/DEF, Bloody Verdict (Legendary, Mid-Autumn Gala event) +2% ATK/HP/DEF, Ragin Gemini (Legendary, Halloween Marvels event) +2% ATK/HP/DEF, and Argent Scarlet Reaper (Mythic, Event Market exchange) +1%. Her default skin gives no bonus.',
  },
  {
    key: 'hero-seraph-identity',
    category: 'heroes',
    text: 'Seraph (in-game name Rhea) is a Legendary-rarity hero in Wittle Defender: Electric element, Support role, female, a winged angel with a gold halo and visor and teal wings.',
  },
  {
    key: 'hero-seraph-main-skill',
    category: 'heroes',
    text: 'Seraph\'s Main Skill, Thunderfall, calls down lightning to strike random enemies, and each bolt has a chance to heal allies.',
  },
  {
    key: 'hero-seraph-healing-scaling',
    category: 'heroes',
    text: 'Seraph\'s healing scales with her ATK rather than HP or a dedicated healing stat, so ATK buffs meant for damage - Levin Archangel\'s Valor Infusion, Battle Assistance - also increase how much she heals.',
  },
  {
    key: 'hero-seraph-ascend',
    category: 'heroes',
    text: 'Seraph\'s four Thunderfall Ascend upgrades are: Star - healing rate increases and thunderbolt damage greatly boosted; Moon - Thunderbolt Count +1; Diamond - her Conductive current is larger and deals more DMG; Max - Thunderbolt Count +1 again. Her Diamond Ascend upgrades her Chain Skill, not her main skill.',
  },
  {
    key: 'hero-seraph-assistance',
    category: 'heroes',
    text: 'Seraph\'s Talent ladder grants Battle Assistance while she is deployed: all allies gain ATK +3% and Max HP +3% at 5 stars, +8% at 5 moons, and +15% at 5 diamonds.',
  },
  {
    key: 'hero-seraph-passive',
    category: 'heroes',
    text: 'Seraph\'s passive Sacred Power increases her own healing by 10% at Lv.1, 35% at Lv.2 and 70% at Lv.3.',
  },
  {
    key: 'hero-seraph-chain',
    category: 'heroes',
    text: 'Seraph\'s Chain Skill, Conductive, requires Seraph and High Priest both deployed: casting Thunderfall or Spinning Orb triggers Conductive.',
  },
  {
    key: 'hero-seraph-synergy',
    category: 'strategy',
    text: 'Seraph is the cheap healer slot: her healing rides on a damage skill so she is never a dead deployment, her Ascends double thunderbolt count, and Sacred Power takes her healing to +70%. Pair her with High Priest for the Conductive chain - her Diamond Ascend upgrades that chain - and use her to cover self-damaging carries like Demon Spawn and Draconic Empress.',
  },
  {
    key: 'hero-seraph-skins',
    category: 'gear',
    text: 'Seraph\'s Ripple Melody skin (Legendary, from a limited-time event) is non-levelable: unlocking it gives all deployed heroes ATK% +2%, HP% +2%, DEF% +2% and Healing Bonus +2%, and equipping it grants the skill Summer Cheers - every 20s, increase team ATK by 2% for 5s (cannot stack). Her default Seraph skin carries no bonus.',
  },
  {
    key: 'hero-starlight-weaver-identity',
    category: 'heroes',
    text: 'Starlight Weaver (name: Stella) is a female Sublime hero with the Xenoscape element and the Support role.',
  },
  {
    key: 'hero-starlight-weaver-main-skill',
    category: 'heroes',
    text: 'Starlight Weaver\'s Main Skill, Starlit Fall, summons a comet to bombard enemies and designates the hero with the highest attack power as the Proxy, charging that Proxy\'s Exclusive Weapon Energy by 6 points every 5 seconds.',
  },
  {
    key: 'hero-starlight-weaver-ascend-1-2',
    category: 'heroes',
    text: 'Starlight Weaver Ascend tiers 1-2: the star Ascend increases comet damage and raises the Proxy\'s Exclusive Weapon Energy recovery to 16 points; the moon Ascend increases comet damage again and increases the Proxy\'s damage by 15%.',
  },
  {
    key: 'hero-starlight-weaver-ascend-3-4',
    category: 'heroes',
    text: 'Starlight Weaver Ascend tiers 3-4: the diamond Ascend increases comet damage and makes her charge the entire team by 8 Exclusive Weapon Energy whenever she charges the Proxy; the final Ascend increases comet damage again and raises the Proxy\'s damage bonus to 30%.',
  },
  {
    key: 'hero-starlight-weaver-passive',
    category: 'heroes',
    text: 'Starlight Weaver\'s Passive, Astrology, increases the entire team\'s damage and additionally increases Exclusive Weapon damage: +10%/+10% at Lv.1, +20%/+20% at Lv.2, and +30%/+30% at Lv.3.',
  },
  {
    key: 'hero-starlight-weaver-xenoscape',
    category: 'heroes',
    text: 'Starlight Weaver\'s Xenoscape skill, Nebular Enigma, permanently increases allied heroes\' EX-Weapon DMG by 1% for the rest of the battle every time any hero levels up.',
  },
  {
    key: 'hero-starlight-weaver-chain',
    category: 'heroes',
    text: 'Starlight Weaver has no Chain Skill — her fourth skill slot is the Xenoscape skill Nebular Enigma.',
  },
  {
    key: 'hero-starlight-weaver-synergy',
    category: 'strategy',
    text: 'Starlight Weaver is the Exclusive Weapon enabler — build her around a carry whose EX-Weapon is the win condition. Her Main Skill feeds EX-Weapon Energy to the highest-ATK ally, her Passive raises both team damage and EX-Weapon damage, and her Xenoscape stacks EX-Weapon DMG as heroes level.',
  },
  {
    key: 'hero-sword-saint-identity',
    category: 'heroes',
    text: 'Sword Saint (in-game name Lark) is a Mythic-rarity Wind element Mage, female, and is not one of the S-tier Mythics.',
  },
  {
    key: 'hero-sword-saint-main-skill',
    category: 'heroes',
    text: 'Sword Saint\'s Main Skill is Flying Sword: she summons multiple Flying Swords that automatically attack enemies.',
  },
  {
    key: 'hero-sword-saint-ascend',
    category: 'heroes',
    text: 'Sword Saint\'s Ascend upgrades all scale her sword count: 1-star gives Flying Sword count +2, 2-star summons 1 extra Flying Sword every 3s, 3-star makes the Gladius Divinus giant sword summon 3 extra Flying Swords when it ends, and the max 4-star tier makes that giant sword larger and higher-damage.',
  },
  {
    key: 'hero-sword-saint-passive',
    category: 'heroes',
    text: 'Sword Saint\'s Passive, Crit Hit Aura, is team-wide while she is deployed: Team CRIT Rate +5% at Lv.1, +15% at Lv.2 and +30% at Lv.3.',
  },
  {
    key: 'hero-sword-saint-chain',
    category: 'heroes',
    text: 'Sword Saint\'s Chain Skill, Blade Tempest, requires Sword Saint and Night Baron both deployed: casting Flying Sword then also summons falling Flying Swords.',
  },
  {
    key: 'hero-sword-saint-synergy',
    category: 'strategy',
    text: 'Sword Saint is a team CRIT Rate battery at up to +30%, and CRIT Rate multiplies with CRIT DMG, so she is a strong partner for CRIT DMG stackers such as Fabled Lyra and Panda Brewmaster. Phoenix Dancer\'s diamond Ascend is the roster\'s other team CRIT Rate source. Sword Saint\'s own Ascend line is entirely self-focused, so all of her team value comes from the Crit Hit Aura passive.',
  },
  {
    key: 'hero-sword-saint-skins',
    category: 'gear',
    text: 'Sword Saint\'s flat skin bonuses to all deployed heroes: Veiled Sword Saint (Legendary) +1% ATK/HP/DEF; Wave Breaker (Legendary, event) +2% ATK/HP/DEF and 2% Skill CD reduction, plus the Summer Cheers skill (every 20s, team ATK +2% for 5s, no stacking); Argent Sword Saint (Mythic, Event Market) +1% plus Silver Oath (Chain Skill active by default). Her default skin gives no bonus.',
  },
  {
    key: 'hero-swordmaster-identity',
    category: 'heroes',
    text: 'Swordmaster (in-game name Miyamoto) is a Mythic-rarity Wind element Fighter, male, styled as a katana-wielding samurai, and is not one of the S-tier Mythics.',
  },
  {
    key: 'hero-swordmaster-main-skill',
    category: 'heroes',
    text: 'Swordmaster\'s Main Skill is Whirlwind Slash: he teleports to a random enemy and delivers a wide area-of-effect attack.',
  },
  {
    key: 'hero-swordmaster-ascend',
    category: 'heroes',
    text: 'Swordmaster\'s Ascend upgrades escalate one mechanic, Storm Slash: 1-star makes Whirlwind Slash open with a Storm Slash, 2-star makes Storm Slash pull enemies in, 3-star makes Storm Slash always crit, and the max 4-star tier makes Blade Storm\'s blade winds auto-tracking.',
  },
  {
    key: 'hero-swordmaster-passive',
    category: 'heroes',
    text: 'Swordmaster\'s Passive, Ironclad Aura, is team-wide while he is deployed: Team DEF +4% at Lv.1, +12% at Lv.2 and +27% at Lv.3.',
  },
  {
    key: 'hero-swordmaster-chain',
    category: 'heroes',
    text: 'Swordmaster\'s Chain Skill, Wind Blade, requires Swordmaster and Night Baron both deployed: Whirlwind Slash and Thrust then continuously spawn Wind Blades. Night Baron\'s own chain bubble names the same skill and partner, so fielding the pair switches on both.',
  },
  {
    key: 'hero-swordmaster-synergy',
    category: 'strategy',
    text: 'Swordmaster is the durability slot in an otherwise offensive Wind package - Ironclad Aura buffs Team DEF instead of damage - and his 3-star "Storm Slash always crits" converts team CRIT DMG buffs into guaranteed damage on his opener. Pair him with Night Baron, since they share the Wind Blade chain in both directions.',
  },
  {
    key: 'hero-swordmaster-skins',
    category: 'gear',
    text: 'Swordmaster\'s only bonus-granting skin is Argent Swordmaster (Mythic, from the Event Market exchange): all deployed heroes get +1% ATK, +1% HP and +1% DEF, and it carries the Silver Oath skill, which keeps Swordmaster\'s Chain Skill active by default. His default skin carries no bonus.',
  },
  {
    key: 'hero-thunder-pharaoh-identity',
    category: 'heroes',
    text: 'Thunder Pharaoh (in-game name Osyle) is a Mythic-rarity Electric element Mage presented as a male mummy-pharaoh in a nemes headdress with a gold staff, and is not one of the S-tier Mythics.',
  },
  {
    key: 'hero-thunder-pharaoh-main-skill',
    category: 'heroes',
    text: 'Thunder Pharaoh\'s Main Skill is Pulse Laser: it deals continuous damage to enemies in a line.',
  },
  {
    key: 'hero-thunder-pharaoh-ascend',
    category: 'heroes',
    text: 'Thunder Pharaoh\'s Ascend upgrades stack multipliers on his basic-laser barrage: 1-star makes him continuously fire basic lasers in random directions, 2-star gives Laser CD -20%, 3-star triples basic laser count, and the max 4-star tier gives Basic Laser Final DMG +400%.',
  },
  {
    key: 'hero-thunder-pharaoh-passive',
    category: 'heroes',
    text: 'Thunder Pharaoh\'s Passive, Electro Break Aura, is an always-on enemy debuff while he is deployed: enemy Electro RES -4% at Lv.1, -12% at Lv.2 and -27% at Lv.3.',
  },
  {
    key: 'hero-thunder-pharaoh-chain',
    category: 'heroes',
    text: 'Thunder Pharaoh\'s Chain Skill, Lightning Orb, requires Thunder Pharaoh and Robot both deployed: hits from Pulse Laser and Volt Fist then generate Lightning Orbs.',
  },
  {
    key: 'hero-thunder-pharaoh-synergy',
    category: 'strategy',
    text: 'Thunder Pharaoh supplies an Electro RES shred as an always-on passive aura, up to -27%, needing no cast and no condition. Levin Archangel\'s moon Ascend shreds another 15% but only on hit, and Valkyrie\'s Dominance is a second always-on aura at up to -30%. Stack him with God Ruler\'s Storm Fury Aura (team Electro DMG) to get both halves of the multiplier, and field him beside Robot so the Lightning Orb chain comes free.',
  },
  {
    key: 'hero-thunder-pharaoh-skins',
    category: 'gear',
    text: 'Thunder Pharaoh has two flat skin bonuses: Argent Thunder Pharaoh (Mythic, Event Market exchange) gives all deployed heroes +1% ATK/HP/DEF and carries Silver Oath, keeping his Chain Skill active by default; Enigmatic Jackal (Legendary, Halloween Marvels event) gives all deployed heroes +2% ATK/HP/DEF. His default skin has no bonus.',
  },
  {
    key: 'hero-unyielding-lancer-identity',
    category: 'heroes',
    text: 'Unyielding Lancer (in-game name "Lenn") is a Common-rarity Wind-element Fighter, a male stubby knight in a grey full helm with a blue plume, carrying a short spear. As a Common he has no star tier.',
  },
  {
    key: 'hero-unyielding-lancer-main-skill',
    category: 'heroes',
    text: 'Unyielding Lancer\'s Main Skill, Basic Thrust, is described in-game as "an ordinary charging thrust" — the game itself flags how unremarkable the Common tier is. It is his only skill.',
  },
  {
    key: 'hero-valkyrie-identity',
    category: 'heroes',
    text: 'Valkyrie (in-game name Thrud) is a Mythic-rarity Electric element Fighter, female, and is not one of the S-tier Mythics.',
  },
  {
    key: 'hero-valkyrie-main-skill',
    category: 'heroes',
    text: 'Valkyrie\'s Main Skill is Tempest Onslaught: she approaches enemies and unleashes greatsword slashes for area damage, attacking 2 times. During the skill she gains [Unyielding], which prevents her from dying when she takes lethal damage.',
  },
  {
    key: 'hero-valkyrie-ascend',
    category: 'heroes',
    text: 'Valkyrie\'s Ascend upgrades: 1-star makes each Tempest Onslaught attack stack +4% of her own Electro DMG bonus (the stack resets before the next cast), 2-star gives Tempest Onslaught DMG +100%, 3-star raises the stack to +8% per hit, and the max 4-star tier gives ATK Count +3 plus another +3 for the first three Tempest Onslaughts of a battle.',
  },
  {
    key: 'hero-valkyrie-passive',
    category: 'heroes',
    text: 'Valkyrie\'s Passive, Valkyrie\'s Dominance, is an enemy debuff active while she is deployed: all enemies get Electro RES -10% at Lv.1, -20% at Lv.2 and -30% at Lv.3.',
  },
  {
    key: 'hero-valkyrie-chain',
    category: 'heroes',
    text: 'Valkyrie\'s Chain Skill, War blessing, requires Valkyrie and God Ruler both deployed: while her own HP is below 15%, Tempest Onslaught always CRITs until the main skill ends.',
  },
  {
    key: 'hero-valkyrie-heavy-strike-combo',
    category: 'strategy',
    text: 'Valkyrie\'s Winter Arbiter skin skill Heavy Strike (Self CRIT DMG +10%) is designed around her War blessing chain skill: below 15% HP Tempest Onslaught always CRITs, so in that window the extra CRIT DMG is a pure multiplier rather than a chance-based gain.',
  },
  {
    key: 'hero-valkyrie-synergy',
    category: 'strategy',
    text: 'Valkyrie does not buff allies - she strips up to 30% Electro RES from every enemy, which multiplies the damage of every Electric attacker on the team. Her chain partner God Ruler is Electric as well, and she pairs naturally with Levin Archangel, so she is best built into a dedicated Electric composition.',
  },
  {
    key: 'hero-valkyrie-skins',
    category: 'gear',
    text: 'Valkyrie\'s skins give flat bonuses to all deployed heroes: Sacred Manifest (Legendary, Citadel Prologue event) +1% ATK/HP/DEF; Winter Arbiter (Legendary, Frost Festival event) +2% ATK/HP/DEF plus the Heavy Strike skill (Self CRIT DMG +10%); Argent Valkyrie (Mythic, Event Market) +1% plus Silver Oath (her Chain Skill active by default). Her default skin gives no bonus.',
  },
  {
    key: 'hero-windborne-ranger-identity',
    category: 'heroes',
    text: 'Windborne Ranger (in-game name Aeralyn) is a Mythic-rarity Wind element Ranger, female, and is not one of the S-tier Mythics.',
  },
  {
    key: 'hero-windborne-ranger-main-skill',
    category: 'heroes',
    text: 'Windborne Ranger\'s Main Skill is Piercing Shot: she continuously releases 2 precise piercing arrows from long range.',
  },
  {
    key: 'hero-windborne-ranger-ascend',
    category: 'heroes',
    text: 'Windborne Ranger\'s Ascend upgrades all feed her [Gale Force] state: 1-star grants it after every 12 arrow CRITs, so each piercing arrow fires 2 extra Gale Arrows for 6s; 2-star adds +20% own Dodge Rate and a shorter fire interval; 3-star adds +80% own CRIT DMG; and the max 4-star tier extends Gale Force to 10s and raises Piercing Shot DMG.',
  },
  {
    key: 'hero-windborne-ranger-passive',
    category: 'heroes',
    text: 'Windborne Ranger\'s Passive, Gale Force, is a team-wide element aura: Team Wind DMG +10% at Lv.1, +20% at Lv.2 and +30% at Lv.3.',
  },
  {
    key: 'hero-windborne-ranger-gale-force-naming',
    category: 'heroes',
    text: 'Windborne Ranger has two different things called Gale Force: her Passive is a permanent team-wide Wind DMG aura, while [Gale Force] in her Talent line is a temporary self-buff state triggered by landing 12 arrow CRITs. They are separate effects and should not be confused.',
  },
  {
    key: 'hero-windborne-ranger-chain',
    category: 'heroes',
    text: 'Windborne Ranger\'s Chain Skill, Zephyr Grace, requires Windborne Ranger and Fabled Lyra both deployed: each time Dodge is triggered she gains a 10% DMG bonus for 10s (cannot stack).',
  },
  {
    key: 'hero-windborne-ranger-synergy',
    category: 'strategy',
    text: 'Windborne Ranger is a self-scaling Ranger whose single team line is Wind DMG +10/20/30%. Her Gale Force state is CRIT-gated, so she scales hard with CRIT support like Fabled Lyra and Panda Brewmaster, and Panda Brewmaster\'s team Dodge window feeds her Zephyr Grace dodge trigger. Lyra is also her chain partner, making the three a natural Wind core.',
  },
  {
    key: 'hero-windborne-ranger-skins',
    category: 'gear',
    text: 'Windborne Ranger\'s skins give flat bonuses to all deployed heroes: Aerial Hunter (Legendary, Wind\'s Prelude event) +1% ATK/HP/DEF, Snowborne Sprite (Legendary, Frost Festival event) +2% ATK/HP/DEF, and Argent Windborne Ranger (Mythic, Event Market exchange) +1% ATK/HP/DEF. Her default skin carries no bonus at all.',
  },

  // ── Explicit knowledge gaps ─────────────────────────────────────────────
  // Seeded deliberately: on the first live test the AI invented an EX-Weapon
  // name ("Frostbite") for a hero. Stating the gap out loud is more reliable
  // than hoping the model stays silent about it.
  {
    key: 'gap-ex-weapons',
    category: 'general',
    text: 'Tempest AI now has verified EX-Weapon data for all 26 Mythic and Sublime heroes — names, their activation skill, and their upgrade ladders. It does NOT have EX-Weapon data for Legendary, Epic or Common heroes, and does not know the enhancement material names.',
  },
  {
    key: 'gap-runes-treasures-pantheon',
    category: 'general',
    text: 'Tempest AI has no data yet on sigils, gear, emblems or the pantheon system in Wittle Defender. It knows they exist — Sigil, Gear, Rune, Emblem and Pantheon are buttons on every hero page — but nothing about their contents. Say so and invite /fact add rather than guessing. Treasure/rune coverage is a separate and partial story: see the Treasure facts and their coverage caveat.',
  },
  {
    key: 'gap-meta-and-tier-lists',
    category: 'general',
    text: 'Tempest AI has no data on the current competitive meta, patch notes, or any official tier list for Wittle Defender. It can compare heroes using their captured skills and team buffs, but it should not claim to know what is strongest in the current patch.',
  },

  // ── Habby's official Recommended lineups (in-game team comps) ──
  {
    key: 'lineup-recommended-screen-source',
    category: 'strategy',
    text: 'Wittle Defender has an official Recommended lineups screen: on the Hero screen, tap the blue Recommended button next to Deployed Hero. It lists 13 team cards of five heroes each, filtered by Ice-themed, Electro, Wind, Fire, Xenoscape or All, and each card\'s Details button expands Habby\'s own Lineup Core, Feature and Recommendation text. These are Habby\'s official recommendations, not community tier lists, and any member can check them in game.',
  },
  {
    key: 'lineup-tiers-explained',
    category: 'strategy',
    text: 'Habby\'s recommended lineups in Wittle Defender come in three tiers per element. Basic is the early-game version and leans on Legendary heroes, Advanced upgrades the supporting cast to Mythics, and Top is the aspirational endgame comp that loads S-rank Mythics and ignores element purity. Wind, Fire, Ice and Electro each have all three tiers; Xenoscape has only a single Top lineup.',
  },
  {
    key: 'lineup-xenoscape-top',
    category: 'strategy',
    text: 'Habby\'s only official Xenoscape lineup in Wittle Defender is the card titled New Xenoscape Hero - Top Xenoscape Lineup. Its Lineup Core is Void Witch, and the five slots are Void Witch, Sun Wukong (whose hero page is titled Monkey King), Peacekeeper, Starlight Weaver and Elemental Invoker. Xenoscape is the one element with no Advanced or Basic tier, so this comp has no cheaper stepping stone.',
  },
  {
    key: 'lineup-xenoscape-top-why',
    category: 'strategy',
    text: 'The Top Xenoscape Lineup\'s stated Feature is extremely high DMG scaling and massive DPS in all environments. Habby\'s reasoning: Sun Wukong brings both high Dodge and burst DMG, Peacekeeper can share DMG and provide tons of shields, Starlight Weaver provides EX-Weapon Energy and EX-Weapon DMG bonus, and Elemental Invoker provides damage amplifications across all dimensions, which the game says makes it the strongest Xenoscape lineup so far.',
  },
  {
    key: 'lineup-wind-top',
    category: 'strategy',
    text: 'The Top Wind Lineup is Habby\'s aspirational endgame Wind comp in Wittle Defender, above the Wind Advanced and Wind Basic tiers. Its Lineup Core is Windborne Ranger, and the five slots are Windborne Ranger, Starlight Weaver, Levin Archangel, Fabled Lyra and Panda Brewmaster. Only three of the five are actually Wind heroes: Starlight Weaver is Xenoscape and Levin Archangel is Electro.',
  },
  {
    key: 'lineup-wind-top-why',
    category: 'strategy',
    text: 'The Top Wind Lineup\'s Feature is that Windborne Ranger enters Gale Force after enough CRITs, gaining high DMG and Dodge bonuses. Habby\'s reasoning: Starlight Weaver provides EX-Weapon Energy and EX-Weapon DMG bonus, Levin Archangel greatly boosts the main DPS in both offense and survival, Fabled Lyra provides multiple stat bonuses, and Panda Brewmaster strengthens survival and DMG - the game calls it the goat Wind lineup so far.',
  },
  {
    key: 'lineup-wind-advanced',
    category: 'strategy',
    text: 'The Wind Advanced Lineup is the mid-game step between Wind Basic and Top Wind in Wittle Defender. Its Lineup Core is Sword Saint, and the five slots are Sword Saint, Void Witch, Blazing Archer, Cheffy and Demon Hunter. It shares its core and Feature text with Wind Basic and differs only in the four supporting heroes.',
  },
  {
    key: 'lineup-wind-advanced-why',
    category: 'strategy',
    text: 'The Wind Advanced Lineup\'s Feature is ideal AoE and single-target DPS with no DMG overflow. Habby\'s reasoning: Void Witch provides Mage DMG Bonus for Sword Saint, Blazing Archer grants CRIT DMG bonus, and Demon Hunter increases Wind hero DMG; those three provide strong DMG bonuses, and with the ample healing from Cheffy it is a powerful and stable Wind formation.',
  },
  {
    key: 'lineup-wind-basic',
    category: 'strategy',
    text: 'The Wind Basic Lineup is Habby\'s early-game Wind comp in Wittle Defender, the entry tier below Wind Advanced and Top Wind. Its Lineup Core is Sword Saint - the same core as Wind Advanced - and the five slots are Sword Saint, Night Baron, Demon Hunter, Cat Assassin and Seraph. Four of the five are Wind heroes; only the healer Seraph is off-element.',
  },
  {
    key: 'lineup-wind-basic-why',
    category: 'strategy',
    text: 'The Wind Basic Lineup\'s Feature is ideal AoE and single-target DPS with no DMG overflow, the same line as Wind Advanced. Habby\'s reasoning: Demon Hunter increases Wind hero DMG, Cat Assassin lowers enemies\' resistance, Night Baron delivers high-rate single-target DPS and Seraph offers healing, and the game says this team smoothly transitions through the beginner phase.',
  },
  {
    key: 'lineup-fire-top',
    category: 'strategy',
    text: 'The Top Fire Lineup is Habby\'s aspirational endgame Fire comp in Wittle Defender, above Fire Advanced and Fire Basic. Its Lineup Core is the hero the card calls Draco Queen, whose own hero page reads Draconic Empress (Drakaina). The five slots are Draconic Empress, Starlight Weaver, Phoenix Dancer, Levin Archangel and Panda Brewmaster - only two of them are actually Fire heroes.',
  },
  {
    key: 'lineup-fire-top-why',
    category: 'strategy',
    text: 'The Top Fire Lineup\'s Feature is that its core boasts massive personal DMG, significantly buffs Fire-element heroes, and can pinpoint the enemy\'s main DPS. Habby\'s reasoning: Starlight Weaver provides EX-Weapon Energy and EX-Weapon DMG bonus, Phoenix Dancer provides high CRIT Rate while dealing massive DMG, Levin Archangel boosts the main DPS in offense and survival, and Panda Brewmaster strengthens survival and DPS for easy stage clearing.',
  },
  {
    key: 'lineup-fire-advanced',
    category: 'strategy',
    text: 'The Fire Advanced Lineup is the mid-game step between Fire Basic and Top Fire in Wittle Defender. Its Lineup Core is Demon Spawn, and the five slots are Demon Spawn, Fiery Vanguard, Sword Saint, Blazing Archer and Cheffy. It shares its core and Feature text with Fire Basic, and its last three slots are the same Sword Saint, Blazing Archer and Cheffy shell every Advanced lineup uses.',
  },
  {
    key: 'lineup-fire-advanced-why',
    category: 'strategy',
    text: 'The Fire Advanced Lineup\'s Feature is a berserker bloodline that greatly increases ATK when HP drops below a threshold. Habby\'s reasoning: Fiery Vanguard boosts Fire DMG, Sword Saint offers CRIT Rate bonus and Blazing Archer grants CRIT DMG bonus; those three provide strong DMG bonuses, and with the ample healing from Cheffy the formation easily clears battles with high BP (Battle Power).',
  },
  {
    key: 'lineup-fire-basic',
    category: 'strategy',
    text: 'The Fire Basic Lineup is Habby\'s early-game Fire comp in Wittle Defender, the entry tier below Fire Advanced and Top Fire. Its Lineup Core is Demon Spawn - the same core as Fire Advanced - and the five slots are Demon Spawn, Blazing Archer, Fire Mage, Fire Witch and Seraph. Four of the five are Fire heroes; only the healer Seraph is off-element.',
  },
  {
    key: 'lineup-fire-basic-why',
    category: 'strategy',
    text: 'The Fire Basic Lineup\'s Feature is a berserker bloodline that greatly increases ATK when HP drops below a threshold, the same line as Fire Advanced. Habby\'s reasoning: Blazing Archer grants CRIT DMG bonus, Fire Mage lowers enemies\' Fire Resistance, Fire Witch increases team HP and Seraph offers healing, making what the game calls a strong Fire squad with a high DMG ceiling.',
  },
  {
    key: 'lineup-ice-top',
    category: 'strategy',
    text: 'The Top Ice Lineup is Habby\'s aspirational endgame comp for the Frost element in Wittle Defender (the lineup filter calls it Ice-themed and the cards call it Ice). Its Lineup Core is Northern Tyrant, and the five slots are Northern Tyrant, Starlight Weaver, Polar Captain, Frost Lich and Levin Archangel. It sits above the Ice Advanced and Ice Basic tiers.',
  },
  {
    key: 'lineup-ice-top-why',
    category: 'strategy',
    text: 'The Top Ice Lineup\'s Feature is that its core commands beasts, and more summons mean higher team DMG. Habby\'s reasoning: Starlight Weaver provides EX-Weapon Energy and EX-Weapon DMG bonus, Polar Captain summons tentacles for massive DMG, Frost Lich greatly increases summons\' DMG, and Levin Archangel boosts the main DPS in offense and survival, for what the game calls a high-burst Ice lineup. It is a summon comp built around three summoners.',
  },
  {
    key: 'lineup-ice-advanced',
    category: 'strategy',
    text: 'The Ice Advanced Lineup is the mid-game step between Ice Basic and Top Ice in Wittle Defender. Its Lineup Core is Polar Captain, and the five slots are Polar Captain, Ice Queen, Sword Saint, Blazing Archer and Cheffy. Only two of the five are Frost heroes, because slots three to five are the cross-element Sword Saint, Blazing Archer and Cheffy shell shared by every Advanced lineup.',
  },
  {
    key: 'lineup-ice-advanced-why',
    category: 'strategy',
    text: 'The Ice Advanced Lineup\'s Feature is that its core summons tentacles when allies fall and sacrifices them to deal burst DMG, particularly powerful in arena gameplay - the only Feature in the whole Recommended screen that names a game mode. Habby\'s reasoning: Ice Queen provides Ice DMG bonus, Sword Saint offers CRIT Rate bonus, Blazing Archer grants CRIT DMG bonus, and with the ample healing from Cheffy it grows into a nuke-level Ice squad.',
  },
  {
    key: 'lineup-ice-basic',
    category: 'strategy',
    text: 'The Ice Basic Lineup is Habby\'s early-game Frost comp in Wittle Defender, the entry tier below Ice Advanced and Top Ice. Its Lineup Core is Polar Captain - the same core as Ice Advanced - and the five slots are Polar Captain, Ice Queen, Ice Witch, Ice Mage and Seraph. Four of the five are Frost heroes; only the healer Seraph is off-element.',
  },
  {
    key: 'lineup-ice-basic-why',
    category: 'strategy',
    text: 'The Ice Basic Lineup\'s Feature is that its core summons tentacles when allies fall and sacrifices them to deal burst DMG, particularly powerful in arena gameplay. Habby\'s reasoning: Ice Queen provides Ice DMG bonus, Ice Witch lowers enemies\' Ice Resistance, Ice Mage freezes enemies and Seraph grants healing, which the game calls a well-rounded offense and defense team.',
  },
  {
    key: 'lineup-electro-top',
    category: 'strategy',
    text: 'Habby\'s aspirational endgame Electro comp in Wittle Defender is titled Top Thunder Lineup - the only card in the Recommended screen that uses the word Thunder, though it sits under the Electro filter. Its Lineup Core is Valkyrie, and the five slots are Valkyrie, Starlight Weaver, Levin Archangel, Panda Brewmaster and Archon Armor. It sits above the Electro Advanced and Electro Basic tiers.',
  },
  {
    key: 'lineup-electro-top-why',
    category: 'strategy',
    text: 'The Top Thunder Lineup\'s Feature is that its core is immune to death while casting skills and turns the tide with burst DMG. Habby\'s reasoning: Starlight Weaver provides EX-Weapon Energy and EX-Weapon DMG bonus, Levin Archangel greatly boosts the main DPS in both offense and survival, Panda Brewmaster strengthens survival and DPS, and Archon Armor provides absolute defense and high CRIT DMG - the game says this lineup excels in all battles.',
  },
  {
    key: 'lineup-electro-advanced',
    category: 'strategy',
    text: 'The Electro Advanced Lineup is the mid-game step between Electro Basic and Top Thunder in Wittle Defender. Its Lineup Core is God Ruler, and the five slots are God Ruler, Thunder Pharaoh, Sword Saint, Blazing Archer and Cheffy. It is literally the Electro Basic comp with slots three to five swapped for the shared Sword Saint, Blazing Archer and Cheffy buff shell.',
  },
  {
    key: 'lineup-electro-advanced-why',
    category: 'strategy',
    text: 'The Electro Advanced Lineup\'s Feature is extremely powerful AoE DMG for multiple scenarios. Habby\'s reasoning: Thunder Pharaoh lowers enemies\' resistance, Sword Saint offers CRIT Rate bonus and Blazing Archer grants CRIT DMG bonus, and with three strong buffs plus ample healing from Cheffy the squad delivers great DPS in all battles.',
  },
  {
    key: 'lineup-electro-basic',
    category: 'strategy',
    text: 'The Electro Basic Lineup is Habby\'s early-game Electro comp in Wittle Defender, the entry tier below Electro Advanced and Top Thunder. Its Lineup Core is God Ruler - the same core as Electro Advanced - and the five slots are God Ruler, Thunder Pharaoh, Robot, High Priest and Seraph. It is the only recommended lineup in the game whose five heroes all share one element.',
  },
  {
    key: 'lineup-electro-basic-why',
    category: 'strategy',
    text: 'The Electro Basic Lineup\'s Feature is extremely powerful AoE DMG for multiple scenarios, the same line as Electro Advanced. Habby\'s reasoning: Thunder Pharaoh lowers enemies\' resistance, Robot attacks pull in enemies, High Priest boosts team DPS and Seraph provides healing, and the game says this team smoothly transitions through the beginner phase.',
  },
  {
    key: 'lineup-basic-tier-template',
    category: 'strategy',
    text: 'Every Basic lineup Habby recommends in Wittle Defender follows one template: the element\'s core hero, three more heroes of that element, and Seraph (Rhea) in the last slot as the healer. It holds for the Wind, Fire, Ice and Electro Basic comps. Seraph is herself an Electro hero being lent to the other elements, which is why the Electro Basic comp ends up entirely Electro.',
  },
  {
    key: 'lineup-advanced-tier-template',
    category: 'strategy',
    text: 'Every Advanced lineup Habby recommends in Wittle Defender shares a fixed shell: the element\'s core, one same-element support, then Sword Saint (CRIT Rate bonus), Blazing Archer (CRIT DMG bonus) and Cheffy (healing). Fire, Ice and Electro Advanced use those three in the same last three slots, and Wind Advanced is the same shell with Sword Saint promoted to Lineup Core. Owning that trio gets you most of any element\'s Advanced comp.',
  },
  {
    key: 'lineup-top-tier-template',
    category: 'strategy',
    text: 'Every Top lineup Habby recommends in Wittle Defender shares a support shell: Starlight Weaver is the second slot of all five Top comps (Xenoscape, Wind, Fire, Ice and Thunder), always credited with EX-Weapon Energy and EX-Weapon DMG bonus, and Levin Archangel appears in four of the five for greatly boosting the main DPS in offense and survival. Top comps also stack S-rank Mythics and ignore element purity.',
  },
  {
    key: 'lineup-advanced-basic-share-core',
    category: 'strategy',
    text: 'Within each element on Wittle Defender\'s Recommended screen, the Advanced and Basic lineups share the same Lineup Core hero and the same Feature text and differ only in the four supporting heroes: Wind uses Sword Saint, Fire uses Demon Spawn, Ice uses Polar Captain and Electro uses God Ruler. A recommended lineup is therefore identified by its name, never by its core hero.',
  },
  {
    key: 'lineup-element-label-is-theme-not-roster',
    category: 'strategy',
    text: 'An element lineup in Wittle Defender does not mean five heroes of that element - the label describes the core and theme. Checked hero by hero from element badges: Top Fire, Ice Advanced and Electro Advanced are only two of five on-element, Top Wind, Top Ice and Top Thunder three of five, and the Basic comps four of five. Electro Basic is the single lineup in the whole menu that is fully mono-element.',
  },
  {
    key: 'lineup-text-name-aliases',
    category: 'heroes',
    text: 'Wittle Defender\'s recommended lineup text sometimes names a hero differently from that hero\'s own page. The Top Fire card calls its core Draco Queen, but the hero page reads Draconic Empress (Drakaina), and the Top Xenoscape card says Sun Wukong where the hero page title is Monkey King. Draco Queen is an alias for Draconic Empress, not a separate hero.',
  },
  {
    key: 'gap-lineup-heroes-not-captured',
    category: 'heroes',
    text: 'Three heroes named in Habby\'s recommended lineups are missing from Tempest AI\'s captured hero data: Void Witch (Celine), Peacekeeper (Karl) and Elemental Invoker (Omnis), all from the Top Xenoscape Lineup. They exist in the game and their identity is confirmed, but their skills, passives and Ascends have not been captured yet - say so rather than guessing at their kits.',
  },
  {
    key: 'hero-void-witch-identity',
    category: 'heroes',
    text: 'Void Witch (character name Celine) is a Xenoscape-element Mage in Wittle Defender and the Lineup Core of Habby\'s Top Xenoscape Lineup. She also appears in the Wind Advanced Lineup, where the card credits her with providing a Mage DMG Bonus for Sword Saint. Her skill kit has not been captured, so nothing else about her abilities is known yet.',
  },
  {
    key: 'hero-peacekeeper-identity',
    category: 'heroes',
    text: 'Peacekeeper (character name Karl) is a Xenoscape-element Fighter in Wittle Defender who appears in Habby\'s Top Xenoscape Lineup, where the card credits him with sharing DMG and providing tons of shields. His skill kit has not been captured, so nothing else about his abilities is known yet.',
  },
  {
    key: 'hero-elemental-invoker-identity',
    category: 'heroes',
    text: 'Elemental Invoker (character name Omnis) is a Xenoscape-element Support in Wittle Defender who appears in Habby\'s Top Xenoscape Lineup, where the card credits it with damage amplifications and powerful mechanisms across all dimensions. Its skill kit has not been captured, so nothing else about its abilities is known yet.',
  },

  // ── Hero level mechanic (Kyle) ──────────────────────────────────────────
  {
    key: 'hero-level-belongs-to-deployed-slot',
    category: 'heroes',
    text: 'In Wittle Defender a hero\'s LEVEL is not permanently tied to that hero — it belongs to your main deployed five. Heroes you own but have not deployed show as Level 1. If you swap a benched hero into your main five, the level transfers to them when equipped.',
  },
  {
    key: 'hero-level-swapping-is-free',
    category: 'strategy',
    text: 'Because hero level follows your main five rather than the individual hero, swapping heroes in and out of your Wittle Defender team costs you no level progress. You can rebuild toward a different recommended lineup without re-levelling from scratch, so experimenting with team compositions is cheap.',
  },
  {
    key: 'hero-level-vs-stars',
    category: 'strategy',
    text: 'Wittle Defender has two separate hero progressions and only one of them is per-hero: LEVEL follows your main deployed five and transfers when you swap, while STARS come from that specific hero\'s shards and stay with them permanently. So star investment is the one that locks you into a hero; level investment does not.',
  },

  // ── EX-Weapons and the three Xenoscape heroes ──
  {
    key: 'exweapon-what-it-is',
    category: 'gear',
    text: 'An EX-Weapon (Exclusive Weapon) in Wittle Defender is a separately named weapon belonging to one hero, opened from the hexagonal bubble at the bottom-left of that hero\'s page. It is not the hero\'s main skill: it teaches the hero one extra skill that casts automatically on a timer, and it grants flat ATK%, HP% and DEF%. Its screen also carries a 4-slot rune socket ring that has never been captured.',
  },
  {
    key: 'exweapon-node-ladder',
    category: 'gear',
    text: 'Every EX-Weapon in Wittle Defender has the same 11-row enhance ladder: [Activation], then [+10] through [+100] in steps of 10. [Activation] teaches the weapon\'s skill, and everything that makes a weapon interesting lives between [+10] and [+50]. Which of those nodes carry real mechanics varies per weapon, so read [+10] through [+50] rather than assuming [+20] and [+40] are the interesting ones.',
  },
  {
    key: 'exweapon-tail-nodes',
    category: 'gear',
    text: 'On all 26 EX-Weapons captured in Wittle Defender the [+60] to [+100] nodes are identical filler: damage, a +12% stat, damage, a +12% stat, damage. Only which stat appears varies. [+70] is ATK on 25 of 26 (Robot is the lone Max HP exception), while [+90] is a genuine coin flip between ATK and Max HP that does not track the hero\'s role. Never recite the tail when asked what a weapon does.',
  },
  {
    key: 'exweapon-node-unlock-rule',
    category: 'gear',
    text: 'In Wittle Defender an EX-Weapon node [+N] unlocks exactly when the weapon reaches level +N, and [Activation] unlocks at +1. Nothing unlocks early. That makes the +N badge on the hero page\'s weapon bubble a complete description of what the weapon is doing: a badge of 20 or higher means the [+20] mechanic is live, and a badge under 10 means only the base skill is running.',
  },
  {
    key: 'exweapon-activation-at-plus-1',
    category: 'strategy',
    text: 'An EX-Weapon sitting at +0 in Wittle Defender is doing nothing at all: [Activation] is padlocked, the weapon\'s ATK%, HP% and DEF% all read 0%, and the hero does not have the extra skill. [Activation] is bought at exactly +1, so taking a weapon from +0 to +1 is the single highest-value enhance in the whole system. Every level after that is incremental.',
  },
  {
    key: 'exweapon-cadence',
    category: 'gear',
    text: 'EX-Weapon cast interval is a hidden per-weapon stat in Wittle Defender and the enhance ladder never mentions it. Across all 26 captured weapons, 18 cast every 25s, 7 cast every 20s (Robot, Sword Saint, Night Baron, Blazing Archer, Swordmaster, Thunder Pharaoh, Demon Spawn) and 1 casts every 15s (Ice Queen). Never state a generic EX-Weapon cooldown - it must be looked up per weapon.',
  },
  {
    key: 'exweapon-energy',
    category: 'gear',
    text: 'EX-Weapon Energy in Wittle Defender is a per-hero meter, not a shared team pool: each hero fills their own meter to fire their weapon skill. It is a niche subsystem - 22 of the 26 captured weapons never mention it. Starlight Weaver\'s [Starseer Staff] feeds 5 Energy to a random ally every 0.5s, and Draconic Empress drains Energy from the enemy with the highest ATK.',
  },
  {
    key: 'exweapon-energy-arena-start',
    category: 'gear',
    text: 'Arena starting EX-Weapon Energy in Wittle Defender is set per hero, which is the clearest proof the meter is not a shared team pool. Monkey King\'s [Golden Staff] [+50] starts him with 70 Energy in Arena Mode, Starlight Weaver\'s [Starseer Staff] [+10] starts her with 20, and Draconic Empress\'s MAX Ascend grants her 30 on entering PvP. Different heroes, different starting values.',
  },
  {
    key: 'exweapon-star-gate',
    category: 'strategy',
    text: 'EX-Weapon enhancement in Wittle Defender is hard-gated by the hero\'s star tier: when the hero is too low the Enhance button is replaced outright by a message like "Star Up Hero to 3 stars to continue enhancement". A 0-star Mythic can be blocked while the weapon is still at +0, meaning it gives 0% stats and no skill until the hero is starred up. Starring up and enhancing are the same question.',
  },
  {
    key: 'exweapon-material',
    category: 'gear',
    text: 'EX-Weapon enhancement in Wittle Defender consumes a material shown as a stock/cost chip above the Enhance button. The stock is shared across heroes, but the cost per enhance is per hero - 300, 600, 900, 1200, 1800 and 2400 have all been seen. At least one hero (Cheffy) shows a visibly different material icon with its own separate stock, so check the icon before assuming one currency covers everyone.',
  },
  {
    key: 'exweapon-material-chip-colour',
    category: 'gear',
    text: 'The material chip above an EX-Weapon\'s Enhance button in Wittle Defender is green when your stock covers the cost and red when it does not, and while red it cross-fades to the words "Can Be Composed" - the material is craftable, not gacha-only. A red chip is a different blocker from a star gate: with a star gate the Enhance button is replaced entirely, with a red chip it is still there and merely unaffordable.',
  },
  {
    key: 'exweapon-damage-scaling',
    category: 'gear',
    text: 'EX-Weapon skill damage in Wittle Defender uses three distinct scaling phrases that are not synonyms. "Scales with character level in battle" means the wielder\'s own level and covers about 22 of 26 weapons. "Scales with combat level" is an account-wide power concept and appears on Night Baron, Demon Spawn and Blazing Archer. "Scales with the sum of all ally character levels" appears on Monkey King and Phoenix Dancer.',
  },
  {
    key: 'exweapon-name-vs-skill-name',
    category: 'gear',
    text: 'In Wittle Defender an EX-Weapon\'s name and the skill it teaches are two different names, and a bracketed name appearing in Ascend text, skin-skill text or Passive text is always the SKILL name, never the weapon\'s. Polar Captain\'s [Ghost Fleet] was long believed to be his weapon; the weapon is actually [Sunken Engulfer] and [Ghost Fleet] is the skill it teaches.',
  },
  {
    key: 'exweapon-names-not-guessable',
    category: 'gear',
    text: 'EX-Weapon names in Wittle Defender cannot be guessed from a hero\'s theme or element. Blazing Archer is a fire archer whose weapon is [Skeletal Virtuoso] and fires rockets, Frost Lich\'s is [Frostbane Egg], and Swordmaster\'s is [Gloom Whisperer]. Every name inferred from flavour before the screens were read turned out to be wrong, so never reconstruct a weapon name you have not seen - say you do not know it.',
  },
  {
    key: 'exweapon-ui-dialects',
    category: 'gear',
    text: 'EX-Weapon screens in Wittle Defender use three cosmetic label dialects for the identical ladder: [Activation] / [+10] on most weapons, [Unlock] / [+10 Unlock] on Ice Queen, Night Baron, Blazing Archer and Demon Spawn, and [Activation Unlock] / [+10 Unlock] on God Ruler alone, who also writes "Directly learn skill" and "Every 25 seconds" in full words. A new label style is not a new mechanic.',
  },
  {
    key: 'exweapon-rarity-scope',
    category: 'gear',
    text: 'All 26 EX-Weapons captured in Wittle Defender belong to Mythic and Sublime heroes. No Legendary, Epic or Common hero\'s page has ever been opened to check whether the EX-Weapon bubble even exists there, so whether heroes below Mythic have EX-Weapons at all is genuinely unknown. Do not claim it either way.',
  },
  {
    key: 'exweapon-fire-res-shred',
    category: 'strategy',
    text: 'In Wittle Defender enemy Fire RES reduction lives on the EX-Weapon layer rather than on any hero skill: Draconic Empress\'s [Blazing Bond] cuts it 20% at [+20], and Fiery Vanguard\'s [Divine Ignition] cuts 10% at [+20] and another 10% at [+50]. A Fire team\'s damage ceiling is therefore set by weapon enhance levels, so "get those two weapons to +20" beats "level your Fire heroes".',
  },
  {
    key: 'exweapon-weapon-is-the-kit',
    category: 'strategy',
    text: 'Several Wittle Defender heroes carry their real value on the EX-Weapon rather than their listed skills. Robot is a Fighter whose [Iron Berserker] gives the whole team a shield plus 30% DMG Reduction, rising to 40% at [+40]. Panda Brewmaster\'s [Vintage Staff] hands the team CRIT RES and CRIT DMG RES from activation alone, and Archon Armor\'s [Thunder Core] shields the team off his own Max HP.',
  },
  {
    key: 'exweapon-random-targeting',
    category: 'strategy',
    text: 'Two Wittle Defender EX-Weapons explicitly fire "at random enemies": Thunder Pharaoh\'s Skyfall Laser and Blazing Archer\'s Blazing Rockets. Neither aims, which makes both strong against packed waves and unreliable against a single boss or a priority target. No stat on the enhance screen expresses this, so it is worth saying out loud before recommending either weapon.',
  },
  {
    key: 'exweapon-frostwolf-king',
    category: 'gear',
    text: 'Northern Tyrant\'s "Frostwolf King" and "Frost Shred" are NOT EX-Weapon content in Wittle Defender. Four capture passes covering all 26 EX-Weapon screens, including his own [Glacial War Axe], found neither name anywhere. They appear only in his tier-3 Ascend and in the Tropical Wanderer skin skill, so they belong to one of the uncaptured systems - Sigil, Gear, Rune, Emblem or Pantheon.',
  },
  {
    key: 'exweapon-frost-lich-two-dragons',
    category: 'heroes',
    text: 'Frost Lich (Necrym) in Wittle Defender has two separate dragons and they are not the same summon. His Main Skill summons a Frost Wyvern every 10s, treated as a hero unit, while his EX-Weapon [Frostbane Egg] summons a Cursed Dragon every 25s. Nothing on either screen links them, so any answer to "what does Frost Lich summon" that names only one of the two is wrong.',
  },
  {
    key: 'exweapon-draconic-empress',
    category: 'gear',
    text: 'Draconic Empress (Drakaina) wields the EX-Weapon [Blazing Bond], which teaches Wyrmfall Disaster: every 25s a dragon takes off and bombards enemies with fireballs twice. [+20] makes the takeoff AoE cut enemy Fire RES by 20%, [+30] widens the bombardment, [+40] raises it to three passes, and [+50] adds a brief stun on the bombardment.',
  },
  {
    key: 'exweapon-levin-archangel',
    category: 'gear',
    text: 'Levin Archangel (Elettra) wields the EX-Weapon [Storm Gemini], which teaches Divine Sentence: every 25s lightning arrays strike enemies and a massive thunderbolt lands. Its damage scales with the [Unity Grace] target\'s level, not her own. [+20] gives the team 15% CRIT Rate for 12s and [+50] instantly grants [Unity Grace] to ALL other allies for 4s on every cast.',
  },
  {
    key: 'exweapon-panda-brewmaster',
    category: 'gear',
    text: 'Panda Brewmaster (Bambrew) wields the EX-Weapon [Vintage Staff], which teaches Verdant Tempest: every 25s heavy damage over time plus team CRIT RES +15% and CRIT DMG RES +30% for 6s from activation alone. [+20] and [+40] add Green Thorns cutting enemy DMG RES and Wind RES, and [+50] summons 5 [Verdant Bamboo], each adding 10% team total HP for 12s.',
  },
  {
    key: 'exweapon-northern-tyrant',
    category: 'gear',
    text: 'Northern Tyrant (Ulfric) wields the EX-Weapon [Glacial War Axe], which teaches Tyrant Roar: every 25s multiple AoE hits that inspire him and all summoned units with greatly increased ATK SPD and Skill CD SPD for 7s. [+20] also boosts all summoned unit damage, [+40] enhances the buff on summons, [+50] extends it to 12s. The axe is what makes his kit a summoner kit.',
  },
  {
    key: 'exweapon-monkey-king',
    category: 'gear',
    text: 'Monkey King (Sun Wukong) wields the EX-Weapon [Golden Staff], which teaches Golden Cudgel: every 25s the cudgel descends for heavy area damage. [+20] summons 4 spinning Golden Staves, [+40] raises them to 8, and [+50] makes him start Arena Mode with 70 EX-Weapon Energy. Its damage scales with the sum of all ally character levels rather than his own level.',
  },
  {
    key: 'exweapon-starlight-weaver',
    category: 'gear',
    text: 'Starlight Weaver (Stella) wields the EX-Weapon [Starseer Staff], which teaches Stellar Domain: every 25s a massive meteor lands and a domain pulls enemies in, cutting their CRIT RES 15% and CRIT DMG RES 30% for 6s. [+20] restores 5 EX-Weapon Energy to a random ally every 0.5s, [+30] also heals that ally 3% of Max HP, and [+50] adds 3 satellites that drain enemy Energy.',
  },
  {
    key: 'exweapon-fabled-lyra',
    category: 'gear',
    text: 'Fabled Lyra (Roxy) wields the EX-Weapon [Orchestral Chapter], which teaches Crowned Concerto: every 25s three waves of sound pulses knock enemies back and grant allies 8% Dodge, healing worth 8% of her ATK, and a 15% all-DMG bonus for 10s. The ladder upgrades one wave each - [+20] Dodge to 16%, [+40] healing to 15%, [+50] DMG bonus to 30%.',
  },
  {
    key: 'exweapon-polar-captain',
    category: 'gear',
    text: 'Polar Captain (Sarashed) wields the EX-Weapon [Sunken Engulfer], which teaches the skill Ghost Fleet: every 25s a ghost fleet rams enemies for high damage. [+20] summons large tentacles when the fleet sinks, [+40] greatly increases the tentacle count, and [+50] increases the fleet\'s size. [Ghost Fleet] is the skill, not the weapon - an earlier note had that backwards.',
  },
  {
    key: 'exweapon-phoenix-dancer',
    category: 'gear',
    text: 'Phoenix Dancer (Xiluan) wields the EX-Weapon [Divine Phoenix Plume], which teaches Soaring Phoenix: every 25s the Divine Phoenix radiates a heatwave then charges through enemies. [+20] adds rapid flame tornadoes, [+40] doubles them, and [+50] gives all allies +50% CRIT DMG for 12s on every cast. Her MAX Ascend refreshes EX-Weapon skills on revival, re-firing it instantly.',
  },
  {
    key: 'exweapon-valkyrie',
    category: 'gear',
    text: 'Valkyrie (Thrud) wields the EX-Weapon [Skofnung], which teaches Valkyrie\'s Wraith: every 25s multiple thunder slashes followed by a thunder wave for massive damage. It is the plainest EX-Weapon in the game - no team buffs, debuffs or summons. [+10] and [+30] only raise the slash count and [+50] boosts the final wave; every other node is a straight damage increase.',
  },
  {
    key: 'exweapon-windborne-ranger',
    category: 'gear',
    text: 'Windborne Ranger (Aeralyn) wields the EX-Weapon [Hallowed Antler], which teaches Airborn Echo: every 25s summon 5 Elemental Deer to charge across the field, followed by 1 Giant Deer that hits hard. The whole ladder is one number going up - [+10] makes it 6 deer, [+30] 7 and [+50] 8 plus a large Giant Deer damage bump. Its mechanic nodes sit at [+10]/[+30]/[+50].',
  },
  {
    key: 'exweapon-frost-lich',
    category: 'gear',
    text: 'Frost Lich (Necrym) wields the EX-Weapon [Frostbane Egg], which teaches Cursed Dragon: every 25s summon a Cursed Dragon whose attacks cut enemy DMG REDUC by 12%, with giant icicles falling on summon. The ladder is a debuff stack - [+10] freeze chance, [+20] a further -10% DMG REDUC, [+30] a [Cryo Surge] damage aura, [+40] enemy healing taken -60%, [+50] enemy Ice RES -12%.',
  },
  {
    key: 'exweapon-archon-armor',
    category: 'gear',
    text: 'Archon Armor (Aegis) wields the EX-Weapon [Thunder Core], which teaches Plasma Field: every 25s large-area damage plus a shield for all allies worth 8% of Archon Armor\'s own Max HP for 12s. [+10] adds paralysis, [+20] cuts enemy DMG RES 20%, [+30] raises the shield to 12% of his Max HP, [+40] cuts enemy Skill CD SPD 30%, and [+50] releases 3 Minor Plasma Fields.',
  },
  {
    key: 'exweapon-scarlet-reaper',
    category: 'gear',
    text: 'Scarlet Reaper (Promethea) wields the EX-Weapon [Soulflare Blaze Blade], which teaches Hellfire Twinblades: every 25s she enters Hellfire form for a giant flaming cross-slash. It is the only self-sustain EX-Weapon - [+10], [+30] and [+50] restore 10%, 15% then 20% of her own HP per cast, while [+20] and [+40] each add a slash at slightly reduced damage per slash.',
  },
  {
    key: 'exweapon-cheffy',
    category: 'gear',
    text: 'Cheffy (Aromi) wields the EX-Weapon [Delectable Feast], which teaches Epicurean Delight: every 25s summon a Supreme Bun dealing area damage over time and healing allies. [+20] makes each heal grant 1.5% team DMG for 5s up to 12 stacks, [+40] raises that to 3% per stack (up to +36% team DMG), and [+50] makes the team invincible for 2s on summon. [+10]/[+30]/[+50] extend the bun\'s duration.',
  },
  {
    key: 'exweapon-ice-queen',
    category: 'gear',
    text: 'Ice Queen (Shiva) wields the EX-Weapon [Glacial Seer], which teaches Frigid Breath, cast around herself every 15s - the fastest cadence of any EX-Weapon, firing about 1.7 times as often as a 25s weapon. Her own ladder text calls the same skill "Winter\'s Breath", an in-game alias. [+10] adds knockback and [+30] and [+40] each add a projectile; there are no team effects on it.',
  },
  {
    key: 'exweapon-fiery-vanguard',
    category: 'gear',
    text: 'Fiery Vanguard (Kilonek) wields the EX-Weapon [Divine Ignition], which teaches Drone Swarm: every 25s release a drone swarm for high-damage area bombardment. [+20] adds drones and cuts enemy Fire RES 10% for 12s, [+40] extends drone duration, and [+50] greatly increases the drone count and cuts Fire RES another 10%, for 20% total shred.',
  },
  {
    key: 'exweapon-robot',
    category: 'gear',
    text: 'Robot (Fystron) wields the EX-Weapon [Iron Berserker], which teaches Arc Barrier: every 20s it shields ALL allies and gives them 30% DMG Reduction for 6s while shocking nearby enemies. [+20] heavily slows nearby enemies and [+40] raises the DMG Reduction to 40%. Robot is listed as a Fighter, but the strongest team-defence effect in the game sits on this weapon, not on its skills.',
  },
  {
    key: 'exweapon-sword-saint',
    category: 'gear',
    text: 'Sword Saint (Lark) wields the EX-Weapon [Ethereal Ravager], which teaches Sword Unbound, cast every 20s for high damage. [+10] is its only mechanic node, adding a chance to inflict Armor Break, while [+20] and [+40] simply add more flying swords and every other node is damage. The weapon is a straight extension of her Flying Sword main skill.',
  },
  {
    key: 'exweapon-night-baron',
    category: 'gear',
    text: 'Night Baron (Vesper) wields the EX-Weapon [Wraith Piercer], which teaches Raging Storm Thrust: every 20s, 3 thrusts across a wide area. The ladder buys coverage rather than power - [+10] and [+30] each add a thrust direction and [+50] doubles the number of attacks at reduced per-hit damage. Its damage scales with combat level rather than with hero level.',
  },
  {
    key: 'exweapon-god-ruler',
    category: 'gear',
    text: 'God Ruler (Odin) wields the EX-Weapon [Wrathful Smiter], which teaches Thunder Strike: every 25 seconds it summons Thor\'s Hammer to deal massive damage across a wide range of enemies. [+20] adds continuous lightning strikes after the strike lands and [+40] increases their number; the rest of the ladder is damage. Thor\'s Hammer belongs to the EX-Weapon, not to his main skill.',
  },
  {
    key: 'exweapon-blazing-archer',
    category: 'gear',
    text: 'Blazing Archer (Parody) wields the EX-Weapon [Skeletal Virtuoso], which teaches Blazing Rockets: every 20s fire 5 rockets at random enemies. [+10] adds knockback, [+30] fires 2 more sideways, [+40] adds 2 more rockets, and [+50] makes the rockets split into homing missiles at max range. Its damage scales with combat level rather than hero level.',
  },
  {
    key: 'exweapon-swordmaster',
    category: 'gear',
    text: 'Swordmaster (Miyamoto) wields the EX-Weapon [Gloom Whisperer], which teaches Bladewind Barrier: every 20s cast a row of Wind Barriers that block ranged projectiles and damage nearby enemies. It is the only EX-Weapon whose primary job is defence rather than damage. [+10] adds an Armor Break chance and [+20] widens the barrier; [+40] onward has not been captured yet.',
  },
  {
    key: 'exweapon-thunder-pharaoh',
    category: 'gear',
    text: 'Thunder Pharaoh (Osyle) wields the EX-Weapon [Judging Stormbearer], which teaches Skyfall Laser: a laser cannon fired at random enemies every 20s. [+10] bolts a strong Slow onto the cannon, [+20] adds a ring of secondary cannons around it, and [+40] adds more secondary cannons and extends the cannon\'s range. Random targeting makes it better on crowds than on a boss.',
  },
  {
    key: 'exweapon-ice-demon',
    category: 'gear',
    text: 'Ice Demon (Floss) wields the EX-Weapon [Icy Conqueror], which teaches Bear Descent: every 25s large area damage that freezes enemies for 3s. [+20] takes the freeze to 4s and [+40] to 5s. It is the only EX-Weapon in the game with hard crowd control, and a 5s AoE freeze on a 25s timer is roughly 20% uptime - worth far more in Arena than its damage nodes suggest.',
  },
  {
    key: 'exweapon-demon-spawn',
    category: 'gear',
    text: 'Demon Spawn (Zain) wields the EX-Weapon [Fiery Executioner], which teaches Hell Void Slash: every 20s, consecutive Hell Void Slashes. It is a pure damage ladder with no mechanic nodes - [+30] adds 5 attacks to the multi-hit flurry its ladder calls Hell Severance and [+40] gives that flurry bonus damage per hit. Its damage scales with combat level rather than hero level.',
  },

  // ── Treasures (runes) — system ──────────────────────────────────────────
  //
  // Captured screen-by-screen from the Treasure screen on Kyle's account; the
  // working notes are in docs/capture/treasures-runes.md. Two things to hold on
  // to when extending this section:
  //
  //  - The game calls this system TREASURE. Members say "rune". Every fact here
  //    names both, because a member asking "best runes for Frost Lich" must hit
  //    the same facts as one asking about treasures.
  //  - Kyle's collection is INCOMPLETE, exactly like the hero gallery. A
  //    treasure that is not here has not been captured; it is never "does not
  //    exist". runes-coverage-caveat carries that instruction — keep it current
  //    as elements are added.
  //
  // Keys are `rune-<name>-identity` / `rune-<name>-tiers`. The identity key is
  // load-bearing: retrieval.ts builds the rune roster from it, so naming a
  // treasure in a question pulls its whole family. See
  // docs/coding-standards/knowledge-facts.md.
  {
    key: 'runes-are-called-treasures',
    category: 'runes',
    text: 'In Wittle Defender the system members call "runes" is the TREASURE screen, and all the treasure/rune facts here describe it. Treasures are account-wide and carried into battle as a group, NOT equipped to one hero the way an EX-Weapon is, even though most of them name a specific hero in their skills. UNRESOLVED: every hero page also has its own Rune button, and an earlier capture noted a four-socket rune ring on the EX-Weapon screen, which does not match the Treasure screen\'s 12 sockets. These may be two different systems. If someone asks about per-hero runes rather than treasures, say that distinction has not been verified yet instead of assuming they are the same thing.',
  },
  {
    key: 'runes-carry-limit-and-slots',
    category: 'runes',
    text: 'Treasure (rune) carry rules in Wittle Defender: a player can carry up to 12 treasures into battle, but only 1 slot is unlocked at the start and the rest unlock as the player levels up. Only one copy of each treasure can be carried at a time. Whether the locked sockets state their unlock level has not been captured.',
  },
  {
    key: 'runes-stats-vs-skills',
    category: 'runes',
    text: 'How a Treasure (rune) helps in Wittle Defender: every treasure gives a flat ATK%, HP% and DEF% contribution that ALL deployed heroes benefit from, and those contributions add up across every treasure carried into one account-wide total shown on the Treasure screen. Separately it grants Treasure Skills, and those are almost always tied to one named hero or one element. So the raw stats always help whatever team you run, while the skills only pay off if that hero or element is actually deployed.',
  },
  {
    key: 'runes-rarity-ladder',
    category: 'runes',
    text: 'Treasure (rune) rarity in Wittle Defender uses its OWN ladder, which is not the hero rarity ladder: Common (grey), Uncommon (green), Excellent (blue), Epic (pink/magenta/purple), Legendary (gold/yellow), and AT LEAST TWO MORE ABOVE Legendary whose names have not been captured — treasures carry red and white skill tiers beyond the orange/Legendary one, and a tier can only be unlocked by a rarity. Note it is Excellent, not Rare. The flat ATK/HP/DEF a treasure contributes tracks its rarity and +N and never depends on which hero it buffs: for Ice and Wind, Common 0.5%, Uncommon 1.5%, Excellent 3%, Epic 3.8%, Epic +2 5%, Legendary 5.6%, Legendary +1 6.1%. ELEMENT MATTERS TOO — every Xenoscape Epic measured so far gives 4.6%, not 3.8%, so Xenoscape treasures contribute more at the same rarity. Do not quote an Ice/Wind number for a Xenoscape treasure, and treat Fire and Electro as unmeasured. Within a rarity a treasure gains +N levels shown as e.g. "Legendary +1", up to +2 before it can be fused up; its ATK/HP/DEF contribution rises with both the rarity and the +N.',
  },
  {
    key: 'runes-six-skill-tiers',
    category: 'runes',
    text: 'Every Treasure (rune) in Wittle Defender has exactly SIX skill tiers, one unlocked per rarity step, colour-coded in this order: green, blue, purple, orange, red, white — so green = Uncommon, blue = Excellent, purple = Epic and orange = Legendary. Verified on fourteen treasures across Ice and Wind with no exceptions. A treasure detail page lists all six no matter what rarity that copy is, so tiers above its current rarity are visible but not active, and a low-rarity copy is a perfectly good source for the full ladder.',
  },
  {
    key: 'runes-two-per-hero-pattern',
    category: 'runes',
    text: 'The organising pattern of the Treasure (rune) system in Wittle Defender: most heroes have TWO treasures — an "attack" one whose first two tiers give that hero ATK%, and a "defense" one whose first two tiers give that hero HP% — and each element additionally has one element-wide treasure boosting that whole element\'s damage. Above those first two tiers both kinds usually amplify the hero\'s named skills, so a defense treasure is often not defensive at high rarity: Frigid Hexblood is Polar Captain\'s HP treasure and its top tiers are pure summon generation.',
  },
  {
    key: 'runes-fuse-and-reset',
    category: 'runes',
    text: 'Treasure (rune) upgrading in Wittle Defender: once obtained, a treasure can be FUSED into a higher rarity, and raising its rarity both increases its stats and unlocks its next skill tier. When a treasure reaches Epic rarity a treasure reset feature unlocks, which reclaims the materials used in crafting. The Treasure screen also offers Treasure Conversion, whose rules have not been captured yet. There are TWO separate fusion paths — see the rarity-up and level-up facts; they cost different things and give different rewards.',
  },
  {
    key: 'runes-fusion-rarity-up',
    category: 'runes',
    text: 'Treasure (rune) RARITY-UP fusion in Wittle Defender consumes DUPLICATE COPIES of the same treasure: a treasure at the top +N level of its rarity plus 2 more identical copies at that same rarity and level fuses into the next rarity up. This is the fusion that UNLOCKS THE NEXT SKILL TIER, and it also raises the flat ATK/HP/DEF contribution. Observed directly: an Epic +2 Verdant Embryo listed "Cost: 2x Epic +2 Verdant Embryo" and previewed a Legendary result that unlocked its orange skill tier. This is why a player\'s treasure bag holds several copies of the same treasure — duplicates are the upgrade material, not clutter.',
  },
  {
    key: 'runes-fusion-level-up',
    category: 'runes',
    text: 'Treasure (rune) LEVEL-UP fusion in Wittle Defender is the other path and costs a generic ELEMENT TOKEN rather than duplicate treasures: one token matching the treasure\'s rarity and element raises it by one +N level within its current rarity. It gives only a small flat ATK/HP/DEF increase and does NOT unlock a new skill tier. Observed directly: a Legendary Electro treasure listed "Cost: 1x Legendary [Electro token]" and previewed Legendary +1 with +0.5% ATK/HP/DEF and no new skill line. So +N levels are stat padding; skill tiers come only from rarity-up.',
  },
  {
    key: 'runes-coverage-caveat',
    category: 'runes',
    text: 'IMPORTANT — Tempest AI\'s Treasure (rune) data is INCOMPLETE. Most of it was captured from one player\'s collection — Ice/Frost and Wind are covered, Fire and Electro are barely started. The Xenoscape entries instead come from the Shop\'s reward-preview catalogue, so those are game data rather than that player\'s inventory, but only three of them have been read so far. If a treasure, or a particular hero\'s treasure, is not in these facts, say it has not been captured yet and invite /fact add — never say it does not exist in the game, and never invent tiers or numbers. The Treasure screen filters by the same five elements as heroes: Ice, Fire, Electro, Wind, Xenoscape.',
  },
  {
    key: 'runes-ice-roster',
    category: 'runes',
    text: 'Ice/Frost Treasures (runes) captured so far in Wittle Defender, by the hero each buffs — Polar Captain: Frostone Edge (attack) and Frigid Hexblood (defense); Frost Lich: Perpetual Blizzard (attack) and Frigid Coronet (defense); Ice Queen: Cuttlefish Cap (attack) and Frost Wax (defense); Ice Witch: Glacier Tear (attack) and Frostvein Coral (defense); Northern Tyrant: Icebound Fang (attack) only; Ice Demon: Titan Toothpick (defense) only; Ice Mage: Glacier Sundae (defense) only. The Ice element-wide treasure is Soulfrost Gyro. Northern Tyrant\'s defense treasure and Ice Demon\'s and Ice Mage\'s attack treasures have not been found yet — going by every other hero they almost certainly exist.',
  },
  {
    key: 'runes-wind-roster',
    category: 'runes',
    text: 'Wind Treasures (runes) in Wittle Defender, by the hero each buffs — Fabled Lyra: Aeolian Core (attack) and Windlock Casket (defense); Windborne Ranger: Boreas\' Blessing (attack) and Whistling Crown (defense); Sword Saint: Mystic Emerald (attack) and Verdant Embryo (defense); Cat Assassin: Gale Colossus (attack) and Zephyr Cone (defense); Swordmaster: Wild Fruit (attack) and Aerolux (defense); Demon Hunter: Verdant Skyplume (attack) and Treant Golem (defense); Night Baron: Dreamy Dragon Egg (attack) and Owlbeast Codex (defense). The Wind element-wide treasure is Vinewheel Timepiece. That is seven complete hero pairs plus the element treasure, with no Wind hero left holding only one — but it covers only the Wind heroes in this collection, so another Wind hero may still have a pair we have not seen.',
  },
  {
    key: 'runes-for-the-ice-summon-core',
    category: 'strategy',
    text: 'Which Treasures (runes) matter most for the Ice summon core (Northern Tyrant + Polar Captain + Frost Lich): the ones that add SUMMON COUNT or element-wide damage, not the ones that add raw stats, because Northern Tyrant and Frost Lich both scale off allied summon count so a summon-count tier multiplies the whole team. In priority order — Frigid Hexblood (Polar Captain initial Tide Count +3 then +6, then a recurring giant tentacle), Perpetual Blizzard (+1 Frost Wyvern per summon, and shreds enemy Ice Resistance up to 16% which amplifies every Ice hero), Soulfrost Gyro (all Ice DMG up to +20%), then Frostone Edge (Polar Captain Tide Final DMG up to +60%).',
  },

  // ── Treasures (runes) — Ice/Frost, full six-tier ladders ────────────────
  {
    key: 'rune-frostone-edge-identity',
    category: 'runes',
    text: 'Frostone Edge is an Ice/Frost Treasure (rune) in Wittle Defender that buffs Polar Captain. It is his ATTACK treasure: the first tiers give him ATK% and the upper tiers multiply the damage of his Tide and Voracious Wave skills. Note Voracious Wave is a Polar Captain skill that does not appear in his captured hero facts, so treat it as a real skill of his that we have not documented separately.',
  },
  {
    key: 'rune-frostone-edge-tiers',
    category: 'runes',
    text: 'Frostone Edge (Ice treasure/rune for Polar Captain) — its six skill tiers in order: green, Polar Captain ATK +5%; blue, Polar Captain ATK +10%; purple, Polar Captain Tide Final DMG +30%; orange, that Tide Final DMG increases to +60%; red, Polar Captain Voracious Wave Final DMG +36%; white, that Voracious Wave Final DMG increases to +72%.',
  },
  {
    key: 'rune-frigid-hexblood-identity',
    category: 'runes',
    text: 'Frigid Hexblood is an Ice/Frost Treasure (rune) in Wittle Defender that buffs Polar Captain. It is his DEFENSE treasure by its first two tiers (HP%), but that label is misleading above them: its upper tiers are pure summon generation, giving +6 initial Tide Count and a recurring giant sea monster tentacle. In an Ice summon team it is an offensive pick, not a survivability one, because Northern Tyrant and Frost Lich both scale off allied summon count.',
  },
  {
    key: 'rune-frigid-hexblood-tiers',
    category: 'runes',
    text: 'Frigid Hexblood (Ice treasure/rune for Polar Captain) — its six skill tiers in order: green, Polar Captain HP +5%; blue, Polar Captain HP +10%; purple, Polar Captain initial Tide Count +3; orange, that initial Tide Count increases to +6; red, every 20 casts of Tide Polar Captain summons a giant sea monster\'s tentacle to hit a large area; white, Giant Sea Monster Tentacle +2.',
  },
  {
    key: 'rune-frigid-coronet-identity',
    category: 'runes',
    text: 'Frigid Coronet is an Ice/Frost Treasure (rune) in Wittle Defender that buffs Frost Lich. It is his DEFENSE treasure: HP% at the bottom, and above that it converts his Frost Vortex into a debuff and team-sustain tool — slowing enemy attack speed and cooldowns, then healing the whole team when the vortex ends — rather than adding any damage.',
  },
  {
    key: 'rune-frigid-coronet-tiers',
    category: 'runes',
    text: 'Frigid Coronet (Ice treasure/rune for Frost Lich) — its six skill tiers in order: green, Frost Lich HP +5%; blue, Frost Lich HP +10%; purple, Frost Vortex additionally reduces enemies\' ATK SPD and skill cooldown speed by 15% for 5s and cannot stack; orange, when Frost Vortex ends it heals all allies for 1.5% of Frost Lich\'s max HP; red, that ATK SPD and cooldown reduction increases to 30%; white, that healing coefficient increases to 3%.',
  },
  {
    key: 'rune-perpetual-blizzard-identity',
    category: 'runes',
    text: 'Perpetual Blizzard is an Ice/Frost Treasure (rune) in Wittle Defender that buffs Frost Lich. It is his ATTACK treasure and one of the most valuable treasures for any Ice team, because its upper tiers add an extra Frost Wyvern per summon and shred enemy Ice Element Resistance — an effect that amplifies every Ice hero deployed, not just Frost Lich.',
  },
  {
    key: 'rune-perpetual-blizzard-tiers',
    category: 'runes',
    text: 'Perpetual Blizzard (Ice treasure/rune for Frost Lich) — its six skill tiers in order: green, Frost Lich ATK +5%; blue, Frost Lich ATK +10%; purple, Frost Wyvern\'s Final DMG +40%; orange, Frost Wyvern\'s attack additionally reduces enemies\' Ice Element Resistance by 8% for 10s and cannot stack; red, when summoning Frost Wyverns the summon count is +1; white, that Ice Element Resistance reduction increases to 16%.',
  },
  {
    key: 'rune-icebound-fang-identity',
    category: 'runes',
    text: 'Icebound Fang is an Ice/Frost Treasure (rune) in Wittle Defender that buffs Northern Tyrant. It is his ATTACK treasure and a pure damage ladder — ATK% then four escalating steps of Axe Barrage Final DMG up to +140%, with no added mechanic at any tier. Caution: "Axe Barrage" does not appear in Northern Tyrant\'s captured hero facts, where his Main Skill is Blizzard Cleaver; do not assume the two are the same skill.',
  },
  {
    key: 'rune-icebound-fang-tiers',
    category: 'runes',
    text: 'Icebound Fang (Ice treasure/rune for Northern Tyrant) — its six skill tiers in order: green, Northern Tyrant ATK +5%; blue, Northern Tyrant ATK +10%; purple, Axe Barrage Final DMG +35%; orange, Axe Barrage Final DMG +70%; red, Axe Barrage Final DMG +105%; white, Axe Barrage Final DMG +140%.',
  },
  {
    key: 'rune-frost-wax-identity',
    category: 'runes',
    text: 'Frost Wax is an Ice/Frost Treasure (rune) in Wittle Defender that buffs Ice Queen. It is her DEFENSE treasure: HP% first, then it turns her Ice Storm into a damage-reduction debuff, and its top tiers punish the enemies she has already debuffed and add an Ice Resistance shred.',
  },
  {
    key: 'rune-frost-wax-tiers',
    category: 'runes',
    text: 'Frost Wax (Ice treasure/rune for Ice Queen) — its six skill tiers in order: green, Ice Queen HP +5%; blue, Ice Queen HP +10%; purple, Ice Queen\'s Ice Storm reduces enemy DMG by 10%; orange, that DMG reduction increases to 20%; red, Ice Storm deals extra massive DMG to enemies whose damage is already reduced; white, Ice Storm reduces the target\'s Ice RES by an extra 10% for 3s.',
  },
  {
    key: 'rune-cuttlefish-cap-identity',
    category: 'runes',
    text: 'Cuttlefish Cap is an Ice/Frost Treasure (rune) in Wittle Defender that buffs Ice Queen. It is her ATTACK treasure and a pure damage ladder, but an unusually broad one — it covers three of her skills: Ice Storm, Frigid Hurricane and Ministorm.',
  },
  {
    key: 'rune-cuttlefish-cap-tiers',
    category: 'runes',
    text: 'Cuttlefish Cap (Ice treasure/rune for Ice Queen) — its six skill tiers in order: green, Ice Queen ATK +5%; blue, Ice Queen ATK +10%; purple, Ice Queen Ice Storm and Frigid Hurricane Final DMG +20%; orange, that Ice Storm and Frigid Hurricane bonus increases to +40%; red, Ice Queen Ministorm Final DMG +20%; white, that Ministorm bonus increases to +40%. The orange and white tiers both read "+40%" in game but apply to different skills, so they are not a duplicate.',
  },
  {
    key: 'rune-glacier-tear-identity',
    category: 'runes',
    text: 'Glacier Tear is an Ice/Frost Treasure (rune) in Wittle Defender that buffs Ice Witch. It is her ATTACK treasure — ATK% and then a single damage line covering her Icicle and Icicle Frenzy skills, which grows across the top four tiers from +10% to +40%.',
  },
  {
    key: 'rune-glacier-tear-tiers',
    category: 'runes',
    text: 'Glacier Tear (Ice treasure/rune for Ice Witch) — its six skill tiers in order: green, Ice Witch ATK +5%; blue, Ice Witch ATK +10%; purple, Ice Witch Icicle and Icicle Frenzy Final DMG +10%; orange, that bonus increases to 15%; red, it increases to 25%; white, it increases to +40%.',
  },
  {
    key: 'rune-soulfrost-gyro-identity',
    category: 'runes',
    text: 'Soulfrost Gyro is the Ice/Frost ELEMENT-WIDE Treasure (rune) in Wittle Defender. Unlike hero treasures it shows no hero portrait and names no hero — it raises all Ice damage, so its value scales with how many Ice heroes are deployed. It is the strongest single treasure for a mono-Ice team such as the Northern Tyrant summon core, and close to worthless in a team running only one Ice hero.',
  },
  {
    key: 'rune-soulfrost-gyro-tiers',
    category: 'runes',
    text: 'Soulfrost Gyro (Ice element-wide treasure/rune) — its six skill tiers in order, each REPLACING the previous value rather than stacking with it: green, Ice DMG +2%; blue, +5%; purple, +8%; orange, +11%; red, +15%; white, +20%. So a fully upgraded Soulfrost Gyro is +20% Ice DMG in total, not the sum of the six lines.',
  },

  {
    key: 'rune-frostvein-coral-identity',
    category: 'runes',
    text: 'Frostvein Coral is an Ice/Frost Treasure (rune) in Wittle Defender that buffs Ice Witch. It is her DEFENSE treasure and the partner to Glacier Tear, her attack one. Its middle tiers add Icicle trajectories and its top tiers give her a STACKING self ATK buff for every icicle cast, so it rewards long fights rather than burst.',
  },
  {
    key: 'rune-frostvein-coral-tiers',
    category: 'runes',
    text: 'Frostvein Coral (Ice treasure/rune for Ice Witch) — its six skill tiers in order: green, Ice Witch HP +5%; blue, Ice Witch HP +10%; purple, Ice Witch Icicle Initial Trajectory +1; orange, that Initial Trajectory increases to +2; red, each icicle cast by Ice Witch boosts her ATK by 2% for a short time and stacks; white, that Icicle ATK boost increases to 4%.',
  },
  {
    key: 'rune-titan-toothpick-identity',
    category: 'runes',
    text: 'Titan Toothpick is an Ice/Frost Treasure (rune) in Wittle Defender that buffs Ice Demon. Filed as his DEFENSE treasure by its HP% opening, it is in practice a summon-count treasure: +2 initial summoned units, a giant ice monster every 12 summons, and — uniquely — a TEAM Ice DMG +10% while that giant is present. That team-wide line makes it relevant to any Ice team, not just one running Ice Demon as a carry.',
  },
  {
    key: 'rune-titan-toothpick-tiers',
    category: 'runes',
    text: 'Titan Toothpick (Ice treasure/rune for Ice Demon) — its six skill tiers in order: green, Ice Demon HP +5%; blue, Ice Demon HP +10%; purple, Ice Demon Initial Summoned Unit +1; orange, that Initial Summoned Unit increases to +2; red, for every 12 times ice monsters are summoned Ice Demon spawns an additional giant ice monster that is larger, faster and stronger; white, while Ice Demon\'s giant ice monster is present, Team Ice DMG +10%.',
  },
  {
    key: 'rune-glacier-sundae-identity',
    category: 'runes',
    text: 'Glacier Sundae is an Ice/Frost Treasure (rune) in Wittle Defender that buffs Ice Mage. It is her DEFENSE treasure by its HP% opening, but its real value is an Ice RES shred on Frost Nova plus a large damage-rate bonus, so like most "defense" treasures it is an offensive pick. The Ice RES reduction helps every Ice hero attacking those targets.',
  },
  {
    key: 'rune-glacier-sundae-tiers',
    category: 'runes',
    text: 'Glacier Sundae (Ice treasure/rune for Ice Mage) — its six skill tiers in order: green, Ice Mage HP +5%; blue, Ice Mage HP +10%; purple, Ice Mage Frost Nova Duration +2s; orange, Frost Nova reduces the Ice RES of targets in range by 10%; red, Ice Mage\'s Frost Nova DMG rate +25%; white, that DMG rate bonus increases to 50%.',
  },

  // ── Treasures (runes) — Wind ────────────────────────────────────────────
  {
    key: 'rune-verdant-embryo-identity',
    category: 'runes',
    text: 'Verdant Embryo is a Wind Treasure (rune) in Wittle Defender that buffs Sword Saint. It is her DEFENSE treasure — HP% on the first two tiers — and above that it scales her Flying Sword count, which is exactly what her Ascend upgrades also do, so the two stack toward the same build. Its top tiers add a separate Exorcist Array summon on every skill cast.',
  },
  {
    key: 'rune-verdant-embryo-tiers',
    category: 'runes',
    text: 'Verdant Embryo (Wind treasure/rune for Sword Saint) — its six skill tiers in order: green, Sword Saint HP +5%; blue, Sword Saint HP +10%; purple, Sword Saint Flying Sword count +2; orange, that Flying Sword count increases to +4; red, for every skill cast Sword Saint summons an Exorcist Array to attack a large area; white, Exorcist Array DMG +100%.',
  },
  {
    key: 'rune-whistling-crown-identity',
    category: 'runes',
    text: 'Whistling Crown is a Wind Treasure (rune) in Wittle Defender that buffs Windborne Ranger. It is her DEFENSE treasure — HP% on the first two tiers — but its upper tiers are offensive: they grant her [Gale Force] state at the start of every battle and then stack her own damage while she is in it. [Gale Force] is the same state her Ascend upgrades feed, so the treasure front-loads a state she would otherwise have to build up to.',
  },
  {
    key: 'rune-whistling-crown-tiers',
    category: 'runes',
    text: 'Whistling Crown (Wind treasure/rune for Windborne Ranger) — its six skill tiers in order: green, Windborne Ranger HP +5%; blue, Windborne Ranger HP +10%; purple, enter [Gale Force] upon entering battle; orange, while entering [Gale Force] her own DMG +12% for 10s; red, that increases to +24% for 10s; white, that increases to +36% for 10s.',
  },
  {
    key: 'rune-boreas-blessing-identity',
    category: 'runes',
    text: 'Boreas\' Blessing is a Wind Treasure (rune) in Wittle Defender that buffs Windborne Ranger. It is her ATTACK treasure and it is entirely focused on her Main Skill, Piercing Shot — first its Final DMG, then its CRIT Rate, ending at Piercing Shot CRIT Rate +30%. That CRIT Rate half makes it unusually good next to a CRIT DMG buffer such as Blazing Archer, since her own kit supplies the rate.',
  },
  {
    key: 'rune-boreas-blessing-tiers',
    category: 'runes',
    text: 'Boreas\' Blessing (Wind treasure/rune for Windborne Ranger) — its six skill tiers in order: green, Windborne Ranger ATK +5%; blue, Windborne Ranger ATK +10%; purple, Piercing Shot Final DMG +10%; orange, that Final DMG increases to +20%; red, Piercing Shot CRIT Rate +15%; white, that CRIT Rate increases to +30%.',
  },

  {
    key: 'rune-aeolian-core-identity',
    category: 'runes',
    text: 'Aeolian Core is a Wind Treasure (rune) in Wittle Defender that buffs Fabled Lyra. It is her ATTACK treasure, built entirely around her Tune skill: Final DMG first, then two debuff tiers that make the whole team hit harder — enemy DMG REDUC down 6%, and enemy Wind RES down 10%. That last one amplifies every Wind hero deployed, not just Fabled Lyra, so it is worth more on a mono-Wind team than its own numbers suggest.',
  },
  {
    key: 'rune-aeolian-core-tiers',
    category: 'runes',
    text: 'Aeolian Core (Wind treasure/rune for Fabled Lyra) — its six skill tiers in order: green, Fabled Lyra ATK +5%; blue, Fabled Lyra ATK +10%; purple, Tune Final DMG +30%; orange, Tune also reduces enemy DMG REDUC by 6% for 5s; red, Tune Final DMG increases to +60%; white, Tune also reduces enemy Wind RES by 10% for 5s.',
  },
  {
    key: 'rune-windlock-casket-identity',
    category: 'runes',
    text: 'Windlock Casket is a Wind Treasure (rune) in Wittle Defender that buffs Fabled Lyra. It is her DEFENSE treasure and the only treasure captured so far that adds HEALING: at its orange tier she heals the lowest-HP ally every 3s for a share of her own ATK, which scales with her damage stats rather than with HP. Its other tiers push Sonic Waves damage.',
  },
  {
    key: 'rune-windlock-casket-tiers',
    category: 'runes',
    text: 'Windlock Casket (Wind treasure/rune for Fabled Lyra) — its six skill tiers in order: green, Fabled Lyra HP +5%; blue, Fabled Lyra HP +10%; purple, Sonic Waves Final DMG +30%; orange, heal the ally with the lowest HP every 3s for 8% of Fabled Lyra\'s ATK; red, Sonic Waves Final DMG increases to +60%; white, that healing multiplier increases to 16%.',
  },

  {
    key: 'rune-mystic-emerald-identity',
    category: 'runes',
    text: 'Mystic Emerald is a Wind Treasure (rune) in Wittle Defender that buffs Sword Saint. It is her ATTACK treasure and a pure damage ladder across both of her damage skills — Flying Sword first, then Gladius Divinus. It pairs with Verdant Embryo, her defense treasure: Verdant Embryo adds Flying Sword COUNT while Mystic Emerald raises what each sword HITS for, so the two multiply rather than overlap.',
  },
  {
    key: 'rune-mystic-emerald-tiers',
    category: 'runes',
    text: 'Mystic Emerald (Wind treasure/rune for Sword Saint) — its six skill tiers in order: green, Sword Saint ATK +5%; blue, Sword Saint ATK +10%; purple, Sword Saint Flying Sword Final DMG +20%; orange, that Flying Sword Final DMG increases to +40%; red, Sword Saint Gladius Divinus Final DMG +20%; white, that Gladius Divinus Final DMG increases to +40%.',
  },
  {
    key: 'rune-vinewheel-timepiece-identity',
    category: 'runes',
    text: 'Vinewheel Timepiece is the Wind ELEMENT-WIDE Treasure (rune) in Wittle Defender — the Wind counterpart to Ice\'s Soulfrost Gyro. It names no hero and shows no hero portrait; it raises all Wind damage, so its value scales with how many Wind heroes are deployed. Its ladder is numerically IDENTICAL to Soulfrost Gyro\'s, which is good evidence every element\'s element-wide treasure uses the same 2/5/8/11/15/20 progression.',
  },
  {
    key: 'rune-vinewheel-timepiece-tiers',
    category: 'runes',
    text: 'Vinewheel Timepiece (Wind element-wide treasure/rune) — its six skill tiers in order, each REPLACING the previous value rather than stacking: green, Wind DMG +2%; blue, +5%; purple, +8%; orange, +11%; red, +15%; white, +20%. So fully upgraded it is +20% Wind DMG in total, not the sum of the six lines.',
  },
  {
    key: 'rune-wild-fruit-identity',
    category: 'runes',
    text: 'Wild Fruit is a Wind Treasure (rune) in Wittle Defender that buffs Swordmaster. It is his ATTACK treasure and a pure damage ladder on his Whirlwind Slash and Blade Storm, finishing on Blade Storm\'s blade wind specifically. Swordmaster\'s own kit is defensive (his passive gives Team DEF), so this treasure is what turns him into a damage contributor rather than only a wall.',
  },
  {
    key: 'rune-wild-fruit-tiers',
    category: 'runes',
    text: 'Wild Fruit (Wind treasure/rune for Swordmaster) — its six skill tiers in order: green, Swordmaster ATK +5%; blue, Swordmaster ATK +10%; purple, Swordmaster Whirlwind Slash and Blade Storm Final DMG +20%; orange, that Final DMG increases to +40%; red, Swordmaster Blade Storm\'s blade wind Final DMG +20%; white, that Blade Wind Final DMG increases to +40%.',
  },
  {
    key: 'rune-treant-golem-identity',
    category: 'runes',
    text: 'Treant Golem is a Wind Treasure (rune) in Wittle Defender that buffs Demon Hunter. It is her DEFENSE treasure by its HP% opening, but its real payload is offensive and unusual: Musket Penetration +3, then bonus damage against high-health enemies with the threshold loosening from 80% HP to 60% HP. That makes it an opener/boss treasure rather than a sustain one.',
  },
  {
    key: 'rune-treant-golem-tiers',
    category: 'runes',
    text: 'Treant Golem (Wind treasure/rune for Demon Hunter) — its six skill tiers in order: green, Demon Hunter HP +5%; blue, Demon Hunter HP +10%; purple, Demon Hunter Musket Penetration +1; orange, that Musket Penetration increases to +3; red, Demon Hunter\'s bullets deal extra massive DMG to enemies above 80% HP; white, that extra-DMG threshold reduces to 60% HP.',
  },
  {
    key: 'rune-gale-colossus-identity',
    category: 'runes',
    text: 'Gale Colossus is a Wind Treasure (rune) in Wittle Defender that buffs Cat Assassin. It is her ATTACK treasure and a straight damage ladder on her Dart and Explosive Dart, rising to +40% Final DMG with no mechanic changes.',
  },
  {
    key: 'rune-gale-colossus-tiers',
    category: 'runes',
    text: 'Gale Colossus (Wind treasure/rune for Cat Assassin) — its six skill tiers in order: green, Cat Assassin ATK +5%; blue, Cat Assassin ATK +10%; purple, Cat Assassin Dart and Explosive Dart Final DMG +10%; orange, that Final DMG increases to 15%; red, it increases to 25%; white, it increases to +40%.',
  },
  {
    key: 'rune-zephyr-cone-identity',
    category: 'runes',
    text: 'Zephyr Cone is a Wind Treasure (rune) in Wittle Defender that buffs Cat Assassin. It is her DEFENSE treasure by its HP% opening, but its upper tiers are the most mechanically interesting of any Wind treasure captured: a chance to inflict Armor Break (enemy DEF down 10%), extra giant piercing darts every 20 darts, and finally those giant darts becoming boomerangs. The Armor Break is a team-wide benefit since it lowers the target\'s DEF for everyone.',
  },
  {
    key: 'rune-zephyr-cone-tiers',
    category: 'runes',
    text: 'Zephyr Cone (Wind treasure/rune for Cat Assassin) — its six skill tiers in order: green, Cat Assassin HP +5%; blue, Cat Assassin HP +10%; purple, Cat Assassin ATK has a chance to inflict Armor Break reducing the target\'s DEF by 10% for 4s; orange, Armor Break duration +2s; red, every 20 of Cat Assassin\'s Darts released trigger 3 extra giant piercing darts; white, the giant piercing dart becomes a giant piercing boomerang.',
  },

  {
    key: 'rune-aerolux-identity',
    category: 'runes',
    text: 'Aerolux is a Wind Treasure (rune) in Wittle Defender that buffs Swordmaster. It is his DEFENSE treasure and the one that actually fits his job: it extends Whirlwind Slash duration, cuts the damage he takes by 20% while Whirlwind is active, and at its top tier makes every Whirlwind hit stack the target\'s DMG taken by 5%. That last tier is a TEAM damage amplifier, so a treasure filed under defense ends up buffing everyone\'s damage.',
  },
  {
    key: 'rune-aerolux-tiers',
    category: 'runes',
    text: 'Aerolux (Wind treasure/rune for Swordmaster) — its six skill tiers in order: green, Swordmaster HP +5%; blue, Swordmaster HP +10%; purple, Swordmaster Whirlwind Slash Duration +10%; orange, that duration increases to +20%; red, when Whirlwind is active Swordmaster reduces DMG taken by 20%; white, each hit by Swordmaster\'s Whirlwind Slash increases the target\'s DMG taken by 5% for 5s, stackable.',
  },
  {
    key: 'rune-verdant-skyplume-identity',
    category: 'runes',
    text: 'Verdant Skyplume is a Wind Treasure (rune) in Wittle Defender that buffs Demon Hunter. It is her ATTACK treasure and a straight damage ladder on her Musket Burst and Musket Frenzy, rising to +40% Final DMG with no mechanic changes. It is the partner to Treant Golem, her defense treasure.',
  },
  {
    key: 'rune-verdant-skyplume-tiers',
    category: 'runes',
    text: 'Verdant Skyplume (Wind treasure/rune for Demon Hunter) — its six skill tiers in order: green, Demon Hunter ATK +5%; blue, Demon Hunter ATK +10%; purple, Demon Hunter Musket Burst and Musket Frenzy Final DMG +10%; orange, that Final DMG increases to 15%; red, it increases to 25%; white, it increases to +40%.',
  },
  {
    key: 'rune-dreamy-dragon-egg-identity',
    category: 'runes',
    text: 'Dreamy Dragon Egg is a Wind Treasure (rune) in Wittle Defender that buffs Night Baron. It is his ATTACK treasure and a pure damage ladder across both of his thrust skills — Thrust first, then Tempest Thrust — with no mechanic changes.',
  },
  {
    key: 'rune-dreamy-dragon-egg-tiers',
    category: 'runes',
    text: 'Dreamy Dragon Egg (Wind treasure/rune for Night Baron) — its six skill tiers in order: green, Night Baron ATK +5%; blue, Night Baron ATK +10%; purple, Night Baron Thrust Final DMG +20%; orange, that Thrust Final DMG increases to +40%; red, Night Baron Tempest Thrust Final DMG +20%; white, that Tempest Thrust Final DMG increases to +40%.',
  },
  {
    key: 'rune-owlbeast-codex-identity',
    category: 'runes',
    text: 'Owlbeast Codex is a Wind Treasure (rune) in Wittle Defender that buffs Night Baron. It is his DEFENSE treasure by its HP% opening, but everything above that is a team-wide debuff engine: Night Baron gains a chance to inflict Armor Break that cuts the target\'s Damage Reduction, then that Armor Break also applies Laceration damage-over-time. Lowering an enemy\'s damage reduction helps every hero attacking it, not just Night Baron.',
  },
  {
    key: 'rune-owlbeast-codex-tiers',
    category: 'runes',
    text: 'Owlbeast Codex (Wind treasure/rune for Night Baron) — its six skill tiers in order: green, Night Baron HP +5%; blue, Night Baron HP +10%; purple, Night Baron ATK has a chance to inflict Armor Break reducing the target\'s Damage Reduction by 6% for 4s; orange, that Armor Break effect increases to 12%; red, Night Baron\'s Armor Break also applies Laceration dealing DMG per second; white, that Laceration duration is +2s.',
  },

  // ── Treasures (runes) — Xenoscape ───────────────────────────────────────
  // Captured from the Shop's Reward Preview rather than the treasure bag, so
  // these are game data, NOT things this player owns. See runes-coverage-caveat.
  {
    key: 'rune-galactic-heart-identity',
    category: 'runes',
    text: 'Galactic Heart is a Xenoscape Treasure (rune) in Wittle Defender that buffs Starlight Weaver. It is her ATTACK treasure: Comet damage first, then two tiers that raise the damage of whichever hero she has designated as her Proxy after they unleash their Exclusive Weapon skill. Because the Proxy is the team\'s highest-attack hero, those tiers are effectively a buff to the team carry rather than to Starlight Weaver herself.',
  },
  {
    key: 'rune-galactic-heart-tiers',
    category: 'runes',
    text: 'Galactic Heart (Xenoscape treasure/rune for Starlight Weaver) — its six skill tiers in order: green, Starlight Weaver ATK +5%; blue, Starlight Weaver ATK +10%; purple, Comet Final DMG +30%; orange, after the Proxy unleashes the Exclusive Weapon skill their damage is increased by 15% for 10s; red, Comet\'s Final DMG increases to +50%; white, that Proxy damage increase goes to 30% for 10s.',
  },
  {
    key: 'rune-galactic-spark-identity',
    category: 'runes',
    text: 'Galactic Spark is a Xenoscape Treasure (rune) in Wittle Defender that buffs Starlight Weaver. It is her DEFENSE treasure and the only treasure captured so far that grants a SHIELD: its upper tiers heal both her and her Proxy, then layer a stacking absorb shield worth 3.5% of her max health per layer, up to 3 layers. It is genuinely defensive, unlike most treasures filed under that label.',
  },
  {
    key: 'rune-galactic-spark-tiers',
    category: 'runes',
    text: 'Galactic Spark (Xenoscape treasure/rune for Starlight Weaver) — its six skill tiers in order: green, Starlight Weaver HP +5%; blue, Starlight Weaver HP +10%; purple, when the Proxy recovers Exclusive Weapon Energy they restore health equal to 8% of the Starlight Saintess\'s maximum health; orange, that healing increases and restores both herself and the Proxy at once; red, that healing also grants a shield absorbing 3.5% of her maximum health per layer, up to 3 layers for 10s, with stacking refreshing the duration; white, the damage resisted by the shield is doubled.',
  },
  {
    key: 'rune-phase-anchor-identity',
    category: 'runes',
    text: 'Phase Anchor is a Xenoscape Treasure (rune) in Wittle Defender that buffs Void Witch. It is her DEFENSE treasure by its HP% opening, but its upper tiers build a self-sustaining loop: summoning Piercing Sight also creates a Planar Rift dealing continuous AoE damage, and later the Planar Rift creates Piercing Sight in return, at double speed.',
  },
  {
    key: 'rune-phase-anchor-tiers',
    category: 'runes',
    text: 'Phase Anchor (Xenoscape treasure/rune for Void Witch) — its six skill tiers in order: green, Void Witch HP +5%; blue, Void Witch HP +10%; purple, summoning Piercing Sight will also create a Planar Rift dealing continuous AoE DMG; orange, Planar Rift DMG doubles; red, the Planar Rift will itself create Piercing Sight; white, the Planar Rift creates Piercing Sight at twice the original speed.',
  },
  {
    key: 'runes-xenoscape-roster',
    category: 'runes',
    text: 'Xenoscape Treasures (runes) captured so far in Wittle Defender, by the hero each buffs — Starlight Weaver: Galactic Heart (attack) and Galactic Spark (defense); Void Witch: Phase Anchor (defense). Void Witch\'s attack treasure and the Xenoscape element-wide treasure have not been captured, and nor has anything for any other Xenoscape hero. These came from the Shop reward-preview catalogue, so they are game data rather than a list of what any one player owns.',
  },

  // ── Treasures (runes) — known by name only, ladder NOT captured ─────────
  // Read off the Total Treasure Bonus summary, which shows only the tiers
  // already unlocked on the account. Hero, element and attack/defense role are
  // solid; the six-tier ladder is not, so the fact says so rather than
  // presenting a partial ladder as complete.
  {
    key: 'rune-phoenix-gilded-crown-identity',
    category: 'runes',
    text: 'Phoenix Gilded Crown is a Treasure (rune) in Wittle Defender that buffs Monkey King, whose in-game name Sun Wukong is what the treasure text uses. Monkey King is a Xenoscape hero. It is his ATTACK treasure: Sun Wukong ATK +5% then +10%, and above that his Celestial Crush skill gains Final DMG +25%. Its remaining skill tiers have NOT been captured, and his defense treasure has not been found — say so rather than guessing.',
  },
];
