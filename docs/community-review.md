# Community review maintenance audit

## 1.7.2: plain-string setting labels

The official ESLint 0.4.2 result improves from 51 to **35 warnings**, still **0
errors**. API warnings fall from 41 to **25**. Stylelint remains at 0 errors and
0 warnings. No lint configuration, API-version override, or suppression changes.

Sixteen plain-string labels now use public `Setting.then` and
`Setting.nameEl.setText` instead of the overloaded `Setting.setName` method.
The string overload is documented since 0.9.7, but the scanner overwrites its
annotation with the later DocumentFragment overload's 0.12.16. Both the public
name element (0.9.7) and chaining callback (0.9.20) predate the unchanged 0.12.0
minimum. Installed Obsidian 1.14.4's implementation of setName performs exactly
nameEl.setText and returns the setting; this patch uses that same plain-text DOM
operation, not an alias that hides the original API call. Labels, controls,
callbacks, defaults, persistence, and order are unchanged.

The remaining API warnings are 11 ButtonComponent.onClick, 8
MetadataCache.getFirstLinkpathDest, and 6 Editor.transaction references. The first
owns host callback behavior, the second owns relative/ambiguous link resolution,
and the third owns atomic editing and undo grouping. Replacing them merely to
silence the scanner would risk functional changes. Existing capability/version
guards and legacy fallback remain unchanged. The official rule exposes no
per-member exception; bypassing its restriction on inline suppression is not used.

Historical SDK declarations corroborate that the signatures are old, but npm SDK
package versions are not proof of corresponding app-runtime versions. The
[official API changelog](https://github.com/obsidianmd/obsidian-api/blob/master/CHANGELOG.md)
distinguishes app versions from available SDK package versions. No native 0.12
compatibility certification or assertion that every remaining annotation is wrong
is made here. The other 10 advisories from 1.7.1 are unchanged.

Validation includes 179 runtime/regression tests, covering all sixteen exact label
strings, settings render order/defaults/repeated display, sanitization, validation,
persistence, and manual/batch controls; 20 release-policy tests; typecheck; official
lint/stylelint; and production build. Current SDK declarations and a native modern
host do not certify all historical or mobile runtimes.

## 1.7.1 audit record

2026-10-15; patch 1.7.1. No whole-vault experimental code is included.

### Reproducible checks

Use Node 24, `npm ci`, `npm test`, `node --test tests/release-automation.mjs`,
`npm run typecheck`, `npm run lint`, and `npm run build`.

`eslint.config.mjs` follows the official
[scanner configuration](https://github.com/obsidianmd/eslint-plugin/blob/master/docs/configuration.md)
with eslint-plugin-obsidianmd 0.4.2. The documented scanner makes non-security
rules advisory and excludes noisy type rules plus rules handled independently.
We additionally retain all eslint-comments requirements as errors, including the
original missing-description error. No plugin-specific rule suppression is added.
Manifest metadata is checked by regression and release-asset/version validation.
Stylelint uses stylelint-config-obsidianmd 0.1.0 without rule overrides.

The ESLint package has a stale exact Obsidian peer requirement. The narrowly scoped
npm override uses this project's existing official SDK 1.14.4; it does not downgrade
the plugin API or require legacy-peer-deps. Clean npm ci is verified. Tooling is
build-only and not bundled into the plugin. ESLint 9 remains necessary for this
plugin's declared @eslint/js 9 peer range; npm reports its upstream deprecation.

### Remaining advisory warnings

Local official-rule scan: 0 errors and 51 warnings, not a claim of a warning-free
Community review. Stylelint: 0 errors and 0 warnings.

- 41 API-version advisories concern Setting.setName, ButtonComponent.onClick,
  MetadataCache.getFirstLinkpathDest, and Editor.transaction. The official published
  [obsidian 0.12.0 SDK](https://registry.npmjs.org/obsidian/-/obsidian-0.12.0.tgz)
  declares all four: lines 2378, 354, 1788, and 741 respectively. The declaration
  file SHA256 is `322ecc45fadd17812876744f2c858e26e1e7f0862bc6289826ba92305a72f0c9`.
  Current setName string overload is marked 0.9.7 while its fragment overload is
  0.12.16. The scanner builds one date per member and later overloads overwrite
  earlier entries, rather than checking the invoked signature. These declaration
  facts support keeping the existing minimum; they do not certify every historical
  native runtime. Transaction capability checks and legacy replaceRange fallback
  remain unchanged even though current SDK annotations say 0.13.0.
- 4 paste/drop advisories ask for inline defaultPrevented and preventDefault.
  These handlers observe native insertion; they do not replace insertion. The
  controller checks defaultPrevented after invalidating any older insertion proof.
  An early return in the registration would skip that invalidation, and calling
  preventDefault would block native paste/drop. Tests exercise both handled and
  unhandled events and prohibit preventDefault. Modern event registration remains
  behind the 1.1.1 and capability gates; nested checks preserve hosts where
  requireApiVersion is absent.
- 1 trash advisory suggests FileManager.trashFile. Its preference-following
  behavior would change the explicit Cancel and Delete contract, which guarantees
  recoverable vault `.trash` via Vault.trash(file, false), with no permanent-delete
  fallback. Existing deletion regressions keep this invariant.
- 1 settings-definition advisory suggests the optional 1.13+ settings search API.
  The imperative settings/defaults remain unchanged in this patch. Adding search
  integration would be a separate feature rather than a fake empty method.
- 4 sentence-case advisories concern a literal regex example, an exact filename
  prefix, and named host settings. They are not errors;
  mechanically applying suggested capitalization could misdescribe literals.

The separate review's full-vault enumeration recommendation is not emitted by this
local scanner. The bounded discard snapshot intentionally inventories all files
for reference safety and indexed/physical consistency; it is not a path lookup.
It remains unchanged. Optional build attestations are not introduced: they would
require additional Actions permissions/access and are not necessary to fix the
reported error. Publication still uses the existing job-scoped GITHUB_TOKEN only.

### Scope of verification

175 automated runtime/regression cases, 20 release-automation policy cases,
typecheck, official lint/stylelint, production build, and exact release-asset
checks pass. Automated mocks are not a native 0.12 runtime certification.
A fresh Community result is required before deciding any follow-on patch.
