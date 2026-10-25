# Excalidraw dual-mode compatibility verification — 1.7.3

## Scope

Issue [#112](https://github.com/reorx/obsidian-paste-image-rename/issues/112) contains
multiple historical causes. This release addresses the independently reproduced
Excalidraw dual-mode Markdown exclusion, not every historical platform or plugin
conflict. PR #124 is diagnostic-only and is not merged as part of this fix.

The baseline source was `53161915f46ee0c13a728107f5aaee94882ca230` (1.7.2).
The supplied `just-testing.md` fixture was enriched with synthetic raster images.
No personal vault was used.

## Updated native baseline

Official stable Obsidian 1.14.5 was downloaded from
[the official release](https://github.com/obsidianmd/obsidian-releases/releases/tag/v1.14.5).
The Linux installer SHA256 matched the published asset digest:
`c37fb46a966f604823337fb36ab23bd1baf8ce912ec35af59d62358a93357bee`.
Native General settings showed both application and installer version 1.14.5.
Excalidraw was 2.29.0, matching the reporter.

Native Thunar file-copy / Control+V reproduced the bug before changes: a body paste
into the dual-mode note kept its timestamp name with no dialog. The identical
clipboard in ordinary Markdown opened the rename dialog and renamed successfully.
The drawing suffix and raster bytes were unchanged.

## Automated checks

- 205 runtime/regression tests passed, including 22 focused controller tests and
  four scoped integration checks.
- 20 release-policy tests passed using a mocked client, without publishing.
- Typecheck and production build passed.
- Community ESLint: 0 errors, 35 warnings (unchanged from 1.7.2); Stylelint clean.
  The new link-resolver callback is passed from the existing API-version-gated
  creation site. No new suppression or minimum-version increase was added.
- Independent review verified 1,003 differential bounded-decoder cases and
  adversarial link-reference cases, including titled extensionless destinations
  and reference definitions.
- Tests cover explicit boolean opt-in, BOM/CRLF, malformed or duplicate drawing
  sections, protected cursor positions, one trusted raster insertion, clipboard
  bytes, repeated creation, source/editor changes, expiry, cancellation, physical
  stat changes, shared/encoded/compressed links, async races, live drawing panes,
  export-name allocation, and unchanged batch/conversion/deletion guards.

## Release artifact

Production main.js SHA256:
`54ad1d259a975f5ac03c94ab0981618610c35ad08ee5aa883b58969893c0d537`.
The build includes the bounded LZ-string-compatible decoder's MIT attribution.
The upstream lz-string package is used only as a development test oracle.

## Exact-bundle native candidate checks

The exact release bundle above was installed in the isolated native Obsidian
1.14.5 vault and verified with Excalidraw 2.29.0:

- Opted-in body paste with Auto rename off opened the native modal; confirmation
  produced `assets/just-testing-6.png` and the correct saved body embed.
- Auto rename on produced `assets/just-testing-7.png` and the correct saved embed.
- The same clipboard in ordinary Markdown produced `assets/Control-4.png`.
- Without the opt-in property, the dual-mode note kept its timestamp filename.
- The entire `%%` Excalidraw data suffix was byte-identical through body-paste
  checks; both renamed PNGs retained the original fixture SHA256.
- Pasting in drawing mode kept its timestamp filename, without plugin rename.
  Reopening the drawing displayed its text and orange/cyan images; the exported
  SVG rendered them correctly.
- An earlier candidate's deliberately delayed confirmation beyond 30 seconds
  refused safely; a fresh immediate paste/confirmation succeeded. Expiry and
  cancellation were also checked in final-source automated tests.

## Safety boundaries and remaining limits

The feature is off by default and requires boolean `allow-paste-image-rename: true`
in the note's frontmatter, a real single-raster paste/drop, and a standard commented
Excalidraw data section. Complete confirmation within 30 seconds without changing
the note or view. Close all Excalidraw and Canvas panes, including background panes,
because their unsaved scenes are not inspected.

Reference checks cover indexed Markdown, Canvas, Excalidraw and SVG files and open
Markdown editors. Scan, decoder, and recursion bounds reject oversized or ambiguous
data. This is not a universal reference graph for unknown containers, external
applications, or unindexed files. Existing sources and drawing/export payloads
are not rewritten by the new path; Obsidian owns the new body-link update.

The current note's conventional same-basename PNG/SVG export names, including
light/dark forms, are reserved even before an export exists. This does not predict
arbitrary future exports from unrelated drawings. Attachment directories do not
change. General batch/conversion and Cancel and Delete drawing exclusions remain.

Local checks are not a claim that the remote Community scan has passed. Native
coverage is Linux Obsidian 1.14.5; macOS/mobile and minimum-version native runtimes
were not tested for this release.
