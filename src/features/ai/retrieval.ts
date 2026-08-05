import type { Fact } from './knowledge.js';

/**
 * How much fact text may go into one prompt.
 *
 * Was 12,000 against a corpus that had grown to ~105,000 characters, so roughly
 * 89% of what the bot knew was withheld from every single answer. That is the
 * root cause of the confidently-wrong answers members reported: the facts were
 * present and correct, they just never reached the model, and an LLM with no
 * fact fills the gap by inventing one.
 *
 * The sibling Archero 2 bot ships ~152,000 characters of knowledge on every
 * call and was measured recalling facts byte-perfectly from the start, middle
 * and end of that prompt, so this size is known-safe rather than hoped-safe.
 * Set high enough that the whole roster fits today; selection below only
 * engages once the corpus outgrows it.
 */
export const MAX_FACTS_CHARS = 140_000;

/** Facts for a hero named in the question are never dropped — see selectRelevantFacts. */
const HERO_KEY_PREFIX = 'hero-';

/**
 * Key prefixes whose families get pinned when the subject is named.
 *
 * Heroes were the only entity when this was written. Runes are the next import
 * and members already ask about them by name, so `rune-<name>-identity` gets the
 * same treatment: name a rune and its whole family arrives, exactly as naming a
 * hero does. Add a prefix here when a new entity type gets its own fact family.
 */
const ENTITY_PREFIXES = ['hero-', 'rune-'] as const;

/**
 * The spine: facts included in EVERY prompt, never subject to scoring.
 *
 * These are meta-knowledge the bot needs to read any other fact correctly, and
 * they lose keyword scoring precisely when they are most needed:
 *
 *  - the abbreviation table, because "SW" and "BA" are two characters and the
 *    tokenizer ignores anything that short. That gap is why the bot guessed
 *    "SW" meant Swordmaster when a member meant Starlight Weaver, then built a
 *    whole team around the wrong hero, with the wrong element and the wrong
 *    role.
 *  - the element vocabulary, because the game calls one element Electric,
 *    Electro and (for Frost) Ice, and without that the variants read as
 *    different elements.
 *  - what the bot does NOT have data on, so it keeps saying "I don't know"
 *    about runes and gear instead of inventing them once those questions stop
 *    scoring against anything.
 *
 * Together they cost roughly 3,000 characters — cheap insurance against the
 * failure modes that actually happened.
 */
const SPINE_KEYS = new Set([
  'hero-abbreviations',
  'hero-abbreviations-ambiguous',
  'elements-list',
  'element-naming-variants',
  'role-reading-a-heros-job',
  'strategy-element-team-discipline',
  'roster-by-element',
  'gap-runes-treasures-pantheon',
]);

/** Exported so a test can assert every spine key still exists in the corpus. */
export function spineKeys(): string[] {
  return [...SPINE_KEYS];
}

/** Words too generic to carry meaning; they made every long fact score. */
const STOPWORDS = new Set([
  'what', 'which', 'that', 'this', 'with', 'from', 'have', 'has', 'does', 'do',
  'the', 'and', 'for', 'are', 'is', 'was', 'were', 'about', 'tell', 'give',
  'best', 'good', 'better', 'should', 'would', 'could', 'can', 'you', 'your',
  'me', 'my', 'i', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'it', 'its',
  'how', 'why', 'when', 'who', 'whom', 'any', 'all', 'more', 'most', 'some',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * All-lowercase, letters and digits only.
 *
 * This is what makes "sword master" and "Swordmaster" the same string. Members
 * type hero names with spaces; the data spells several of them as one word.
 * Under plain token matching those share no token at all, so the question
 * "is sword master a xenoscape hero?" scored ZERO against the very fact stating
 * he is Mythic/Wind — and the bot answered from nothing.
 */
function squash(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Every hero has exactly one `hero-<slug>-identity` fact. That is the roster. */
const IDENTITY_SUFFIX = '-identity';

/**
 * The roster, derived from the data rather than hardcoded.
 *
 * Splitting a key on its last dash is wrong for the 57 keys whose aspect is two
 * words — `hero-blazing-archer-main-skill` gives `blazing-archer-main`, a slug
 * nobody types, so his MAIN SKILL would never be pinned when someone asks about
 * him. A fixed list of aspect suffixes is wrong too: the vocabulary is
 * open-ended (`synergy-atkspd`, `ascend-1-2`, `crowd-control`,
 * `heavy-strike-combo`), so it would need editing every time a fact is written.
 *
 * The identity keys are the one thing that IS reliable, so they define the
 * roster and everything else is matched against it. A new hero brings his own
 * identity fact and is picked up with no code change.
 */
export function heroRosterFrom(facts: Array<{ seedKey?: string }>): string[] {
  return entityRosterFrom(facts, HERO_KEY_PREFIX);
}

/** The roster for one entity type, e.g. `hero-` or `rune-`. */
export function entityRosterFrom(
  facts: Array<{ seedKey?: string }>,
  prefix: string,
): string[] {
  const roster: string[] = [];
  for (const f of facts) {
    const key = f.seedKey;
    if (!key || !key.startsWith(prefix) || !key.endsWith(IDENTITY_SUFFIX)) continue;
    const slug = key.slice(prefix.length, key.length - IDENTITY_SUFFIX.length);
    if (slug) roster.push(slug);
  }
  // Longest first so `fire-mage` wins over `fire` for hero-fire-mage-passive.
  return roster.sort((a, b) => b.length - a.length);
}

/**
 * Which hero does this key belong to? Longest matching roster slug wins.
 *
 * Returns undefined for keys that only look hero-shaped —
 * `hero-level-belongs-to-deployed-slot` is a general levelling mechanic, not a
 * hero called "level", and pinning it to a fake hero would be worse than
 * leaving it to ordinary keyword scoring.
 */
export function heroSlugForKey(
  seedKey: string | undefined,
  roster: readonly string[],
): string | undefined {
  return entitySlugForKey(seedKey, roster, HERO_KEY_PREFIX);
}

/** Which entity of this type does the key belong to? Longest name wins. */
export function entitySlugForKey(
  seedKey: string | undefined,
  roster: readonly string[],
  prefix: string,
): string | undefined {
  if (!seedKey || !seedKey.startsWith(prefix)) return undefined;
  const rest = seedKey.slice(prefix.length);
  for (const slug of roster) {
    if (rest === slug || rest.startsWith(`${slug}-`)) return slug;
  }
  return undefined;
}

/**
 * Which heroes does this text mention?
 *
 * Matches on the squashed form, so `night-baron` is found in "night baron",
 * "Night Baron", "nightbaron" and "night_baron" alike.
 */
export function heroesMentioned(text: string, slugs: Iterable<string>): Set<string> {
  const haystack = squash(text);
  const found = new Set<string>();
  for (const slug of slugs) {
    const needle = squash(slug);
    if (needle.length >= 4 && haystack.includes(needle)) found.add(slug);
  }
  return found;
}

/**
 * Choose the facts that go into the prompt.
 *
 * @param facts     approved facts
 * @param question  the member's current message
 * @param context   recent conversation text, oldest first. Retrieval used to
 *   score the CURRENT MESSAGE ONLY while the model was sent the whole
 *   conversation — so in a multi-turn thread about a lineup, the model kept
 *   discussing heroes whose facts had been dropped several turns earlier, and
 *   answered from its own earlier wording instead of from data. That is how
 *   "Blazing Archer is your main damage dealer" survived a correction: the
 *   member's message was about Scarlet Reaper, so Blazing Archer's team-buff
 *   passive was not in that prompt at all.
 */
export function selectRelevantFacts(
  facts: Fact[],
  question: string,
  context: string[] = [],
): Fact[] {
  const total = facts.reduce((n, f) => n + f.text.length, 0);
  if (total <= MAX_FACTS_CHARS) return facts;

  // The current question carries more weight than older turns, but older turns
  // still count — that is the whole point of passing them.
  const queryText = [question, question, ...context.slice(-4)].join(' ');
  const queryTokens = new Set(tokenize(queryText));

  // One roster per entity type, so naming a rune pins its family just as
  // naming a hero does.
  const rosters = ENTITY_PREFIXES.map((prefix) => ({
    prefix,
    roster: entityRosterFrom(facts, prefix),
  }));
  const named = new Map<string, Set<string>>(
    rosters.map(({ prefix, roster }) => [prefix, heroesMentioned(queryText, roster)]),
  );

  // A hero named anywhere in the conversation gets their COMPLETE fact family.
  // Answering "is X any good?" needs identity, passive and synergy together;
  // retrieving one of the three produces a confident half-answer, which is
  // precisely the failure mode reported.
  const pinned: Fact[] = [];
  const rest: Fact[] = [];
  for (const f of facts) {
    let isPinned = Boolean(f.seedKey && SPINE_KEYS.has(f.seedKey));
    if (!isPinned) {
      for (const { prefix, roster } of rosters) {
        const slug = entitySlugForKey(f.seedKey, roster, prefix);
        if (slug && named.get(prefix)?.has(slug)) { isPinned = true; break; }
      }
    }
    (isPinned ? pinned : rest).push(f);
  }

  const scored = rest
    .map((fact, index) => {
      // DISTINCT terms, so a long fact repeating "wind" five times no longer
      // outranks a short precise one purely by being long.
      const factTokens = new Set(tokenize(fact.text));
      let score = 0;
      for (const t of factTokens) if (queryTokens.has(t)) score += 1;
      return { fact, score, index };
    })
    // Stable: equal scores keep their original order instead of being shuffled
    // into an arbitrary one, which used to decide what filled the budget when
    // nothing matched.
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const selected: Fact[] = [];
  let used = 0;
  for (const f of pinned) {
    selected.push(f);
    used += f.text.length;
  }
  for (const { fact, score } of scored) {
    if (score === 0) continue; // never pad the prompt with irrelevant facts
    if (used + fact.text.length > MAX_FACTS_CHARS) continue;
    selected.push(fact);
    used += fact.text.length;
  }
  return selected;
}
