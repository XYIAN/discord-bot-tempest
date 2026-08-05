/**
 * Hero abbreviation resolution.
 *
 * Members write hero names as initials constantly — "SW is ideal", "is SR or BA
 * my main damage dealer". The bot had no abbreviation data and guessed: it read
 * SW as Swordmaster, called him a Xeno hero, and built a five-hero team around
 * that. The member meant Starlight Weaver, who genuinely IS Xenoscape while
 * Swordmaster is Wind, so one guess dragged the wrong element and the wrong role
 * through an entire recommendation.
 *
 * Putting the table in the facts was not enough — the model still has to decide
 * to look something up, and it kept pattern-matching instead (it moved from
 * Swordmaster to Monkey King, who is MK). Adding a prompt rule was not enough
 * either. So resolution happens HERE, in code, before the model sees anything:
 * deterministic, and stated at the top of the prompt rather than buried in a
 * 34-entry list at 99% depth.
 *
 * Same lesson as the sibling bot's price guard: a fact supplies the data, a rule
 * asks for the behaviour, and only code guarantees it.
 */

/** Initials for a hero slug: `starlight-weaver` → `SW`. */
export function initialsFor(slug: string): string {
  return slug
    .split('-')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export interface AbbreviationIndex {
  /** Initials that identify exactly one hero. */
  unique: Map<string, string>;
  /** Initials shared by several heroes — must be asked about, never guessed. */
  ambiguous: Map<string, string[]>;
}

/** Build the lookup from the roster, so a new hero needs no code change. */
export function buildAbbreviationIndex(roster: readonly string[]): AbbreviationIndex {
  const byInitials = new Map<string, string[]>();
  for (const slug of roster) {
    const ini = initialsFor(slug);
    // A single-word hero has one initial. "S" for Swordmaster is not something
    // anyone types to mean him specifically, and treating it as an abbreviation
    // would match the letter S anywhere.
    if (ini.length < 2) continue;
    byInitials.set(ini, [...(byInitials.get(ini) ?? []), slug]);
  }
  const unique = new Map<string, string>();
  const ambiguous = new Map<string, string[]>();
  for (const [ini, slugs] of byInitials) {
    if (slugs.length === 1) unique.set(ini, slugs[0]!);
    else ambiguous.set(ini, slugs);
  }
  return { unique, ambiguous };
}

export function displayName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface ResolvedAbbreviations {
  resolved: Array<{ abbr: string; hero: string }>;
  ambiguous: Array<{ abbr: string; options: string[] }>;
}

/**
 * Find abbreviations in a member's message.
 *
 * Only ALL-CAPS runs of 2–3 letters count, standing as their own word. That
 * deliberately ignores ordinary words — "the best team" contains no
 * abbreviation — while catching the shape members actually use.
 */
export function resolveAbbreviations(
  text: string,
  index: AbbreviationIndex,
): ResolvedAbbreviations {
  const resolved: ResolvedAbbreviations['resolved'] = [];
  const ambiguous: ResolvedAbbreviations['ambiguous'] = [];
  const seen = new Set<string>();

  for (const match of String(text ?? '').matchAll(/\b([A-Z]{2,3})\b/g)) {
    const abbr = match[1]!;
    if (seen.has(abbr)) continue;
    seen.add(abbr);
    const hero = index.unique.get(abbr);
    if (hero) {
      resolved.push({ abbr, hero: displayName(hero) });
      continue;
    }
    const options = index.ambiguous.get(abbr);
    if (options) ambiguous.push({ abbr, options: options.map(displayName) });
  }
  return { resolved, ambiguous };
}

/**
 * The line placed near the TOP of the system prompt when a message contains
 * abbreviations. Returns '' when there is nothing to say, so the prompt is
 * unchanged for the majority of questions.
 */
export function abbreviationNotice(r: ResolvedAbbreviations): string {
  const parts: string[] = [];
  if (r.resolved.length) {
    parts.push(
      `ABBREVIATIONS IN THIS MESSAGE, already resolved for you — use these exactly and do not substitute a different hero: ${r.resolved
        .map((x) => `${x.abbr} = ${x.hero}`)
        .join('; ')}.`,
    );
  }
  if (r.ambiguous.length) {
    parts.push(
      `AMBIGUOUS ABBREVIATIONS in this message — you MUST ask which hero is meant before answering: ${r.ambiguous
        .map((x) => `${x.abbr} could be ${x.options.join(' or ')}`)
        .join('; ')}.`,
    );
  }
  return parts.join(' ');
}
