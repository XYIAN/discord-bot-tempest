# Writing knowledge facts

Read this before adding a batch of facts to `src/features/ai/seed-facts.ts`.

Fact keys are not just identifiers any more — **retrieval reads them**. A key
written in the wrong shape still stores fine and still shows up in `/fact list`,
but it quietly loses the machinery that makes the bot answer well. Nothing
fails; answers just get worse.

## The key convention

```
hero-<hero-name>-<aspect>      hero-blazing-archer-passive
                                hero-night-baron-main-skill
                                hero-draconic-empress-ascend-1-2
```

`<hero-name>` is the hero's name in lowercase with dashes. `<aspect>` can be any
number of words — `passive`, `main-skill`, `ascend-1-2`, `synergy-atkspd` all
work.

**Every hero needs exactly one `hero-<name>-identity` fact.** That is not a
style rule. `heroRosterFrom()` builds the roster by collecting identity keys, and
`heroSlugForKey()` matches every other key against that roster by longest name.
A hero with no identity fact is not in the roster, so:

- naming him in a question will not pull his other facts in,
- his abbreviation will not resolve (`SW`, `BA`, …),
- his facts fall back to plain keyword scoring.

Non-hero keys are free-form: `elements-list`, `star-unlock-ladder`,
`exweapon-swordmaster`. Only use the `hero-` prefix for facts about a specific
hero — `hero-level-vs-stars` is a general levelling mechanic and is correctly
excluded from the roster, but the prefix is misleading. Prefer `level-vs-stars`
for new general facts.

## What retrieval does with them

Today the whole corpus (~108k chars) fits inside the 140k budget, so every fact
goes into every prompt and none of this matters. It starts mattering the moment
the corpus outgrows the budget — which is the point of writing it down now.

When selection engages:

1. **The spine** always goes in — see `SPINE_KEYS` in `retrieval.ts`. These are
   facts needed to read every other fact: the abbreviation table, the element
   vocabulary, the role-reading guidance, and the list of what the bot has no
   data on.
2. **Named heroes** contribute their whole family. Naming a hero anywhere in the
   recent conversation pins every `hero-<that-name>-*` fact.
3. **Everything else** is scored on distinct keyword overlap and filled to
   budget. Zero-scoring facts are never included — the prompt is not padded.

## Rules learned the hard way

**Write the fact that answers the question, not only the mechanics.** The bot
called Blazing Archer a "main damage dealer" for days while holding every one of
his mechanics, because no fact said what his *job* was. If a question keeps
coming out wrong after you have confirmed the facts reach the prompt, add a fact
stating the conclusion. An instruction competes with everything else in the
prompt; a fact is what the bot is already told to answer from.

**Keep `gap-runes-treasures-pantheon` honest.** It is in the spine and tells the
bot what it does *not* know, which is why it says "I don't have any data yet on
runes" rather than inventing them. The moment you add facts on one of those
topics, remove that topic from the gap fact **in the same commit**. A test
enforces this and will tell you.

**A fact supplies data; a rule asks for behaviour; only code guarantees it.**
Proved three times. Hero abbreviations needed all three: the table as a fact, a
prompt rule to look it up, and finally `abbreviations.ts` resolving them before
the model sees the message. If the thing you need is a *lookup* or a *format*
guarantee, go straight to code.

## Checklist

- [ ] Every new hero has a `hero-<name>-identity` fact.
- [ ] Keys use the `hero-<name>-<aspect>` shape; general facts avoid the prefix.
- [ ] Keys are never renamed — they tie the entry to the fact already in the
      store. Edit `text` freely.
- [ ] If you covered a topic listed in the gap fact, update the gap fact too.
- [ ] `npm run typecheck && npm test && npm run lint` all pass.
- [ ] `npx tsx src/scripts/retrieval-report.ts "a question a member would ask"`
      shows the fact reaching the prompt.
