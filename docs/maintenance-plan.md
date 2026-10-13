# Maintenance plan and progress

Updated: 2026-10-13. Baseline: `3801513c406a86ad90c94a1bd7c95c6b837e063d`.
Branch: `maintenance/issue-backlog-20261013`. Published maintenance branch; 25 verified issue closures. No release or default-branch merge.

## Current result — accepted preview published; 25 issues closed

Updated 2026-10-13 23:58 UTC. Publication commit: [`7e7a70d`](https://github.com/reorx/obsidian-paste-image-rename/commit/7e7a70dce910f9c716f10ad698555143624cb8f1), exactly matching accepted snapshot `19c50908`. Latest tested source commit:
`ffd813ec49de8c5172ea2792d9aae467a9e839d2`.
Final plugin `main.js` SHA256:
`652dd495227de410789e0848a5a7706cc9c0a70d921bc4625d6abbd51afa6b51`.

- Six code checkpoints completed and accepted. Published to the maintenance branch; 25 issues closed after individual scope/evidence review (23 code requests and 2 existing-capability documentation cases). 48 of the original 73 issues remain open. No default-branch merge, tag, release, version bump or ownership change.
- 73/73 automated tests, production build/typecheck, lint and whitespace checks passed; independent review reran the checks.
- Original inventory: 27 candidate implementations, 16 partial/reproduction/platform cases, 5 existing-capability documentation, 24 broader design/integration decisions, and 1 governance item. Closure review retained 4 prior candidates (#25, #38, #81, #111) and 3 documentation cases (#98, #103, #109). The publication audit below supersedes candidate counts as a resolution claim. Test count is not an assertion that all issues are fixed.
- Native Obsidian 1.14.4 testing verified mixed batches/shared references/aliases, idempotence, unchanged image bytes, actual multi-file clipboard paste, synthetic Docxer-style ordered mapping, and controlled delayed source-note switching on the exact builds in [the report](real-app-test-report.md). The final artifact also passed manual original-name fill/confirm and Unicode-slug/three-digit native pair-paste checks; the filesystem-move stale-preflight regression passed on the preceding feature snapshot.
- Original Docxer DOCX and iOS/macOS-specific reports remain unverified. No blanket all-issues-fixed or release-ready claim.

**Reading this log:** later checkpoints supersede earlier ones. The historical first
candidate's multi-paste failure was reproduced in the real app, then fixed and retested
in candidate 2. The old timestamp heuristic described in checkpoint 1 was replaced in
checkpoint 2. Historical pending items below are not the current status; this summary,
the disposition ledger, and latest native report are authoritative for this pass.

### Material safety/behavior changes

- Automatic rename waits for a new parsed reference in the captured Markdown source,
  for up to 30 seconds after post-startup creation. Unreferenced/sync-restored files are
  left alone; this is bounded insertion evidence, not complete provenance detection.
- Obsidian automatic internal-link updates must be enabled; explicitly disabled mode
  is blocked before rename to protect cross-note references.
- Generated destination folder paths are rejected before mutation pending a stable
  path policy. Ordinary renames retain the original attachment folder.
- Literal folder exclusions protect both attachment and source-note paths during
  automatic handling. Manual batch commands remain explicit operations.
- Preflight prevents detectable invalid/stale batch plans before the first mutation;
  per-item/queue checks catch later changes. This is not transaction rollback. Cancel
  stops remaining tasks after an in-flight rename; completed valid renames are kept.
- New optional naming controls leave defaults unchanged. Dynamic DATE/UUID patterns
  and attachment-name prefix patterns can intentionally produce new names on reruns;
  their semantics are documented in the README.

## Priority and acceptance gates

1. P0: attachment/link integrity (#107, #58). Reproduce async editor switching and concurrent rename collisions; never change note text before a successful physical rename. Docxer-specific behavior needs an actual importer reproduction.
2. P1: batch prematurely stops (#46, #120, likely #119); accidental background renames and exclusions (#121, #115, #56, #61, #96); missing prompts (#25, #112, #91, #68).
3. P2: repeated-batch idempotence (#54), template regex state (#81), validation and supported-image consistency.
4. Remaining enhancements: assess individually after safety fixes; preserve existing behavior unless a change is deliberate and tested.

## Work log

- Retrieved clean upstream source and established a reproducible baseline.
- Existing project had no regression suite. Added a Node test harness with a narrow mocked Obsidian adapter; separate disposable-vault native-app comparison is ongoing.
- Confirmed source defects: premature `return` in batch iteration; editor selected after asynchronous rename; unqueued filename allocation; shared global template regex state; current file counted as its own duplicate.
- Dependency setup initially failed because default npm cache was outside writable roots. Recovered using a disposable `/tmp` cache; install and baseline build passed.

## First safety candidate (2026-10-13)

Implemented locally; these are candidate fixes, not upstream closures:

- #46/#120: instant batch resolves unique file identities before mutation and skips missing/non-image embeds. Regression includes 35 mixed-format images and repeated invocation.
- #58: serialize destination allocation/rename; capture source identity and parsed embed positions before I/O; preserve alias/width/alt/title in exact-live-text fallback. Cursor movement, note switching, edited/deleted lines and rename failure are tested. Delayed link insertion and real concurrent-paste coverage are still required before calling the issue fixed.
- #54: ignore self collisions and preserve already-numbered members of the target naming family; repeated batches are idempotent in the regression fixture.
- #121/#115/#56: new literal folder exclusions check attachment and source-note paths, including descendants and boundary tests. This mitigates importer conflicts; it does not prove every external plugin integration safe.
- #25/#112: creation-time zero falls back to mtime. The existing one-second age heuristic remains; slow-network/mobile camera cases are NOT claimed fixed.
- #99: hidden/sync temporary files ignored automatically; extension exclusion applies to pasted-image and general attachment paths, uses its documented first line, and fails closed on invalid regex.
- #81: stateless DATE/frontmatter substitution supports multiple occurrences and repeated calls; preserves numeric zero/false and literal replacement text.
- #87/#92/#97/#80: preserve filesystem-valid Unicode punctuation/emoji and deliberate delimiter spacing while stripping prohibited path/link characters.
- #41: explicit Preview button; stale batch tasks invalidated on input, absent cache and bad regex; confirmation snapshots preview and detects moved files. Duplicate references collapse to one operation.
- #113: consistent image extension classification includes AVIF; format recognition only, not a claim of every OS codec/import route working.
- Additional safety: failed rename cannot poison queue; missing active note guarded; modal waits for rename success, blocks repeat submission and shows failure without closing; disabled Obsidian automatic link updating blocks rename before mutation so shared references are not knowingly broken.

### Intentionally unresolved / next acceptance gates

1. #107 Docxer orphaned mapping: no actual importer reproduction yet. No claim of repair or recovery of already-orphaned attachments.
2. #58 delayed native paste/import links: run actual multi-image insertion, slow insertion, Markdown/wiki syntax, shared references and width/alias fixtures. A parsed-metadata-only fallback deliberately skips uncertain text.
3. #61/#96/#108/#121 plugin/sync interleavings: folder and temp guards mitigate known paths, but file creation alone is not proof of user paste. Need event-provenance design before removing timing protection.
4. #25 slow filesystem, #68 large mobile import, #89 iOS crash and #91 macOS historical failure: need platform-specific reproduction. Linux birthtime fix is not a universal resolution.
5. #55/#49/#60/#83/path proposals: paths in generated/manual names now fail before mutation with an explicit error. Destination-folder semantics and repeat-run idempotence require a separate design; no untested automatic folder creation is shipped in this safety candidate.
6. Canvas/Excalidraw and other integrations remain separate. No blind Markdown editor rewriting is used for these views.
7. Remaining feature requests stay ranked in the inventory below; no governance/ownership change, remote publication, release, or issue closure is authorized by this local work.

## Verification status

- Baseline production build: PASS, upstream `3801513`; pristine bundle retained separately for real-app comparison.
- Baseline focused regressions: 8 cases, 7 failing / 1 passing before fixes, rerun against original Git source through the same harness. Baseline output captured externally.
- Current candidate: 33 automated Node tests across pure policy, mocked adapter operations, metadata-safe fallback and batch-preview guards. Latest test/build/lint results recorded at final checkpoint below.
- `npm run build`: runs TypeScript checking and production bundling.
- `npm test`: bundles tests with a narrow Obsidian mock; no Electron runtime required. This is not a substitute for native-app verification.
- Real Obsidian 1.14.4 installed from the official release and launched with a disposable vault; baseline/fixed comparison in progress. No personal vault used.

## Second safety candidate: wait for a linked source

2026-10-13 16:41 UTC. Separate follow-on to checkpoint `b177c36`.

- Register create/delete/metadata listeners only after Obsidian's `onLayoutReady`, as recommended by the installed official Vault API. Startup enumeration is not treated as insertion.
- Capture the active Markdown source by identity when an eligible attachment is created. Ignore files already referenced by that source's parsed metadata (for example, restoring a missing synced attachment).
- Wait for a later metadata change that resolves a new parsed source link or embed to that exact attachment object before showing the rename prompt or auto-renaming. This avoids renaming while the original insertion path is still waiting to be written.
- Replaced the one-second creation-time heuristic entirely. Zero birthtime, old copied timestamps, and processing longer than one second do not by themselves suppress a new linked insertion.
- Pending entries expire after 30 seconds without mutation, are canceled on source/attachment deletion or plugin unload, and coalesce duplicate notifications. A timeout is intentionally quiet; manual batch rename remains available. Plugin development logging records timeout context.
- The source remains the one captured at creation even if the user changes tabs. Automatic errors are now visible and do not poison later rename requests.
- Behavior change: general-attachment handling now requires a newly parsed reference in the captured source, including ordinary ZIP/CSV links as well as embedded images. Unreferenced vault creations and already-referenced restorations remain unchanged. Creation + metadata still do not prove definitive user/importer provenance; this is not a universal sync-ownership solution.
- Unit acceptance covers delayed link insertion, multi-image identity, old/zero timestamps, wrong-source events, folder exclusions, duplicate notification, timeout, deletion, unload, and startup registration. Native paste/drop/import verification remains a release gate.

## Complete issue and PR inventory

# Obsidian Paste Image Rename: complete open-backlog inventory

Snapshot: 2026-10-13 UTC. Repository: https://github.com/reorx/obsidian-paste-image-rename

73 open issues and 9 open PRs retrieved through GitHub search (100-result cap; result set below cap). All 73 issue comment threads retrieved; all 9 PR descriptions/diffs/comments inspected. The read-only triage also inspected PR base `c187bf6ffc897da793eba930f9578710795460ec`; implementation and all baseline builds use actual checkout HEAD `3801513c406a86ad90c94a1bd7c95c6b837e063d`. No issues were changed, closed, or relabeled during this inventory. Priority labels below are proposed, not GitHub labels.

## Recommended order

1. P0: protect attachment/link integrity (#107, #58), with error injection and multi-insert tests.
2. P1: prevent background/plugin/sync renames (#121, #115, #56, #61, #96, #99), fix batch stop (#46, #120; investigate #119), then platform failures (#25, #112, #91, #68), crashes (#89), duplicate imports (#108), destination collisions (#55).
3. P2: idempotence, templates, safe Unicode/paths, format handling, Canvas, and UX. Reproduce vague reports before treating them as fixed.
4. P3: additive naming/modal/embed features and documentation of existing behavior.
5. P4: broad lifecycle, vault-wide, compression and delete-on-cancel requests only after the safe rename foundation.
6. Governance #122 is separate; owner reply is visible, transfer not approved.

## Important distinctions

- P0 denotes document integrity risk, not confirmed deletion of image bytes. #107 reports lost mapping between renamed document links and original files. Root cause remains unproven.
- Confirmed source defect: instant batch returns instead of continuing at missing or unsupported embed (#46/#120).
- Confirmed shared-regex state hazard: DATE/frontmatter regexes use global exec across replacements/calls (#81).
- No open issue is proven fixed in master by this review. Some requests already have underlying capabilities: DATE handles time (#59/#98), frontmatter can supply permalink (#103), GIF/WEBP already appear in batch filtering (#63/#76). These still need targeted reproduction/docs, not automatic closure.
- #41 is primarily discoverability: comments confirm Enter generates the batch preview.
- %20 in a Markdown destination (#109) is not itself a bug. Preserve resolvability and distinguish wiki syntax from URL syntax.
- PR90 excludes active-note paths, while #121/#115 require attachment-path protection. Do not call all three solved by merging PR90 unchanged.
- #112 bundles multiple root causes: ctime=0, native file copy not matching Pasted image prefix, and other plugin conflicts.

## All open issues, highest priority first

### P0 · [#107 Orphaned images during rename](https://github.com/reorx/obsidian-paste-image-rename/issues/107)
- Category: Data integrity
- Reproduction / request: Batch-rename Docxer-imported images; note paths change while physical files reportedly do not.
- Acceptance / disposition: Every resulting embed resolves to the intended unchanged-content file; inject rename errors and retain original links. Root cause not reproduced.

### P0 · [#58 Sometimes file link isn't renamed after the image file is renamed.](https://github.com/reorx/obsidian-paste-image-rename/issues/58)
- Category: Data integrity
- Reproduction / request: Paste two or more images simultaneously; only last link updates (comments confirm).
- Acceptance / disposition: All links resolve after multi-insert, slow I/O, cursor movement and note switches. Review PR86; cursor snapshot alone is not complete transaction safety.

### P1 · [#121 Exclude folders from automatic attachment renaming*](https://github.com/reorx/obsidian-paste-image-rename/issues/121)
- Category: Compatibility / integrity
- Reproduction / request: Another plugin creates Telegram/photos/photo_123.jpg then inserts its saved path; automatic rename wins race.
- Acceptance / disposition: Exclude attachment folders before any rename; Telegram/ excludes descendants but not Telegram2/. Shares #115/#56; PR90 checks wrong path for this case.

### P1 · [#120 The images located after a pdf or mp4 are not renamed.](https://github.com/reorx/obsidian-paste-image-rename/issues/120)
- Category: Batch bug
- Reproduction / request: Put PDF/MP4 before image; instant batch stops.
- Acceptance / disposition: Images after unsupported embeds rename. Same confirmed code defect as #46.

### P1 · [#119 attachment rename limitations in a note](https://github.com/reorx/obsidian-paste-image-rename/issues/119)
- Category: Batch bug
- Reproduction / request: Windows 10 / Obsidian 1.11.4, many images; batch stops silently.
- Acceptance / disposition: Mixed 30+ image fixture completes eligible unique images and reports failures. Likely #46/#120, not proven duplicate.

### P1 · [#115 Allow Exclude By Directory](https://github.com/reorx/obsidian-paste-image-rename/issues/115)
- Category: Compatibility / integrity
- Reproduction / request: Handle all attachments renames another plugin's incrementing CSV backups in protected folder.
- Acceptance / disposition: Protected attachment directories are untouched; same extensions elsewhere still rename. Duplicate capability of #121.

### P1 · [#112 Stopped working some time ago](https://github.com/reorx/obsidian-paste-image-rename/issues/112)
- Category: Platform compatibility
- Reproduction / request: No prompt on 1.8.10; macOS CleanShot/Finder and Windows JPG reports; Linux confirmed PR67 workaround.
- Acceptance / disposition: Test native clipboard and file copy with Handle all attachments both ways; avoid claiming single universal fix.

### P1 · [#108 pasting in an image create duplicate named images](https://github.com/reorx/obsidian-paste-image-rename/issues/108)
- Category: Data integrity investigation
- Reproduction / request: Copy image file from folder, paste once; duplicate files and skipped counters appear.
- Acceptance / disposition: One imported file per intended paste; establish interfering plugins and event traces. No sufficient repro environment supplied.

### P1 · [#99 “.tmp” Files Misidentified as Attachments](https://github.com/reorx/obsidian-paste-image-rename/issues/99)
- Category: Compatibility / integrity
- Reproduction / request: Syncthing .tmp file creation triggers rename; reported extension exclusion ineffective.
- Acceptance / disposition: Ignore temp/system files; extension exclusions apply consistently to every automatic path; document extension-only regex.

### P1 · [#96 Better integration with git plugin](https://github.com/reorx/obsidian-paste-image-rename/issues/96)
- Category: Compatibility / integrity
- Reproduction / request: Git pull creates files; rename prompts/auto-renames cause merge conflicts.
- Acceptance / disposition: Background sync/import does not mutate unrelated attachments. Folder exclusion mitigates but does not establish paste provenance.

### P1 · [#91 Paste does not work anymore in Obsidian 1.5.12](https://github.com/reorx/obsidian-paste-image-rename/issues/91)
- Category: Platform compatibility
- Reproduction / request: macOS 14.3.1, Obsidian 1.5.12, sandbox PNG paste doesn't trigger.
- Acceptance / disposition: Reproduce current clean-vault clipboard cases; linked Imgur duplicate paste report informs #108.

### P1 · [#89 Attachment by taking a photo sometimes crashes on iOS](https://github.com/reorx/obsidian-paste-image-rename/issues/89)
- Category: Crash / mobile
- Reproduction / request: iOS 17.3.1 / Obsidian 1.5.11: attach > take photo > add crashes app intermittently.
- Acceptance / disposition: Physical iOS repro and large-photo test; attachment saved, linked, prompt handled without crash. Cause unconfirmed.

### P1 · [#68 the plugin can't work on mobile phones if the image is large](https://github.com/reorx/obsidian-paste-image-rename/issues/68)
- Category: Platform compatibility
- Reproduction / request: Mobile camera photo too large to auto-rename, small screenshots work.
- Acceptance / disposition: Large slow imports supported without renaming unrelated startup/sync files; likely creation-time heuristic.

### P1 · [#61 A naming conflict occurs when used with Local images plus](https://github.com/reorx/obsidian-paste-image-rename/issues/61)
- Category: Compatibility / integrity
- Reproduction / request: Local images plus Download all images with auto-rename enabled breaks MD5-based import naming.
- Acceptance / disposition: Importer-created attachments retain valid links; isolation/exclusion test. Related #121, not exact duplicate.

### P1 · [#56 Exclude automatic paste image rename for selected user folders](https://github.com/reorx/obsidian-paste-image-rename/issues/56)
- Category: Compatibility / integrity
- Reproduction / request: Zotero-imported images trigger 10+ unwanted rename dialogs.
- Acceptance / disposition: Folder exclusions must distinguish note folders and attachment folders. Same capability #115/#121; PR90 checks note only.

### P1 · [#55 Rename failed, Destination file already exists](https://github.com/reorx/obsidian-paste-image-rename/issues/55)
- Category: Path / collision bug
- Reproduction / request: Pattern Notes/Image/{{fileName}}, auto-rename + always-number, paste two images.
- Acceptance / disposition: Deduplicate in actual destination folder; no overwrite; consecutive unique names. Coupled with path feature semantics.

### P1 · [#46 Embeded heading from other file stops "batch rename all images instantly" command.](https://github.com/reorx/obsidian-paste-image-rename/issues/46)
- Category: Batch bug
- Reproduction / request: Images before and after ![[Embedded_file#Heading 4]]; instant batch stops at note embed.
- Acceptance / disposition: Skip non-image and unresolved embeds, process later images, preserve note embeds. Master return statements confirm defect.

### P1 · [#25 Pasted image not prompting a dialog](https://github.com/reorx/obsidian-paste-image-rename/issues/25)
- Category: Platform compatibility
- Reproduction / request: Linux filesystem ctime=0; network-drive paste takes >1s; no prompt.
- Acceptance / disposition: ctime=0 handled (PR67 confirmed by users); slow network paths and startup scans tested separately.

### P2 · [#117 Image sizes change](https://github.com/reorx/obsidian-paste-image-rename/issues/117)
- Category: Rendering investigation
- Reproduction / request: 1.10.3 / plugin 1.6.1: images reportedly become square/cropped after rename.
- Acceptance / disposition: Preserve embed aliases/width metadata and bytes; distinguish CSS/other plugin vs link rewriting before claiming fix.

### P2 · [#113 Hope to add support for the AVIF format.](https://github.com/reorx/obsidian-paste-image-rename/issues/113)
- Category: Format feature
- Reproduction / request: Paste/batch AVIF images.
- Acceptance / disposition: Add AVIF detection where Obsidian supports it; safe preview fallback; no transcoding implied.

### P2 · [#109 Chinese file names containing spaces are escaped](https://github.com/reorx/obsidian-paste-image-rename/issues/109)
- Category: Link compatibility / docs
- Reproduction / request: Batch rename image in 中 文 abc.md yields percent-encoded spaces in Markdown link.
- Acceptance / disposition: Link resolves and preserves correct syntax. %20 is valid Markdown URL encoding; clarify expected representation rather than blindly remove escaping.

### P2 · [#101 Can't rename pasted image on canvas](https://github.com/reorx/obsidian-paste-image-rename/issues/101)
- Category: Canvas compatibility
- Reproduction / request: Paste image on canvas gives no active file error.
- Acceptance / disposition: Same #29 acceptance; duplicate report.

### P2 · [#97 [Bug] Some punctuation marks disapear after rename images.](https://github.com/reorx/obsidian-paste-image-rename/issues/97)
- Category: Filename compatibility
- Reproduction / request: Rename with CJK punctuation 「」！？（）／; characters disappear.
- Acceptance / disposition: Preserve filesystem-valid Unicode, strip only forbidden path/link characters under explicit policy. Same sanitizer cluster #92/#87.

### P2 · [#93 Can have setting to remove forbid character in original filename keeping?](https://github.com/reorx/obsidian-paste-image-rename/issues/93)
- Category: Filename / integrity
- Reproduction / request: Keep original filename containing # or other delimiters; resulting link reportedly broken.
- Acceptance / disposition: Safe filename/link handling; optional original-name editing; no silent destructive stripping of valid Unicode. Related #84.

### P2 · [#92 Support for Emojis and Symbols in file name](https://github.com/reorx/obsidian-paste-image-rename/issues/92)
- Category: Filename compatibility
- Reproduction / request: Note names with ✅ and ▶ lose symbols in image name.
- Acceptance / disposition: Emoji/symbols survive safe filename generation; cross-platform invalid chars remain rejected.

### P2 · [#87 Using en dash and em dash](https://github.com/reorx/obsidian-paste-image-rename/issues/87)
- Category: Filename compatibility
- Reproduction / request: Enter en dash or em dash in rename dialog.
- Acceptance / disposition: Both dashes preserved; shared allowlist defect with #92/#97.

### P2 · [#83 [Feature]Allow folder creation.](https://github.com/reorx/obsidian-paste-image-rename/issues/83)
- Category: Path feature / bug
- Reproduction / request: Use imageNameKey folder path that doesn't exist.
- Acceptance / disposition: Same #49 folder creation capability, with nested-directory tests.

### P2 · [#82 Option for file location](https://github.com/reorx/obsidian-paste-image-rename/issues/82)
- Category: Path compatibility / feature
- Reproduction / request: Several plugins manage attachment location; user asks rename without moving.
- Acceptance / disposition: Plain-name rename must preserve parent; define explicit optional path behavior. Mixed comments also request custom destination.

### P2 · [#81 Multiple use of DATE: variable](https://github.com/reorx/obsidian-paste-image-rename/issues/81)
- Category: Template bug
- Reproduction / request: Pattern _Journal/{{DATE:YYYY}}/{{DATE:YYYY-MM}}/{{fileName}} leaves second variable.
- Acceptance / disposition: All DATE and frontmatter occurrences rendered, including repeated calls; global regex lastIndex is stateful in master.

### P2 · [#80 Can't put space at beginning of 'Duplicate number delimiter'](https://github.com/reorx/obsidian-paste-image-rename/issues/80)
- Category: Settings bug
- Reproduction / request: Set delimiter to leading-space ' - IMG'; leading space disappears.
- Acceptance / disposition: Preserve intentional delimiter whitespace while safely validating characters and empty fallback.

### P2 · [#79 When I drag an image into a document, it can't be renamed](https://github.com/reorx/obsidian-paste-image-rename/issues/79)
- Category: Compatibility / docs
- Reproduction / request: macOS built-in screenshot dragged/copied from Finder not renamed.
- Acceptance / disposition: Document file-copy vs clipboard prefix behavior; verify Handle all attachments works. Related #112.

### P2 · [#78 When there are too many pictures in an article, such as 30, they cannot be effectively renamed.](https://github.com/reorx/obsidian-paste-image-rename/issues/78)
- Category: Batch / numbering
- Reproduction / request: 30+ images with DATE seconds/milliseconds and mixed formats produce surprising counters.
- Acceptance / disposition: Stable per-batch timestamp; unique file identities; deterministic numbering policy. Contains #53/#73 requests too.

### P2 · [#76 It doesn't effect when pictures are “webp” format](https://github.com/reorx/obsidian-paste-image-rename/issues/76)
- Category: Format compatibility
- Reproduction / request: Copy multiple web images; WEBP downloads fail rename while single PNG works.
- Acceptance / disposition: WEBP recognized for paste/batch/preview; batch already includes webp, so investigate creation route rather than assume unsupported.

### P2 · [#74 It doesn't work in Excalidraw](https://github.com/reorx/obsidian-paste-image-rename/issues/74)
- Category: Excalidraw compatibility
- Reproduction / request: Title only: doesn't work in Excalidraw.
- Acceptance / disposition: Determine Excalidraw embedded-file representation and supported integration; don't apply Markdown rewrite blindly.

### P2 · [#66 amazing! yet it does not seem to respect the obsidian subfolder name option for attachment saving?](https://github.com/reorx/obsidian-paste-image-rename/issues/66)
- Category: Path compatibility
- Reproduction / request: Obsidian attachment subfolder assets configured; reported images end up beside note (also iPad).
- Acceptance / disposition: Keep original Obsidian-chosen folder for ordinary rename; test root, same folder and subfolder. Master appears to retain file.parent, so needs repro.

### P2 · [#64 Cannot enable plugin.  Have never encountered this before with any plugin.](https://github.com/reorx/obsidian-paste-image-rename/issues/64)
- Category: Install investigation
- Reproduction / request: Installed from community browser but cannot enable (screenshot only).
- Acceptance / disposition: Collect actual console/version errors and reproduce current clean install; insufficient text evidence for code fix.

### P2 · [#63 Hope to support gif files](https://github.com/reorx/obsidian-paste-image-rename/issues/63)
- Category: Format compatibility / docs
- Reproduction / request: Title requests GIF support; no body/repro.
- Acceptance / disposition: GIF already in batch regex and preview list; verify creation-route behavior before closing as supported.

### P2 · [#60 Specifiying directory when renaming](https://github.com/reorx/obsidian-paste-image-rename/issues/60)
- Category: Path feature
- Reproduction / request: Enter foo/bar.png to save under attachment folder/foo.
- Acceptance / disposition: Clearly documented relative/vault-root paths; modal sanitization preserves allowed separators; traversal rejected.

### P2 · [#54 Do not rename files that are already "well-named" when using "batch rename instantly" command.](https://github.com/reorx/obsidian-paste-image-rename/issues/54)
- Category: Batch bug
- Reproduction / request: Run instant batch twice over already conforming filenames.
- Acceptance / disposition: Idempotent repeated runs; existing current file excluded from collision list; stable links/content.

### P2 · [#49 Create parent folder when it does not exist](https://github.com/reorx/obsidian-paste-image-rename/issues/49)
- Category: Path feature / bug
- Reproduction / request: Pattern {{fileName}}.assets/image-{{DATE:YYYYMMDD-HHmmssSSS}} with missing folder errors.
- Acceptance / disposition: Create authorized vault-relative parent folders safely; deduplicate at destination. Review PR52/#106/#85, don't merge wholesale.

### P2 · [#41 Batch renaming not working on my side](https://github.com/reorx/obsidian-paste-image-rename/issues/41)
- Category: UX / documentation
- Reproduction / request: Batch dialog appears not to match regex until pressing Enter.
- Acceptance / disposition: Visible Preview button or explicit Enter hint; stale previews cannot accidentally execute outdated tasks. Comments confirm workaround.

### P2 · [#29 pasting to a canvas doesn't trigger the plugin](https://github.com/reorx/obsidian-paste-image-rename/issues/29)
- Category: Canvas compatibility
- Reproduction / request: Create canvas and paste web image; no rename / no active file.
- Acceptance / disposition: Canvas rename updates canvas JSON file references; creating canvas must not itself prompt in Handle all attachments. PR110 candidate.

### P3 · [#116 Add pattern option: {{headerName}}](https://github.com/reorx/obsidian-paste-image-rename/issues/116)
- Category: Template feature
- Reproduction / request: Request nearest previous heading as {{headerName}}.
- Acceptance / disposition: Find heading at paste/embed position, fallback defined, no heading above produces safe result. Duplicate #105.

### P3 · [#111 Add pattern option: {{FileNameSlug}}](https://github.com/reorx/obsidian-paste-image-rename/issues/111)
- Category: Template feature
- Reproduction / request: Request file-name slug with case and separators.
- Acceptance / disposition: Add deliberate slug variable/options, Unicode policy, preserve existing fileName. Duplicate capability #47.

### P3 · [#105 Heading variable improved](https://github.com/reorx/obsidian-paste-image-rename/issues/105)
- Category: Template feature
- Reproduction / request: firstHeading insufficient for multi-section notes; request nearestHeading.
- Acceptance / disposition: Same #116 requirement; preserve firstHeading semantics.

### P3 · [#103 hope to rename using permalink](https://github.com/reorx/obsidian-paste-image-rename/issues/103)
- Category: Documentation / existing capability
- Reproduction / request: Rename using permalink metadata.
- Acceptance / disposition: Document {{frontmatter:permalink}} already supported, ensure filename-safe values and repeated replacement fix #81.

### P3 · [#100 Issue: Add Support for File Extensions in Rename Patterns](https://github.com/reorx/obsidian-paste-image-rename/issues/100)
- Category: Template feature / clarification
- Reproduction / request: Request fileExt placeholder, example ends .{{fileExt}}.
- Acceptance / disposition: Clarify extension is already appended; if exposing ext, avoid .png.png and define whether template is stem or full filename.

### P3 · [#98 Allow DATETIME variable](https://github.com/reorx/obsidian-paste-image-rename/issues/98)
- Category: Documentation / existing capability
- Reproduction / request: Request DATETIME with date+time tokens.
- Acceptance / disposition: Document existing DATE:YYYY-MM-DDTHH-mm-ss and filename-safe tokens; no new DATETIME needed unless compatibility alias desired.

### P3 · [#95 [Feature] Add Input Field and Presets for Image Width During Insertion](https://github.com/reorx/obsidian-paste-image-rename/issues/95)
- Category: Embed feature
- Reproduction / request: Request image-width field, remembered value and presets.
- Acceptance / disposition: Preserve existing width; valid wiki/Markdown syntax, optional default/presets. Superset of #57.

### P3 · [#88 Add Field for Source of the image](https://github.com/reorx/obsidian-paste-image-rename/issues/88)
- Category: Embed feature
- Reproduction / request: Optional image-source field appended as caption.
- Acceptance / disposition: Non-destructive caption insertion, escape untrusted text, support insertion context and undo.

### P3 · [#84 Button to copy original name in rename field](https://github.com/reorx/obsidian-paste-image-rename/issues/84)
- Category: Modal UX feature
- Reproduction / request: Want original filename copied into editable rename field.
- Acceptance / disposition: Use original name button keeps editable stem and extension correct; safe validation. Related #93.

### P3 · [#77 Is it possible to convert MD Links to wikilinks?](https://github.com/reorx/obsidian-paste-image-rename/issues/77)
- Category: Link-format feature
- Reproduction / request: Request Markdown links converted to Wikilinks.
- Acceptance / disposition: Provide deliberate conversion option that preserves aliases, size and paths; no implicit format churn during rename.

### P3 · [#71 Support putting the cursor at the beginning of the image name pattern](https://github.com/reorx/obsidian-paste-image-rename/issues/71)
- Category: Modal UX feature
- Reproduction / request: Pattern acts as suffix; want initial cursor at start.
- Acceptance / disposition: Configurable cursor/selection placement respecting IME and current defaults.

### P3 · [#65 Colon is added between {{fileName}}-{{DATE::YYMMDDHHmmss}}](https://github.com/reorx/obsidian-paste-image-rename/issues/65)
- Category: Documentation / validation
- Reproduction / request: Pattern {{DATE::YYMMDDHHmmss}} has extra colon and Windows rename fails.
- Acceptance / disposition: Explain correct single colon; validate forbidden generated names consistently and actionable error.

### P3 · [#62 Allow for templated suffix](https://github.com/reorx/obsidian-paste-image-rename/issues/62)
- Category: Embed feature
- Reproduction / request: Request arbitrary suffix for width/alignment after | plus dimensions.
- Acceptance / disposition: Safe configurable suffix for supported syntax, no link deletion when empty. PR75 not merge-ready.

### P3 · [#59 Add a time variable similar to the DATE: variable.](https://github.com/reorx/obsidian-paste-image-rename/issues/59)
- Category: Documentation / existing capability
- Reproduction / request: Request TIME variable; user comment points to Moment formats.
- Acceptance / disposition: Document DATE supports HHmmss; verify examples and link current code.

### P3 · [#57 Add an option to set width for pictures](https://github.com/reorx/obsidian-paste-image-rename/issues/57)
- Category: Embed feature
- Reproduction / request: Request optional width field/default with keyboard tab navigation.
- Acceptance / disposition: Shared with #95/#62; PR75 only suffix candidate and has correctness risks.

### P3 · [#53 Files (of different types) shouldn't end up with the same name.](https://github.com/reorx/obsidian-paste-image-rename/issues/53)
- Category: Numbering feature
- Reproduction / request: PNG/JPG receive same counter despite different types.
- Acceptance / disposition: Optional cross-extension counter with clear compatibility policy; distinct extensions are not actual path collision. Related #78.

### P3 · [#48 Add the ability to set a counter with leading zeros in the plugin settings](https://github.com/reorx/obsidian-paste-image-rename/issues/48)
- Category: Numbering feature
- Reproduction / request: Want fileName-001.png through 021.png for sorting/publication.
- Acceptance / disposition: Configurable minimum digit width; parsing existing padded/nonpadded names collision-safe.

### P3 · [#47 I would like to use the file name without spaces](https://github.com/reorx/obsidian-paste-image-rename/issues/47)
- Category: Template feature
- Reproduction / request: Request spaces replaced by hyphens or underscores.
- Acceptance / disposition: Same slug feature as #111.

### P3 · [#45 default/alternative values in variables](https://github.com/reorx/obsidian-paste-image-rename/issues/45)
- Category: Template feature
- Reproduction / request: Fallback expression imageNameKey|dirName|literal.
- Acceptance / disposition: Shared template-extension design #44; test missing, false, zero and empty values.

### P3 · [#44 trim dashes from empty variables](https://github.com/reorx/obsidian-paste-image-rename/issues/44)
- Category: Template feature
- Reproduction / request: Empty variables leave leading/repeated separators.
- Acceptance / disposition: Define explicit optional-group/filter grammar; preserve compatibility. Don't trim intentional literal punctuation globally.

### P3 · [#38 Keep original filename of attachment](https://github.com/reorx/obsidian-paste-image-rename/issues/38)
- Category: Template feature
- Reproduction / request: {{fileName}}-{{originalAttachmentFileName}} desired for actual file imports.
- Acceptance / disposition: Expose original attachment stem, avoid doubled extension; preserve original before rename. Duplicate #37.

### P3 · [#37 Add a {{attachmentName} for file. ](https://github.com/reorx/obsidian-paste-image-rename/issues/37)
- Category: Template feature
- Reproduction / request: Preserve original mail/attachment date filename as part of renamed file.
- Acceptance / disposition: Same original-attachment variable as #38.

### P3 · [#22 Hex or UUID mode](https://github.com/reorx/obsidian-paste-image-rename/issues/22)
- Category: Template feature
- Reproduction / request: Request random hex / UUID variables.
- Acceptance / disposition: Document length/collision properties; per-file values stable through one operation, no silent rerender changes.

### P4 · [#94 Add option to, while batch renaming, moving the picture to [[subfolder name]]](https://github.com/reorx/obsidian-paste-image-rename/issues/94)
- Category: Attachment lifecycle feature
- Reproduction / request: Move note to new folder; want batch rename also relocate attachments.
- Acceptance / disposition: Explicit opt-in move plan; shared attachments and links across notes preserved. Same wider feature #39.

### P4 · [#73 Batch rename embeded files (whole vault)](https://github.com/reorx/obsidian-paste-image-rename/issues/73)
- Category: Bulk feature / high risk
- Reproduction / request: Want whole-vault batch rename rather than one note at a time.
- Acceptance / disposition: Defer until single-note safe/idempotent; preview, backup/recovery plan, shared-attachment ownership and cancellation.

### P4 · [#72 Option for cancel button to delete file](https://github.com/reorx/obsidian-paste-image-rename/issues/72)
- Category: Deletion UX feature / high risk
- Reproduction / request: Cancel should optionally delete newly pasted file.
- Acceptance / disposition: Separate explicit discard control with recoverable trash and link cleanup; never delete shared/existing file.

### P4 · [#70 Add Png to Jpeg option](https://github.com/reorx/obsidian-paste-image-rename/issues/70)
- Category: Compression feature
- Reproduction / request: PNG-to-JPEG with quality slider.
- Acceptance / disposition: Subset #33; don't remove transparency or original bytes silently.

### P4 · [#39 Move attachments with note](https://github.com/reorx/obsidian-paste-image-rename/issues/39)
- Category: Attachment lifecycle feature
- Reproduction / request: Move a note; attachments remain in old folder.
- Acceptance / disposition: Shared with #94; avoid guessing ownership from basename alone.

### P4 · [#33 Support image optimization while renaming](https://github.com/reorx/obsidian-paste-image-rename/issues/33)
- Category: Compression feature
- Reproduction / request: Request lossy/lossless image optimization.
- Acceptance / disposition: Opt-in only; byte backup/recovery, transparency/orientation/animation preserved or warned; review PR114 separately.

### P4 · [#1 auto move image by name-dest rules](https://github.com/reorx/obsidian-paste-image-rename/issues/1)
- Category: Attachment routing feature
- Reproduction / request: Move images via name/destination rules; comment asks tags considered.
- Acceptance / disposition: Define ordered explicit routing rules and safe previews; broader than rename maintenance.

### G · [#122 Request to take over plugin/repository](https://github.com/reorx/obsidian-paste-image-rename/issues/122)
- Category: Governance
- Reproduction / request: Jalad25 asks fork/transfer/plugin-id takeover.
- Acceptance / disposition: Owner reply confirmed in comments; no transfer approved. Handle separately from code backlog.

## All open pull requests

- [#114 Added image compression when pasting to reduce file size](https://github.com/reorx/obsidian-paste-image-rename/pull/114): P4 #33/#70 compression candidate. Large diff includes generated bundle and broader format/batch changes. Audit opt-in defaults, actual encoding MIME support, byte preservation, transparency/animation, source deletion and broken-link rollback. Do not mix into maintenance fixes. (Open, 9 files; head ea7602de001dc55cc47cf076d5a275c9934e862e.)
- [#110 added canvas support for pasted image in canvas](https://github.com/reorx/obsidian-paste-image-rename/pull/110): P2 #29/#101 candidate. Uses TextFileView fallback and suppresses no-editor error for canvas. Need valid canvas link update tests, null file check, no prompt on canvas creation, and API/min-version compatibility. (Open, 1 files; head 34c7a3087c6bc68d2453f6bc65bfa5d111271fca.)
- [#106 Add Support for Path Names in Filenames with Recursive Directory Creation](https://github.com/reorx/obsidian-paste-image-rename/pull/106): P2 #49/#60/#83 candidate, but computes newPath from newDir/newFileName without original parent; ordinary names can move to vault root. Dedup still original directory; do not merge unchanged. (Open, 2 files; head 059b4078417c36b44b17fecd1d266863021ccaa4.)
- [#90 Exclude rename for regex matching paths](https://github.com/reorx/obsidian-paste-image-rename/pull/90): P1 partial #56 candidate, NOT complete #121/#115 fix: matches active note, not newly created attachment. Null activeFile and invalid regex need guards; exclude version bumps from core patch. (Open, 6 files; head 3f3ba7a8237568cd40f3ddfe2dd388cf557829ed.)
- [#86 Fix not updated links on multiple file insert when AutoRename is enabled](https://github.com/reorx/obsidian-paste-image-rename/pull/86): P0 candidate for #58. Captures editor/cursor before awaiting auto rename, but modal path still captures on confirm; test delayed insertion, note switches and same-line multiple links. Avoid any-typed API and unrelated lockfile churn. (Open, 2 files; head 6fecaf6a33db086a283c8fb2ad12432911e71a0f.)
- [#85 Add template variable {{dirPath}}](https://github.com/reorx/obsidian-paste-image-rename/pull/85): P2 path/dirPath candidate. Alters destination/dedup; recursive getDirectoryPath dereferences parent and risks vault-root null. Needs clear relative/vault-root semantics and collision tests. (Open, 3 files; head b7c7e27e09596be4a46fcf8f66b1f7bd38ca251a.)
- [#75 feat: add template suffix to image renaming](https://github.com/reorx/obsidian-paste-image-rename/pull/75): P3 #57/#62 candidate. Current applySuffix returns empty string when no suffix and uses original pre-rename link, so can delete or restore old links; assumes wiki closing brackets even for Markdown. User confirmations are not sufficient; rewrite/test before merge. (Open, 1 files; head c2af584a3499a1c8b51670775128e539c618d303.)
- [#67 Fix prompt not appearing on linux](https://github.com/reorx/obsidian-paste-image-rename/pull/67): P1 narrow candidate for #25 and Linux subset of #112; replaces zero ctime with mtime. Multiple user confirmations. Does not fix >1s network delay, old file imports or sync provenance. (Open, 1 files; head 357f8f7c18ef4aef601ca705c33a687aaa49f3cb.)
- [#52 Fix #49](https://github.com/reorx/obsidian-paste-image-rename/pull/52): P2 #49 candidate. Creates destination directory but leaves slash-stripping and original-directory collision logic unresolved. Includes unnecessary fork README/version changes. Not a complete safe path implementation. (Open, 6 files; head 7c814b95d678c1bc3063b4067231d828a71fe5e7.)

## Regression gate before release

Use disposable vault fixtures, never real user notes. Assert file bytes unchanged for rename-only operations, links resolve, no duplicate identities, existing files are never overwritten, and injected errors retain usable originals. Cover wiki/Markdown embeds, Unicode and spaces, aliases/width, repeated embeds and cross-note references, stale metadata, unsupported/missing links, concurrent paste and note switching, regex errors, current-file self-collision, ctime=0, startup/sync creates, nested attachment folders, Canvas, mobile large images. Unit/build passing does not replace Obsidian integration and iOS crash verification.

## Source links

- [Main implementation](https://github.com/reorx/obsidian-paste-image-rename/blob/master/src/main.ts)
- [Template implementation](https://github.com/reorx/obsidian-paste-image-rename/blob/master/src/template.ts)
- [Batch modal](https://github.com/reorx/obsidian-paste-image-rename/blob/master/src/batch.ts)
- [Filename sanitizer](https://github.com/reorx/obsidian-paste-image-rename/blob/master/src/utils.ts)
- [#25 ctime finding](https://github.com/reorx/obsidian-paste-image-rename/issues/25#issuecomment-1559225158)
- [#58 multiple-insert reproduction](https://github.com/reorx/obsidian-paste-image-rename/issues/58#issuecomment-1538481525)
- [#41 Enter workaround](https://github.com/reorx/obsidian-paste-image-rename/issues/41#issuecomment-1529054293)
- [#122 owner response](https://github.com/reorx/obsidian-paste-image-rename/issues/122#issuecomment-6150120690)


## Local checkpoint 1 verification

2026-10-13 16:36 UTC: 33/33 automated tests passed, production build/typecheck passed,
ESLint on `src/**/*.ts` passed without warnings, and `git diff --check` passed.
Independent code review checked rename queue recovery, source identity, deleted/edited
lines, aliases, stale previews, and repeated numbering. Stable QA bundle copied to a
separate candidate directory; actual Obsidian QA remains pending.

## Native-app checkpoint 1 results

2026-10-13 16:41 UTC, real Obsidian 1.14.4 disposable vault, bundle for `b177c36`:

- Baseline reproduced early abort on an embedded Markdown note before images.
- Fixed mixed batch continued; duplicate width/alias embeds and a shared second-note reference remained correct.
- PNG content hashes unchanged; repeated batch left note/file bytes unchanged.
- With automatic internal-link updates OFF, no rename or note mutation occurred.
- Actual multi-file clipboard insertion still in progress; this is not yet an assertion that all #58 cases pass.

## Second-candidate review corrections

- Added parsed ordinary links alongside embeds so general attachments such as ZIP/CSV are not silently skipped.
- Rechecked unload after awaited destination listing to prevent a late filesystem mutation after plugin disable.
- Extended isolated coverage to these cases; final second-candidate verification is recorded with its local commit.

2026-10-13 16:43 UTC: second candidate passed 45/45 tests, production build/typecheck,
ESLint and whitespace checks. Independent reviewer reran tests/typecheck and confirmed
ordinary-link support and zero rename after unload during delayed allocation. Approved
for a local checkpoint and native QA, not for an unverified release.

## Third candidate: stable batch time and early validation

2026-10-13 16:48 UTC:

- #78: one timestamp object per instant batch, with a fresh clock on each separate run. Added an injectable clock seam so template tests do not require a browser window.
- Filename validation rejects illegal raw batch replacements and Windows device names (including superscript COM/LPT variants) before filesystem mutation. Manual/generated stems still use the existing sanitization flow, now Unicode-preserving.
- Added an occupied-folder collision regression; existing folders are not mistaken for a free filename.
- Documented existing time-token support (#59/#98), permalink frontmatter (#103), one-colon DATE syntax (#65), and valid percent-encoding in Markdown links (#109). These are documentation dispositions, not new syntax or indiscriminate issue closures.
- Windows reserved-name source: https://learn.microsoft.com/en-us/windows/desktop/fileio/naming-a-file
- Candidate 2 native QA passed the exact two-file clipboard paste that broke candidate 1: persisted Markdown destinations and renamed image files agree. Note-switch verification continues.

2026-10-13 16:52 UTC: third candidate passed 50/50 tests, production build/typecheck,
lint and diff-check; independent reviewer confirmed 50/50 and inspected the final
clock/validation/docs corrections. Candidate 2 native pair-paste mapping passed twice
with matching image-content hashes. Deterministic immediate-note-switch UI coverage
is not claimed; the isolated race regression passes.

## Current disposition ledger (all 73 open issues)

As of 2026-10-13 17:13 UTC. These are local dispositions, not GitHub closure claims.
Native verification applies only to explicitly recorded scenarios; platform reports and broad feature requests remain open.

- **27 — Candidate implementation with automated coverage (native checks noted separately):** #58, #121, #120, #115, #99, #56, #46, #25, #113, #97, #92, #87, #81, #80, #54, #41, #84, #93, #71, #48, #47, #111, #37, #38, #116, #105, #22.
- **16 — Partial mitigation or reporter/platform reproduction still required:** #107, #119, #112, #108, #96, #91, #89, #68, #61, #117, #79, #78, #76, #66, #64, #63.
- **5 — Existing capability clarified in documentation:** #109, #103, #98, #65, #59.
- **24 — Destination/integration/behavior design or broader feature scope required:** #55, #101, #83, #82, #74, #60, #49, #29, #100, #95, #88, #77, #62, #57, #53, #45, #44, #94, #73, #72, #70, #39, #33, #1.
- **1 — Governance, separate from code:** #122.

### Exact remaining information or decisions

- #107: a minimal original DOCX (or imported note + original image folder) showing the mismatch, plus Docxer version/settings. Synthetic Docxer-style Markdown is useful but is not the original report reproduction.
- #89/#68: iOS device/version, source photo size/format, whether the crash occurs with only this plugin enabled, and console/crash evidence. Linux tests cannot certify iOS camera memory behavior.
- #91/#79: current macOS version/Obsidian build and exact clipboard route (image pixels vs Finder file copy). A current clean-vault native test is needed; timestamp changes alone do not prove historical reports fixed.
- #108/#61/#96/#117/#66/#76/#64/#112/#119: minimal affected note/files, settings, enabled-plugin list and failing console output. Keep collisions, importer duplication, rendering CSS, link syntax and plugin-load failures separate.
- Folder feature cluster: should a pattern path be relative to the note, Obsidian attachment folder, or vault root? Should moving shared attachments be allowed? Need preview/repeat-run rules before creating/moving folders automatically.
- The eleven bounded naming/modal enhancements are now implemented with unchanged defaults and explicit semantics. Remaining naming questions concern full-filename/extension templates, cross-extension numbering, fallback expressions and optional groups; those require compatibility choices beyond the delivered additions.
- Larger features: Canvas/Excalidraw adapters, link-format/width/caption changes, cross-extension counters, template expression grammar, routing/whole-vault moves, compression and delete-on-cancel need explicit designs and tests. They are not required to ship the current rename-safety fixes.

## Fourth safety audit

2026-10-13 17:03 UTC:

- Preflight the complete batch preview before the first rename; keep per-item stale-path checks during execution and capture source path when a request enters the rename queue.
- Unexpected I/O failure reports the completed count and failed source; no false all-or-nothing claim. Cancel stops remaining batch tasks after the in-flight operation completes, without rolling completed renames back.
- Unload closes a snapshot of all open modals; repeated close cannot unregister an unrelated modal. Empty button submission and failed-modal persistence have DOM-boundary regression coverage.
- Test bundles now go to `.test-build/`; release command explicitly whitelists the three plugin files, avoiding accidental test-bundle uploads. No release was run.
- 59/59 tests, production build/typecheck, lint and whitespace checks passed. Independent final review is in progress.
- Native reports and synthetic saved-note/hash evidence are preserved in [real-app-test-report.md](real-app-test-report.md) and `test-evidence/`. Actual clipboard paste, shared references, aliases, idempotence, synthetic Docxer mapping, and controlled delayed source-switch are verified for the exact builds listed there.

2026-10-13 17:03 UTC: independent fourth-candidate review reran all 59 tests,
typecheck/lint/diff-check and verified the build contains only the three release
artifacts. No remaining confirmed blocker in the reviewed safety scope.

## Bounded convenience group 1

2026-10-13 17:05 UTC. Explicitly backward-compatible additions, existing defaults unchanged:

- #84/#93: Use original name button fills an editable, sanitized attachment stem without submitting or duplicating the extension.
- #37/#38: attachmentName and originalAttachmentFileName aliases expose the stem immediately before the current operation. No historical-name persistence; repeated prefixing batches can prefix again, documented explicitly.
- #47/#111: fileNameSlug/FileNameSlug aliases lowercase and collapse whitespace to hyphens, preserve Unicode, and do not transliterate names.
- Added focused modal/template regressions; integration checks pending the frozen feature build.

2026-10-13 17:08 UTC: convenience group 1 passed 63/63 tests, production
build/typecheck, lint and whitespace checks; independently rerun. Template dispatch
is now single-pass so placeholder-looking filenames/frontmatter remain literal data.

## Bounded convenience group 2 and native stale-plan correction

2026-10-13 17:11 UTC:

- #71: optional start/end/select-all cursor placement, default end; applies consistently to original-name refill.
- #48: optional minimum counter width 1–12, default 1; padded and unpadded existing numbers are parsed together, existing conforming names remain stable.
- #22: UUIDv4 and HEX aliases use one secure random identifier per template render/file operation; repeated tokens share it, future operations intentionally regenerate it.
- #105/#116: nearestHeading/headerName from the earliest parsed reference to that exact attachment in the captured source. Any heading level, empty before the first heading/no reference; firstHeading unchanged. No current-cursor dependence.
- Native QA found external filesystem move can leave a stale TFile with its old path. Added full vault-identity checks in whole-batch preflight, per-item execution and before/after queued allocation. This prevents detectable stale plans before starting; it is not transactional rollback against future external changes. Completed valid renames remain reported accurately.
- Tests include stale deleted/replaced identity without a changed path, and new option defaults/semantics. Native retest subsequently passed: stale external move now stops before the first mutation.

2026-10-13 17:16 UTC: final review also identified an imported-counter overflow edge.
The allocator now increments decimal strings exactly beyond JavaScript safe integers,
so it cannot choose the occupied largest filename by rounding. Added overflow/carry,
IME Enter, and UUID displayed-proposal/submitted-name regressions. Latest frozen native
QA snapshot predates only this allocator edge fix; it is not overwritten mid-test.

2026-10-13 17:17 UTC: final optional-controls/stale-identity candidate independently
passed all 73 tests, typecheck, lint and whitespace checks. No remaining confirmed
blocker in the scoped code review. Latest/minimum-version mobile runtimes are not
certified by desktop or Node tests. Native final-option and stale-preview rechecks
remain tied to exact snapshots in the test report.

## Final native verification and delivery gate

2026-10-13 17:26 UTC. Final source `ffd813ec49de8c5172ea2792d9aae467a9e839d2`,
`main.js` SHA256 `652dd495227de410789e0848a5a7706cc9c0a70d921bc4625d6abbd51afa6b51`:

- Native Use original name fills the extension-free stem, honors select-all, does not submit; editing and confirming changes both file and saved link correctly.
- Native two-file paste with Unicode slug and three-digit numbering saves ordered, resolving links and preserves original cyan/orange PNG hashes.
- The external-move stale-preview case passed on the feature snapshot before the last decimal-counter edge fix; no first-row mutation occurred. The final patch retains those vault-identity guards.
- Full evidence and exact-build mapping are in the updated real-app report. Earlier versions' checks are not claimed as wholesale final-version reruns.
- Still not native-certified: cancellation during an in-flight batch; every UUID/HEX/nearest-heading/attachment-name alias and cursor mode; ordinary ZIP insertion, folder exclusions, missing-first embed; minimum app versions, iOS/macOS-specific conditions and original Docxer DOCX. Automated coverage for relevant local logic is distinguished from these gaps.
- Code is frozen. The final following commit is documentation/evidence only. The preview archive contains tracked source, exactly three tested plugin files, cumulative patch and Chinese instructions; no remote actions, official release or version bump.

## Publication and issue-closure audit — 2026-10-13

After acceptance, the maintainer authorized publication and closure of resolved related issues. The accepted snapshot was published to `maintenance/issue-backlog-20261013` at [7e7a70d](https://github.com/reorx/obsidian-paste-image-rename/commit/7e7a70dce910f9c716f10ad698555143624cb8f1).

HTTPS push lacked credentials, so the GitHub Git Data API created a single commit based on baseline `3801513`. Its tree `5887a4a75c9a754dbfe8bed036e1fc913eadd146` exactly matches accepted local snapshot `19c50908`; fetching the branch and comparing with the accepted snapshot produced no differences. Original local checkpoint history remains preserved. Master is unchanged, and no release, version bump, tag or ownership transfer was performed.

The closure review distinguished implemented requests from partial implementations. It retained #25 (Arch/Spectacle and network-drive reproduction), #38 (different imported-file versus pasted-image behavior), #81 (folder-producing DATE pattern), and #111 (requested separator/casing variants) despite their earlier candidate classification. Documentation issues #98, #103 and #109 also remain open because existing alternatives do not completely establish the requested behavior. All 16 original partial/reproduction/platform cases, 24 broader design/integration cases, and governance #122 remain open.

CI observation: the published source contains no GitHub Actions workflows. No check runs, commit statuses or Actions runs were present after publication. Six installed-app check-suite shells were queued with zero runs (Vercel, Railway, Render, Cloudflare, Docker and Claude); the baseline has the same five older app shells queued with zero runs since December 2025. This is not a CI pass. The verified local 73-test, build/typecheck/lint and native Obsidian results remain the acceptance evidence.

Verified at 2026-10-13 23:58 UTC: **25 of 25 closures succeeded, zero failures; 48 issues remain open.** Each received an individualized explanation linking the published implementation and disclosing that the build is not released. Each comment and `closed` / `completed` state was read back. No issue labels, bodies, assignees or milestones were changed.

Closed code requests (23): #22, #37, #41, #46, #47, #48, #54, #56, #58, #71, #80, #84, #87, #92, #93, #97, #99, #105, #113, #115, #116, #120, #121. Documentation closures (2): #59 and #65.

Closure receipts:

- [#22](https://github.com/reorx/obsidian-paste-image-rename/issues/22#issuecomment-6157680878) — comment and completed closure verified.
- [#37](https://github.com/reorx/obsidian-paste-image-rename/issues/37#issuecomment-6157688381) — comment and completed closure verified.
- [#41](https://github.com/reorx/obsidian-paste-image-rename/issues/41#issuecomment-6157688924) — comment and completed closure verified.
- [#46](https://github.com/reorx/obsidian-paste-image-rename/issues/46#issuecomment-6157689431) — comment and completed closure verified.
- [#47](https://github.com/reorx/obsidian-paste-image-rename/issues/47#issuecomment-6157689996) — comment and completed closure verified.
- [#48](https://github.com/reorx/obsidian-paste-image-rename/issues/48#issuecomment-6157690635) — comment and completed closure verified.
- [#54](https://github.com/reorx/obsidian-paste-image-rename/issues/54#issuecomment-6157691224) — comment and completed closure verified.
- [#56](https://github.com/reorx/obsidian-paste-image-rename/issues/56#issuecomment-6157699502) — comment and completed closure verified.
- [#58](https://github.com/reorx/obsidian-paste-image-rename/issues/58#issuecomment-6157700114) — comment and completed closure verified.
- [#59](https://github.com/reorx/obsidian-paste-image-rename/issues/59#issuecomment-6157700702) — comment and completed closure verified.
- [#65](https://github.com/reorx/obsidian-paste-image-rename/issues/65#issuecomment-6157701283) — comment and completed closure verified.
- [#71](https://github.com/reorx/obsidian-paste-image-rename/issues/71#issuecomment-6157701815) — comment and completed closure verified.
- [#80](https://github.com/reorx/obsidian-paste-image-rename/issues/80#issuecomment-6157702427) — comment and completed closure verified.
- [#84](https://github.com/reorx/obsidian-paste-image-rename/issues/84#issuecomment-6157712270) — comment and completed closure verified.
- [#87](https://github.com/reorx/obsidian-paste-image-rename/issues/87#issuecomment-6157712877) — comment and completed closure verified.
- [#92](https://github.com/reorx/obsidian-paste-image-rename/issues/92#issuecomment-6157713896) — comment and completed closure verified.
- [#93](https://github.com/reorx/obsidian-paste-image-rename/issues/93#issuecomment-6157715274) — comment and completed closure verified.
- [#97](https://github.com/reorx/obsidian-paste-image-rename/issues/97#issuecomment-6157714614) — comment and completed closure verified.
- [#99](https://github.com/reorx/obsidian-paste-image-rename/issues/99#issuecomment-6157715977) — comment and completed closure verified.
- [#105](https://github.com/reorx/obsidian-paste-image-rename/issues/105#issuecomment-6157723121) — comment and completed closure verified.
- [#113](https://github.com/reorx/obsidian-paste-image-rename/issues/113#issuecomment-6157724934) — comment and completed closure verified.
- [#115](https://github.com/reorx/obsidian-paste-image-rename/issues/115#issuecomment-6157723733) — comment and completed closure verified.
- [#116](https://github.com/reorx/obsidian-paste-image-rename/issues/116#issuecomment-6157724381) — comment and completed closure verified.
- [#120](https://github.com/reorx/obsidian-paste-image-rename/issues/120#issuecomment-6157726373) — comment and completed closure verified.
- [#121](https://github.com/reorx/obsidian-paste-image-rename/issues/121#issuecomment-6157725504) — comment and completed closure verified.
