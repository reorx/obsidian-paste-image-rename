# Obsidian SDK audit and bounded modernization

Audited 2026-10-15, after release 1.7.0. Baseline: e9242f44aea915b6768f1eca891deeb228127cfd.
This is an unreleased maintenance change; package/manifest remain 1.7.0 and minAppVersion remains 0.12.0.

## Official sources and compatibility

- [Official SDK source](https://github.com/obsidianmd/obsidian-api/blob/master/obsidian.d.ts) and [package metadata](https://github.com/obsidianmd/obsidian-api/blob/master/package.json): current version **1.14.4**, independently matched against the npm registry's latest version.
- [Official plugin guidelines](https://github.com/obsidianmd/obsidian-developer-docs/blob/main/en/Plugins/Releasing/Plugin%20guidelines.md) and [Vault guide](https://docs.obsidian.md/Plugins/Vault): reviewed lifecycle, active-editor modifications, file APIs, paths and resource handling.
- [Published SDK 0.12.0](https://www.npmjs.com/package/obsidian/v/0.12.0): inspected its registry tarball, not merely current declarations. Its obsidian.d.ts exports `moment_2 as moment` at lines 1906–1907 and exposes the text-component `inputEl` property at lines 197–201. Both replacement APIs are in the declared minimum-version SDK. This is API-contract evidence, not a native 0.12 runtime certification.

## Prioritized findings

### Implemented: remove unnecessary host-global and DOM-layout assumptions

1. **Date API:** replace `window.moment()` with the public `moment` export in template rendering and instant batch rename. Keep the same host-provided date library, formatting, timezone and local-time behavior. Do not bundle an independent runtime clock. Batch code still takes one timestamp before its first asynchronous rename and shares it across every generated name; separate batches acquire fresh timestamps.
2. **Input API:** capture `TextComponent.inputEl` inside `Setting.addText`, replacing four positional `controlEl.children[0]` casts (rename prompt plus three batch inputs). Focus, selection, change handling, Enter and composition handlers stay attached to the actual input even if the host inserts decorations or rearranges its setting DOM.
3. **Development SDK:** pin `obsidian` to 1.14.4 with a regenerated lockfile, updating only SDK/development dependencies and peers. The SDK is external in the production bundle. `npm ci --ignore-scripts` succeeded without changing the lockfile. No new runtime API requiring a newer minimum is introduced.

### Retain: current code already uses the appropriate public APIs

- Rename through `FileManager.renameFile` and generate links through `FileManager.generateMarkdownLink`, preserving Obsidian's link ownership.
- Use guarded Editor transactions for active-note changes, with the existing legacy rename fallback. Replacing these with background `Vault.process` writes would change editor/Undo behavior.
- Register create handling after layout readiness, register event cleanup, cancel pending timers and close owned modals on unload.
- Use direct file-path lookups and captured source/file identities rather than searching for a similarly named file.

### Deliberately deferred: behavior or compatibility would change

- **Private vault configuration:** `getVaultConfig` reads the undocumented `vault.config.alwaysUpdateLinks`. Current SDK still does not expose a typed public Vault getter for this value. Keep the existing links-disabled safeguard; do not replace it with another undocumented method or remove it merely to satisfy an API audit.
- **Adapter reads:** collision allocation and discard's physical-file verification deliberately inspect files/folders absent from the metadata index. Replacing these reads with cached Vault listings could miss collisions or references. No adapter mutations are added.
- **Trash:** preserve `vault.trash(file, false)` and its fail-closed checks. Routing through a preference-dependent deletion helper could change recovery guarantees. No permanent-delete fallback is permitted.
- **Paths:** do not mechanically substitute `normalizePath` for the filename validator/path helper. Normalization alters nonbreaking spaces and Unicode normalization and can hide forbidden separators before validation. Filenames must remain filename-only, with original directories retained.
- **New settings/command APIs:** declarative settings introduced in 1.13 and editor-only callbacks could change supported versions or command visibility. Keep current imperative settings and explicit guarded command behavior. No minimum-version bump is justified by this audit.
- The unused `cash-dom` dependency is a separate dependency-cleanup opportunity, not necessary for this SDK change; no unrelated dependency removal is included.

## Regression design and verification

The full suite now has **162 plugin tests**, up from 159, plus **20 release-policy tests**.

- The SDK clock mock is independent from `window.moment`; existing snapshot and repeated-render tests now inject this SDK clock.
- A real Moment fixed-offset test checks default clock lookup without any window, positive timezone offset, unchanged DATE/DATETIME output, empty-format literal behavior and the unchanged default filename template.
- A two-image batch crosses the clock's day boundary during awaited renames while `window.moment` is absent. Both names retain the initial timestamp and use the same existing collision numbering.
- Text-component mocks insert a host decoration before the input. Existing rename tests still cover input selection, original-name restoration, IME composition, validation, cancellation and duplicate submission. A new batch onOpen test checks all three inputs, change/Enter wiring and the existing composition guards.
- Existing tests remain the release gates for filename-only paths, concurrent rename allocation, stale source/target refusal, legacy editor fallback, conversion transactions and conservative discard behavior. Destructive implementation files are unchanged.

Passed: clean dependency install, typecheck, lint, all plugin tests, all release-policy tests, production build and diff whitespace checks. Independent review found no blocking issue.

Native smoke attempt: installed the verified candidate bundle in the existing isolated cloud test vault and launched Obsidian 1.14.4. The new SDK Smoke note rendered, and coordinate clicks opened the command palette. Supported keyboard/text APIs then failed with `AT-SPI provider with process ID 282 is unavailable for X11 window 46137348` through both app-bound CUA and Sky. Date renaming, Enter and IME composition were therefore **not verified natively**. Closed the test window and restored its prior plugin settings.

Limits: neither minimum-version runtime nor macOS/iOS is newly certified. Previous release native evidence is historical, not evidence for this changed bundle. No release/tag publication is part of this change.
