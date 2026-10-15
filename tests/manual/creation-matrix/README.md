# Creation lifecycle reproduction matrix

2026-10-15. Baselines: tag `1.6.1` and commit `b2c2ac6` from `reorx/obsidian-paste-image-rename`. Both source trees are exported with read-only `git archive`; checkout edits are neither used nor changed. No plugin installation, native UI, GitHub mutation, or user vault access.

## Run

Prerequisites: Node, Python with Pillow, git, tar, and this repository's already installed npm development dependencies. No package installation is performed.

    node tests/manual/creation-matrix/run.mjs --repo /path/to/obsidian-paste-image-rename

The four scripts/documentation files can be copied together anywhere, including `tests/manual/creation-matrix/`. `--repo` identifies the checkout (defaults to the current directory). All generated output is placed in a fresh system-temp directory printed by the runner; `--out` may select a new, nonexistent directory instead. Exact default source refs are `1.6.1` and `b2c2ac6ad25043c95aff55ac0583a24d80b0b509`; optional `--legacy-ref` and `--current-ref` allow an explicit comparison with newer code. `refs.json` records resolved commit IDs. `results.json` contains results; `matrix.cjs` is the exact executable test bundle. Default cleanup removes only four known generated image paths after the run, retaining JSON, bundle and source snapshots. `--keep-fixtures` retains those images for inspection. No output is written into the checkout and the default npm test suite is unaffected. Peak space/memory must accommodate a 128MiB+ PNG and its hash buffers. Images are disposable synthetic fixtures, not user files.

The same matrix was also rerun against published snapshot-fix commit `0d669ba0513b21f17a82234c050263347bd4ca9c` using `--current-ref`, with the same results.

## Executed evidence

- 192 cells compare actual registered onload/create handlers: two versions × auto/manual × Handle all on/off × four filename/format variants × six timestamps (current, 1000ms old, 1001ms old, 90s old, zero, future).
- 10 independent lifecycle scenarios cover pre-layout events, 29999/30000/45000ms metadata delays, absent/recovering metadata, reverse event order, 200 duplicate notifications, source navigation and delete-event cancellation.
- 20 current actual start/rename/modal path checks use WEBP/uppercase WEBP, macOS-style screenshot names, HEIC and ZIP; auto/manual × Handle all on/off; size metadata 128MiB, timestamp zero. These do not stub startRenameProcess.
- 2 current full rename path checks use real filesystem rename for generated images. PNG: 134254660 bytes, 16384×2048; WEBP: 426 bytes, 1200×150. SHA256 preserved exactly. Plugin binary-read/write methods throw if called, and were never called. The host FileManager is simulated with fs.renameSync.
- 3 exploratory uppercase-Markdown probes document a candidate only.

This is 192 matrix assertions plus 30 positive/negative scenario checks, two real-byte checks and three candidate observations. It is not native Obsidian or native mobile/macOS validation. Existing regression tests are not counted as new matrix coverage. The mock disables modern discard integration; clipboard decoding, preview image decoding, camera handoff and renderer appearance are not exercised.

## Interpretation by issue

### #25 and part of #112: historical timing cause reproduced

1.6.1 suppresses every create with ctime zero or age >1000ms, regardless of Handle all. Current b2c2ac6 processes eligible names at these timestamps after a source-reference metadata event. Exactly 1000ms is accepted by legacy, 1001ms is rejected. Future timestamps are accepted by both.

This directly reproduces the mechanism described in #25's zero-ctime report and is consistent with network-drive/slow-save reports. It does not identify every reporter's cause.

- https://github.com/reorx/obsidian-paste-image-rename/issues/25#issuecomment-1559225158
- https://github.com/reorx/obsidian-paste-image-rename/issues/25#issuecomment-1407660345
- https://github.com/reorx/obsidian-paste-image-rename/issues/112#issuecomment-3337993574

### #112, #91, #79: deterministic filename filter; native cases remain unverified

Both old and current code require the exact case-sensitive `Pasted image ` filename prefix unless Handle all attachments is on. A macOS-style `Screenshot 2026-10-15 at 07.45.00.png` and camera-style `IMG_1234.HEIC` never trigger with the default off setting; both enter the rename/prompt path when enabled. Prefix-matching PNG and uppercase WEBP enter it in either setting. This supports a concrete settings explanation for #79 and several #112 comments, not proof of macOS clipboard behavior or all #91 failures.

- https://github.com/reorx/obsidian-paste-image-rename/issues/112#issuecomment-3071598878
- https://github.com/reorx/obsidian-paste-image-rename/issues/79
- https://github.com/reorx/obsidian-paste-image-rename/issues/91

Current intentional safeguards also produce a silent no-prompt result: an unindexed source at creation; source metadata becoming null while pending; a link already present when create arrives; metadata arriving at/after the 30s timer; create before layout-ready registration. A 29999ms delay and 200 repeated notifications succeed exactly once. These guard boundaries are reproducible, but there is no native event trace proving any reporter hit one. Removing drawing/restoration safeguards to force a popup is not justified by these tests.

### #68: large-file byte/path check passes; mobile remains open

The current automatic rename path renamed a valid rectangular PNG larger than 128MiB without reading or rewriting image bytes. The before/after hash is `dd6dc92846093a6427bbb50a530287cba93227ee4c2909692753c1da2ae6d798`. Large size alone is not a trigger filter. A camera's nonprefix filename, or an old timestamp in version 1.6.1, can reproduce no-rename, but the original mobile capture/import is not available here.

- https://github.com/reorx/obsidian-paste-image-rename/issues/68

### #89: cannot reproduce native iOS crash

The non-native creation/rename path does not throw for camera-like HEIC filenames or large declared size. Manual mode creates an img resource preview, whose native decoding is outside this harness. No conclusion about iOS camera handoff, WKWebView image allocation, theme/snippet interactions or the reported crash can be drawn. Keep unresolved.

- https://github.com/reorx/obsidian-paste-image-rename/issues/89

### #76: local WEBP works in the tested path

Lowercase and uppercase WEBP files enter both automatic and manual paths. A real WEBP filename changed with SHA256 `9d807ae884532285feb0d5eb241d8248ea14b695940a33dadfe2ea2ed1470638` preserved. The web-page multi-image clipboard conversion from the original report was not reproduced, and remote image links do not imply local attachment creation. Native multi-image import remains needed before closing.

- https://github.com/reorx/obsidian-paste-image-rename/issues/76

### #117: no file-level crop in tested path; display remains unverified

Both deliberately wide (8:1) fixture files retain every byte across rename, hence their encoded dimensions remain unchanged. Only header dimensions are inspected; this is not a browser/native image decode or a rendered-appearance test. The source uses a resource img preview and max-height CSS but contains no image-pixel rewrite in the rename path. A theme/rendering/link-width interaction could still produce the reported square appearance. Keep unresolved.

- https://github.com/reorx/obsidian-paste-image-rename/issues/117

## Separate exploratory candidate, not a confirmed native defect

With Handle all enabled and an exact incoming TFile extension `MD` or `Md`, current code renames a linked `linked.MD`/`linked.Md` to `Note.MD`/`Note.Md`; lowercase `md` is correctly excluded. `isMarkdownFile` checks strict lowercase equality. Native Obsidian recognition of those extensions was not tested, so no fix or issue closure is proposed here.
