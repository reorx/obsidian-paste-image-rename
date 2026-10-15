# Whole-vault naming conflict experiment (#73 / #78)

## Result

The existing filename renderer is sufficient to expose the unresolved policy boundary. Repeating the current-note command over a vault would not safely define a shared attachment's name: source note order can change the result, and dynamic/original-name tokens introduce additional instability. This experiment supplies concrete examples; it does **not** implement a vault-wide command or choose a source-precedence rule.

Verified against commit `1bb135b5bb79f7459366fb5bd284b50db6fdb919`, Node `v24.19.0`, on 2026-10-15. The probe passed **112 assertions**, including fixture validation, with **zero mutation API attempts**. There are **17 reported observations/counterexamples**, not 112 scenarios. Each run emits its exact source hashes and full output as JSON.

## Run

From a checkout with its existing npm dependencies already installed:

```sh
node tests/manual/reference-graph/probe.mjs "$PWD" > /tmp/pir-reference-graph-results.json
```

No packages are installed. The script bundles the checkout's actual `src/main.ts`, `src/template.ts` and `src/rename-core.ts` in memory using its existing esbuild dependency and `tests/obsidian-mock.ts`. It invokes `generateNewName`, one read-only `deduplicateNewName`, and the pure `allocateName` helper. It never invokes the current-note batch or any rename operation. All note/attachment objects and caches are immutable in-memory fixtures; action APIs throw if reached. Runtime output is stdout. The only fixture directories are path strings: no synthetic vault is created on disk.

UUID values will differ between runs. All other recorded observations should reproduce exactly against this source. Assertions check the UUID version, repeated-token equality, HEX correspondence, and observed regeneration rather than expecting a particular random identifier.

## Concrete observations

| Case | Original target | Proposed basename(s) | Meaning |
| --- | --- | --- | --- |
| Unique source `Alpha.md` | `assets/raw.png` | `Alpha.png` | One source-derived proposal |
| Shared target, matching `imageNameKey` | `assets/shared.png` | `Shared.png` from both sources | One identity, two agreeing sources; it should not be treated as two independent files |
| Shared target, `fileName` | `assets/shared.png` | `Alpha.png`, `Beta.png` | No unique answer without a policy |
| Shared target, frontmatter `project` | `assets/shared.png` | `Red.png`, `Blue.png` | Frontmatter can disagree independently of note names |
| Shared target, `nearestHeading` | `assets/shared.png` | `Alpha Section.png`, `Beta Section.png` | Heading choice is source-note-specific |
| Repeated references in one note | `assets/repeat.png` | `Earliest Link.png` | Three references become one source/target pair; the earliest resolved link or embed determines heading, even if embeds are returned out of order |
| Same basename in different directories | `a/assets/same.png`, `b/assets/same.png` | `Shared.png` each | Targets remain separate identities and proposals stay `a/assets/Shared.png` / `b/assets/Shared.png` |
| Existing filename collision | `assets/raw.png`, alongside `assets/Alpha.png` | Raw `Alpha.png`; allocator `Alpha-1.png` | Rendering alone is not collision allocation |
| Two new targets seek one name | `assets/one.png`, `assets/two.png` | `Shared.png`, `Shared-1.png` | Reversing allocation order changes which target gets the unnumbered name |
| Shared original-name token | `assets/shared.v1.png` | `shared.v1.png` | `attachmentName` / `originalAttachmentFileName` agree because they use the same pre-operation file stem |
| Source prefix + original name | `assets/shared.v1.png` | `Alpha-shared.v1.png`, `Beta-shared.v1.png` | Prefixing still conflicts; chaining hypothetical subsequent inputs produces `Beta-Alpha-shared.v1.png` versus `Alpha-Beta-shared.v1.png` |
| Single DATE snapshot | `assets/shared.v1.png` | `snapshot1-snapshot1.png` from both sources | One explicit clock object keeps both DATE tokens and all sources consistent; a new snapshot produces `snapshot2-snapshot2.png` |
| UUID + HEX | `assets/shared.v1.png` | Fresh identifier per renderer call | Two UUID tokens agree within one call and HEX is the same identifier without hyphens; rendering the same target/source again produces a new value |

Every proposed path retains the original attachment directory. No move, folder creation, filename change, byte change or link rewrite occurred.

`originalAttachmentName` is **not** a currently supported token. Its literal output is `{{originalAttachmentName}}.png`. The supported alias is `originalAttachmentFileName`; both supported original-name aliases yield the stem without extension before the normal extension append. There is no historical-name database.

## Why iteration is not a policy

For the shared `fileName` case, first-source-wins gives `Alpha.png` for Alpha→Beta and `Beta.png` for Beta→Alpha. Last-source-wins does the reverse. The experiment lists these as counterexamples only; it neither selects nor implements either rule. The set of unresolved source proposals stays the same when enumeration order is reversed.

A naive per-source dry run also makes a source-independent UUID pattern appear to conflict because each call draws new randomness. A preview cannot simply rerender names when the user clicks Apply: the displayed name and applied name could differ. The same problem can occur when DATE changes between preview and execution, or an original-name token reads a filename that an earlier operation already changed.

## Safest proposal to put to the maintainer

1. **Shared attachment conflict handling:** recommend showing every source-derived proposal, keeping the attachment unchanged until the user explicitly chooses a source/name, and allowing agreeing sources to produce only one operation for that exact target. A deterministic automatic source rule is possible, but it must be a deliberate, documented choice. Lexical/scan order alone should not silently become ownership.
2. **Preview/freeze contract:** recommend a complete same-directory preview followed by explicit Apply. Capture original attachment identity/name, source context and a single run timestamp once. After source/name selection, generate any UUID/HEX once per unique attachment and freeze the final displayed basename, including collision suffix. Applying should consume that exact plan rather than render again. A later new plan may intentionally get new DATE/UUID values.

These are recommendations for a decision, not implemented defaults. Before building Apply, a design must also settle:

- Which references are in scope: embedded images only like today's current-note command, or other links/attachment types; how excluded, unresolved and link-only references affect discovery and shared-source review.
- Which deterministic within-directory allocation order owns the unnumbered name when distinct targets request the same basename, and how existing numbered files, cross-extension settings and folders participate.
- How stale source/target identity, changed references/settings, or newly occupied destinations invalidate the preview; what partial completion, cancellation, resume and recovery mean.

A safe initial product scope could leave conflicts unresolved and require a fresh preview after relevant changes, but that scope needs approval. This experiment does not add a planner, apply phase, recovery mechanism or UI.

## Verification limits

This is a synthetic reference-graph experiment against the actual renderer/allocator, with Obsidian host APIs mocked. It does not prove real-vault metadata completeness, native Obsidian link repair, link updates after sequential changes, Windows/macOS/mobile filesystem behavior, cancellation, rollback, or application-wide safety. The clock is deliberately synthetic and verifies reuse, not Moment parsing/timezone formatting. UUID difference is an observed random outcome, not a mathematical uniqueness guarantee.

The probe does not read a real vault, inspect user attachments, mutate the repository, or change GitHub. Issues #73 and the whole-vault portion of #78 remain unresolved feature decisions. The source tree and release artifact are untouched by this experiment.

## Source pointers

- [`generateNewName` and per-note clock capture](https://github.com/reorx/obsidian-paste-image-rename/blob/1bb135b5bb79f7459366fb5bd284b50db6fdb919/src/main.ts#L392-L501)
- [Template token and UUID scope](https://github.com/reorx/obsidian-paste-image-rename/blob/1bb135b5bb79f7459366fb5bd284b50db6fdb919/src/template.ts)
- [Collision allocator and filename-only policy](https://github.com/reorx/obsidian-paste-image-rename/blob/1bb135b5bb79f7459366fb5bd284b50db6fdb919/src/rename-core.ts)
