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

/**
 * The hero slug inside a seed key: `hero-night-baron-passive` → `night-baron`.
 *
 * The last segment is the aspect (identity/passive/synergy/chain/ascend/skins),
 * so everything between the prefix and it is the name.
 */
export function heroSlugFromKey(seedKey: string | undefined): string | undefined {
  if (!seedKey || !seedKey.startsWith(HERO_KEY_PREFIX)) return undefined;
  const rest = seedKey.slice(HERO_KEY_PREFIX.length);
  const lastDash = rest.lastIndexOf('-');
  if (lastDash <= 0) return undefined;
  return rest.slice(0, lastDash);
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

  const slugs = new Set<string>();
  for (const f of facts) {
    const slug = heroSlugFromKey(f.seedKey);
    if (slug) slugs.add(slug);
  }
  const named = heroesMentioned(queryText, slugs);

  // A hero named anywhere in the conversation gets their COMPLETE fact family.
  // Answering "is X any good?" needs identity, passive and synergy together;
  // retrieving one of the three produces a confident half-answer, which is
  // precisely the failure mode reported.
  const pinned: Fact[] = [];
  const rest: Fact[] = [];
  for (const f of facts) {
    const slug = heroSlugFromKey(f.seedKey);
    if (slug && named.has(slug)) pinned.push(f);
    else rest.push(f);
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
