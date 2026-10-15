# Community review maintenance audit

2026-10-15; patch 1.7.1. No whole-vault experimental code is included.

## Reproducible checks

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

## Remaining advisory warnings

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

## Scope of verification

175 automated runtime/regression cases, 20 release-automation policy cases,
typecheck, official lint/stylelint, production build, and exact release-asset
checks pass. Automated mocks are not a native 0.12 runtime certification.
A fresh Community result is required before deciding any follow-on patch.
