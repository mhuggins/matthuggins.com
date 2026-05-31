---
name: format-blog-post
description: Format and polish a blog post for matthuggins.com — fix genuine spelling/grammar errors, replace em dashes with connecting words or punctuation, and check stylistic and first-person-pronoun consistency against the other published posts. Use when the user asks to format, polish, clean up, or proofread a blog post.
---

# Format Blog Post

Polish a single blog post in `apps/website/src/content/blog/` so it is error-free and consistent with the author's other published posts. The author has a strong, established voice — your job is to correct and align, **not** to rewrite.

## Inputs

The argument is a blog post file or name (e.g. `graphql-context`, `graphql-context.md`, or a full path). If no argument is given, ask which post to format.

Resolve it to a file under `apps/website/src/content/blog/`:
- Try the literal path first.
- Otherwise match against filenames in that directory (with or without the `.md` extension, allowing a partial/slug match). If multiple match, ask the user to pick.

## Hard rules (read before editing)

These reflect standing feedback from the author. Violating them means redoing the work.

1. **Preserve the author's voice.** Only change genuine errors. If a sentence is grammatical, leave it alone even if you would phrase it differently. Do not reword for "flow", concision, or because it "sounds better". When in doubt, leave it and flag it instead of changing it.
2. **No em dashes.** The author does not want em dashes (`—`) or en dashes used as em dashes (`–`) in prose, and does not want the `--` / `---` markdown em-dash sequence either. Replace each with whichever fits the sentence best: a connecting word (`since`, `because`, `so`, `and`, `but`, `which`), a comma, parentheses, a colon, a semicolon, or a sentence break. Match the connector to the logical relationship — e.g. a cause becomes `since`/`because`, an aside becomes parentheses or commas, an elaboration becomes a colon.
3. **Never touch non-prose.** Leave fenced code blocks, inline code spans (`` `...` ``), frontmatter values, URLs, link targets, and directly quoted material exactly as written. Em dashes and "typos" inside code or quotes stay.
4. **Edits only, no rewrites of structure.** Do not reorder sections, add or remove paragraphs, or change headings unless fixing an outright error.

## Procedure

### 1. Read the target post and establish the baseline

- Read the target post in full.
- Read the other **published** posts (`published: true` in frontmatter) in `apps/website/src/content/blog/` to learn the author's conventions. You do not need to read every word of all of them; sample enough to characterize voice, tone, terminology, formatting habits, and pronoun usage. A quick scan plus `grep` for specific patterns is fine.

### 2. Check the title and summary

Every post's frontmatter must have a `title` and a `summary`, and both must be meaningful — not empty, not a placeholder (e.g. `TODO`, `TBD`, `...`), and not a bare restatement of the slug.

- **Title:** a descriptive, specific headline. Compare against published titles for length and style (the author favors clear, concrete titles, sometimes with a colon-separated subtitle).
- **Summary:** a single sentence (roughly one to two lines) that conveys what the reader will get from the post, in the author's voice. Look at the `summary` field of published posts for tone and length.

If either is missing or a placeholder, draft a candidate from the post's actual content, in the author's voice, and **propose it to the user for approval** rather than committing it silently. If a title or summary exists and is already meaningful, leave it alone (per the preserve-voice rule). Only fix genuine errors in them (spelling, grammar, em dashes).

### 3. Fix spelling and grammar

Correct real errors only: misspellings (e.g. `prevolent` → `prevalent`), wrong/missing words, subject-verb disagreement, broken punctuation, doubled words. Honor the no-em-dash rule above. Do not "improve" grammatical sentences. Preserve American English and the author's existing capitalization/terminology (e.g. how they capitalize tool names).

### 4. Replace em dashes

Find every em dash, en-dash-as-em-dash, and `--`/`---` sequence **in prose** and replace per rule 2. Read the surrounding sentence to choose a replacement that keeps the original meaning and rhythm. Do not introduce a new em dash anywhere.

### 5. Check stylistic consistency

Compare the post against the published baseline for: tone (technical, direct, first-person narrative), sentence rhythm, how code is introduced, terminology, formatting of inline code and links, and heading style. Where the target post diverges in a way that reads as an inconsistency (not just a valid stylistic choice), **flag it for the user** rather than silently rewriting. Only apply changes that are clearly corrections; surface judgment calls.

### 6. Check first-person pronoun consistency

The author uses both "I/my/me" and "we/our/us", and the choice is meaningful, not random:
- **"I" / "my"** tends to carry personal experience, opinion, and history ("I've used npm for years", "I'm in love").
- **"we" / "our" / "let's"** tends to walk the reader through shared work ("we then wire up the resolver", "our context now has...").

Do two checks:
- **Within the post:** find places where the pronoun for the *same referent* flips inconsistently (e.g. switching between "I" and "we" for the same actor in the same context). Flag or fix these so each referent is consistent.
- **Against other posts:** confirm the post's pronoun usage matches how the author uses them elsewhere. If the post uses, say, "we" for something the author would normally narrate as "I" (or vice versa), flag it.

Where a pronoun change alters meaning or could go either way, ask the user instead of guessing.

### 7. Link to relevant internal posts

Whenever it fits naturally, link from the target post to one or more other published posts on the site. This helps readers and benefits SEO. This is **opportunistic, not forced** — only add a link where the surrounding prose already references a topic that another post covers, and the link reads as a natural fit. Never add a link just to hit a quota, and never reword or restructure a sentence to manufacture a place for one.

- Use the published posts you read in step 1 to know what internal topics exist.
- Internal blog post URLs are of the form `/blog/posts/{slug}`, where `{slug}` is the post's filename without the `.md` extension.
- Prefer linking an existing relevant phrase rather than appending "see my other post" boilerplate, so it matches the author's existing linking style. Check how the author already formats links in the published posts.
- If a good linking opportunity exists but you are unsure it fits, flag it for the user rather than inserting it.

## Output

1. Apply the safe corrections (spelling, grammar, em dashes, clear pronoun fixes) directly to the file with edits.
2. Report a concise summary grouped by category:
   - **Title/summary:** whether both are present and meaningful, and any proposed candidates awaiting approval.
   - **Spelling/grammar:** what was fixed.
   - **Em dashes:** how many replaced and the replacement chosen for each (or a sample if many).
   - **Style consistency:** anything flagged for the user's decision.
   - **Pronoun consistency:** fixes applied and anything flagged.
   - **Internal links:** any links to other published posts added (with the target slug), and any opportunities flagged for the user's decision.
3. For anything you flagged rather than changed, list it clearly so the user can decide. If any pronoun or style call is genuinely ambiguous, ask before applying.
</content>
</invoke>
