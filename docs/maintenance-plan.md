# Maintenance plan and progress

Updated: 2026-10-14. Baseline: `3801513c406a86ad90c94a1bd7c95c6b837e063d`.
Current branch: `master`. The accepted maintenance branch was fast-forward merged with explicit maintainer approval. Future work in this repository defaults to `master`; the maintenance branches remain preserved. 25 verified issue closures; no release.

<a id="issue-index"></a>

## Open issue index — 41 issues

Current GitHub status checked on 2026-10-14 04:56 UTC: **41 open issues**.
The 32 closed issues have been removed from this table; all 73 individual detail
sections and their historical evidence remain below. Priorities and categories
retain the original triage; priorities are proposed, not GitHub labels. `G` denotes
governance. Issue numbers open GitHub; **Details** jumps to the individual section.

**Index maintenance rule:** This table lists open GitHub issues only. When an issue
is closed, remove its row from this table. Preserve its individual detail section,
stable anchor, historical progress, verification evidence, and closure receipts below.
Verify current GitHub states when updating the index; a partial implementation is
not a closed issue.

<table>
<thead>
<tr><th>Issue</th><th>Title</th><th>Category</th><th>Processing status</th><th>Reason</th><th>Details</th></tr>
</thead>
<tbody>
<tr><th colspan="6">P0</th></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/107">#107</a></td><td>Orphaned images during rename</td><td>Data integrity</td><td>Paused</td><td>Original Windows DOCX/imported files missing; earlier importer attempt failed, native picker later recovered during #66.</td><td><a href="#issue-107">Details</a></td></tr>
<tr><th colspan="6">P1</th></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/119">#119</a></td><td>attachment rename limitations in a note</td><td>Batch bug</td><td>Paused</td><td>500-image mixed batch passes; original Windows note, files and error log needed to reproduce random stop.</td><td><a href="#issue-119">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/112">#112</a></td><td>Stopped working some time ago</td><td>Platform compatibility</td><td>Paused</td><td>Timestamp/reference tests pass; aggregate macOS CleanShot/Finder and Windows/plugin-conflict reports need exact platform/settings reproduction.</td><td><a href="#issue-112">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/108">#108</a></td><td>pasting in an image create duplicate named images</td><td>Data integrity investigation</td><td>Paused</td><td>Repeated events/concurrency tests and previous native paste preserve one file per insertion; missing version/settings and duplicate-file fixture.</td><td><a href="#issue-108">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/96">#96</a></td><td>Better integration with git plugin</td><td>Compatibility / integrity</td><td>Paused</td><td>Already-referenced restore tests pass; new note+attachment sync is indistinguishable from insertion without Git-operation provenance/ownership policy.</td><td><a href="#issue-96">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/91">#91</a></td><td>Paste does not work anymore in Obsidian 1.5.12</td><td>Platform compatibility</td><td>Paused</td><td>macOS Sonoma/Obsidian1.5.12 clipboard and Imgur integration cannot be reproduced on available Linux; no console trace.</td><td><a href="#issue-91">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/89">#89</a></td><td>Attachment by taking a photo sometimes crashes on iOS</td><td>Crash / mobile</td><td>Paused</td><td>No iOS17.3.1 camera/crash-log environment; lifecycle tests pass but native image-preview decoding is untested.</td><td><a href="#issue-89">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/68">#68</a></td><td>the plugin can't work on mobile phones if the image is large</td><td>Platform compatibility</td><td>Paused</td><td>80MiB metadata lifecycle probes pass12/12; original mobile photo, format/device/version and insertion timing unavailable.</td><td><a href="#issue-68">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/61">#61</a></td><td>A naming conflict occurs when used with Local images plus</td><td>Compatibility / integrity</td><td>Paused</td><td>Downloader documents incompatibility and retains hashed paths after create; supported completion/provenance hook or single-owner policy needed.</td><td><a href="#issue-61">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/55">#55</a></td><td>Rename failed, Destination file already exists</td><td>Path / collision bug</td><td>Paused</td><td>Relative-folder workflow intentionally rejected before mutation; base directory, creation and shared-attachment move policy need decision.</td><td><a href="#issue-55">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/25">#25</a></td><td>Pasted image not prompting a dialog</td><td>Platform compatibility</td><td>Paused</td><td>Zero-ctime/delayed-reference probes pass; original Spectacle and SMB/mapped-drive event traces remain unavailable.</td><td><a href="#issue-25">Details</a></td></tr>
<tr><th colspan="6">P2</th></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/117">#117</a></td><td>Image sizes change</td><td>Rendering investigation</td><td>Paused</td><td>No before/after image or embed/CSS fixture; bytes unchanged in prior native QA and width/alias regressions pass.</td><td><a href="#issue-117">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/109">#109</a></td><td>Chinese file names containing spaces are escaped</td><td>Link compatibility / docs</td><td>Skipped</td><td>Percent-escaped spaces are valid Markdown; raw-space expectation needs angle destinations or explicit format policy, not blind unescaping.</td><td><a href="#issue-109">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/101">#101</a></td><td>Can't rename pasted image on canvas</td><td>Canvas compatibility</td><td>Paused</td><td>Canvas has no Markdown metadata source; needs supported live-node/reference integration and shared-file policy.</td><td><a href="#issue-101">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/83">#83</a></td><td>[Feature]Allow folder creation.</td><td>Path feature / bug</td><td>Paused</td><td>Proposed current-parent folder creation nests paths on repeat; stable destination base/shared-file move semantics unresolved.</td><td><a href="#issue-83">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/81">#81</a></td><td>Multiple use of DATE: variable</td><td>Template bug</td><td>Paused</td><td>Multiple DATE tokens render correctly; supplied date-folder workflow still cannot be saved until routing policy is implemented.</td><td><a href="#issue-81">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/79">#79</a></td><td>When I drag an image into a document, it can't be renamed</td><td>Compatibility / docs</td><td>Paused</td><td>Screenshot filename policy works with Handle all attachments enabled; reporter settings and native macOS copy/drag trace missing.</td><td><a href="#issue-79">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/78">#78</a></td><td>When there are too many pictures in an article, such as 30, they cannot be effectively renamed.</td><td>Batch / numbering</td><td>Paused</td><td>Timestamp instability fixed/tested; cross-extension global numbering and whole-vault renaming requests remain broader semantics.</td><td><a href="#issue-78">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/76">#76</a></td><td>It doesn't effect when pictures are “webp” format</td><td>Format compatibility</td><td>Paused</td><td>WEBP policy/batch passes; supplied screenshot shows MD5-named PNG, suggesting importer/prefix interaction rather than unsupported format.</td><td><a href="#issue-76">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/74">#74</a></td><td>It doesn't work in Excalidraw</td><td>Excalidraw compatibility</td><td>Paused</td><td>Issue has title only; no drawing/plugin version/workflow. Needs supported Excalidraw source/reference integration.</td><td><a href="#issue-74">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/66">#66</a></td><td>amazing! yet it does not seem to respect the obsidian subfolder name option for attachment saving?</td><td>Path compatibility</td><td>Paused</td><td>Native Linux ./assets paste passes, but original macOS/iPad placement failure not reproduced; baseline already used same parent join.</td><td><a href="#issue-66">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/64">#64</a></td><td>Cannot enable plugin.  Have never encountered this before with any plugin.</td><td>Install investigation</td><td>Paused</td><td>Current build activates in native Obsidian; report provides no app/OS version or console/module error to reproduce install failure.</td><td><a href="#issue-64">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/60">#60</a></td><td>Specifiying directory when renaming</td><td>Path feature</td><td>Paused</td><td>Custom attachment-relative routing needs stable base on repeated batch and destination/shared-reference policy; plain rename only is supported.</td><td><a href="#issue-60">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/49">#49</a></td><td>Create parent folder when it does not exist</td><td>Path feature / bug</td><td>Paused</td><td>Auto-created note.assets destination can nest on repeat with current-parent logic; stable routing/creation policy not implemented.</td><td><a href="#issue-49">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/29">#29</a></td><td>pasting to a canvas doesn't trigger the plugin</td><td>Canvas compatibility</td><td>Paused</td><td>Canvas naming/source-node support remains absent; startup/no-source guards pass but do not implement live Canvas references.</td><td><a href="#issue-29">Details</a></td></tr>
<tr><th colspan="6">P3</th></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/103">#103</a></td><td>hope to rename using permalink</td><td>Documentation / existing capability</td><td>Paused</td><td>Safe {{frontmatter:permalink}} stem works; no example defines URL/path extraction, routing or permalink property schema.</td><td><a href="#issue-103">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/95">#95</a></td><td>[Feature] Add Input Field and Presets for Image Width During Insertion</td><td>Embed feature</td><td>Paused</td><td>Native Obsidian external-change merge corrupted the width candidate after two review corrections; unpublished patch preserved, source restored.</td><td><a href="#issue-95">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/88">#88</a></td><td>Add Field for Source of the image</td><td>Embed feature</td><td>Paused</td><td>Caption insertion shares the confirmed #95 core-link/editor merge race; safe host transaction coordination is needed first.</td><td><a href="#issue-88">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/77">#77</a></td><td>Is it possible to convert MD Links to wikilinks?</td><td>Link-format feature</td><td>Paused</td><td>Public cache lacks paired current text outside change events; safe conversion needs a proven parser and alt/path semantics.</td><td><a href="#issue-77">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/62">#62</a></td><td>Allow for templated suffix</td><td>Embed feature</td><td>Paused</td><td>Suffix insertion shares #95 native merge race; PR75 also deletes empty suffix links and restores old targets.</td><td><a href="#issue-62">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/57">#57</a></td><td>Add an option to set width for pictures</td><td>Embed feature</td><td>Paused</td><td>Requested default/prompt width depends on the #95 native merge race; PR75 has additional link-integrity defects.</td><td><a href="#issue-57">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/44">#44</a></td><td>trim dashes from empty variables</td><td>Template feature</td><td>Doing</td><td>Read original request and compare implemented template behavior.</td><td><a href="#issue-44">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/38">#38</a></td><td>Keep original filename of attachment</td><td>Template feature</td><td></td><td></td><td><a href="#issue-38">Details</a></td></tr>
<tr><th colspan="6">P4</th></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/94">#94</a></td><td>Add option to, while batch renaming, moving the picture to [[subfolder name]]</td><td>Attachment lifecycle feature</td><td></td><td></td><td><a href="#issue-94">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/73">#73</a></td><td>Batch rename embeded files (whole vault)</td><td>Bulk feature / high risk</td><td></td><td></td><td><a href="#issue-73">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/72">#72</a></td><td>Option for cancel button to delete file</td><td>Deletion UX feature / high risk</td><td></td><td></td><td><a href="#issue-72">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/70">#70</a></td><td>Add Png to Jpeg option</td><td>Compression feature</td><td></td><td></td><td><a href="#issue-70">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/39">#39</a></td><td>Move attachments with note</td><td>Attachment lifecycle feature</td><td></td><td></td><td><a href="#issue-39">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/33">#33</a></td><td>Support image optimization while renaming</td><td>Compression feature</td><td></td><td></td><td><a href="#issue-33">Details</a></td></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/1">#1</a></td><td>auto move image by name-dest rules</td><td>Attachment routing feature</td><td></td><td></td><td><a href="#issue-1">Details</a></td></tr>
<tr><th colspan="6">G</th></tr>
<tr><td><a href="https://github.com/reorx/obsidian-paste-image-rename/issues/122">#122</a></td><td>Request to take over plugin/repository</td><td>Governance</td><td></td><td></td><td><a href="#issue-122">Details</a></td></tr>
</tbody>
</table>

### Sequential processing workflow

The table's **Processing status** is separate from GitHub's open/closed state; every
listed issue is still open. For this new sequential execution pass, initialize
processing statuses and reasons as blank. Blank means not yet selected/reviewed in
this pass, not that the issue has never been read or triaged; the earlier findings
and evidence remain authoritative within their recorded scope.

1. Work through the open issues in priority order (`P0`, `P1`, `P2`, `P3`, `P4`, then
   `G`) and retain the displayed order within each priority. Read each issue's current
   thread and historical details before deciding its next step.
2. Mark an issue **Doing** once it is accepted for active work in this pass.
3. After **2–3 failed attempts**, mark it **Paused**, record the failed approaches and
   blocking reason in **Reason**, and continue to the next issue.
4. If an issue **cannot be reproduced**, mark it **Skipped**, record the reproduction
   conditions and reason in **Reason**, and continue to the next issue.
5. Once an issue is solved and the result verified, comment on its GitHub thread to
   tell the reporter what was resolved, close the issue, and remove its table row.
   Preserve its individual detail section, stable anchor, progress, and evidence below.

A **Reason** is required for every **Paused** or **Skipped** row. Empty status and
reason cells above intentionally start this pass without carrying forward assumed
processing outcomes from the historical triage.

## Current result — accepted maintenance merged into master; 25 issues closed

Updated 2026-10-14 00:06 UTC. Merge checkpoint: `88cdb1d2555cda28d77f85efdba97b3f3540742c` fast-forwarded onto `master`. Publication commit: [`7e7a70d`](https://github.com/reorx/obsidian-paste-image-rename/commit/7e7a70dce910f9c716f10ad698555143624cb8f1), exactly matching accepted snapshot `19c50908`. Latest tested source commit:
`ffd813ec49de8c5172ea2792d9aae467a9e839d2`.
Final plugin `main.js` SHA256:
`652dd495227de410789e0848a5a7706cc9c0a70d921bc4625d6abbd51afa6b51`.

- Six code checkpoints completed and accepted. Published to the maintenance branch; 25 issues closed after individual scope/evidence review (23 code requests and 2 existing-capability documentation cases). 48 of the original 73 issues remain open. Merged into `master` by fast-forward on 2026-10-14 after explicit approval. No tag, release, version bump or ownership change.
- 73/73 automated tests, production build/typecheck, lint and whitespace checks passed; independent review reran the checks.
- Original inventory: 27 candidate implementations, 16 partial/reproduction/platform cases, 5 existing-capability documentation, 24 broader design/integration decisions, and 1 governance item. Closure review retained 4 prior candidates (#25, #38, #81, #111) and 3 documentation cases (#98, #103, #109). The publication audit below supersedes candidate counts as a resolution claim. Test count is not an assertion that all issues are fixed.
- Native Obsidian 1.14.4 testing verified mixed batches/shared references/aliases, idempotence, unchanged image bytes, actual multi-file clipboard paste, synthetic Docxer-style ordered mapping, and controlled delayed source-note switching on the exact builds in [the report](real-app-test-report.md). The final artifact also passed manual original-name fill/confirm and Unicode-slug/three-digit native pair-paste checks; the filesystem-move stale-preflight regression passed on the preceding feature snapshot.
- Original Docxer DOCX and iOS/macOS-specific reports remain unverified. No blanket all-issues-fixed or release-ready claim.

**Reading this log:** later checkpoints supersede earlier ones. The historical first
candidate's multi-paste failure was reproduced in the real app, then fixed and retested
in candidate 2. The old timestamp heuristic described in checkpoint 1 was replaced in
checkpoint 2. Historical pending items below are not the current status; this summary,
the dated issue statuses, publication/closure audit, and latest native report are
authoritative for this pass.

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

### Original open-backlog snapshot — 2026-10-13

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

## All 73 tracked issues, highest priority first

Each section retains the original reproduction/request and acceptance criteria.
The dated current-status line reflects the closure audit; historical descriptions
of defects or pending work must be read with the later verification checkpoints.
[Back to the open issue index](#issue-index)

<a id="issue-107"></a>

### P0 · [#107 Orphaned images during rename](https://github.com/reorx/obsidian-paste-image-rename/issues/107)
- Category: Data integrity
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Batch-rename Docxer-imported images; note paths change while physical files reportedly do not.
- Acceptance / disposition: Every resulting embed resolves to the intended unchanged-content file; inject rename errors and retain original links. Root cause not reproduced.

<a id="issue-58"></a>

### P0 · [#58 Sometimes file link isn't renamed after the image file is renamed.](https://github.com/reorx/obsidian-paste-image-rename/issues/58)
- Category: Data integrity
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/58#issuecomment-6157700114).
- Reproduction / request: Paste two or more images simultaneously; only last link updates (comments confirm).
- Acceptance / disposition: All links resolve after multi-insert, slow I/O, cursor movement and note switches. Review PR86; cursor snapshot alone is not complete transaction safety.

<a id="issue-121"></a>

### P1 · [#121 Exclude folders from automatic attachment renaming*](https://github.com/reorx/obsidian-paste-image-rename/issues/121)
- Category: Compatibility / integrity
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/121#issuecomment-6157725504).
- Reproduction / request: Another plugin creates Telegram/photos/photo_123.jpg then inserts its saved path; automatic rename wins race.
- Acceptance / disposition: Exclude attachment folders before any rename; Telegram/ excludes descendants but not Telegram2/. Shares #115/#56; PR90 checks wrong path for this case.

<a id="issue-120"></a>

### P1 · [#120 The images located after a pdf or mp4 are not renamed.](https://github.com/reorx/obsidian-paste-image-rename/issues/120)
- Category: Batch bug
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/120#issuecomment-6157726373).
- Reproduction / request: Put PDF/MP4 before image; instant batch stops.
- Acceptance / disposition: Images after unsupported embeds rename. Same confirmed code defect as #46.

<a id="issue-119"></a>

### P1 · [#119 attachment rename limitations in a note](https://github.com/reorx/obsidian-paste-image-rename/issues/119)
- Category: Batch bug
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Windows 10 / Obsidian 1.11.4, many images; batch stops silently.
- Acceptance / disposition: Mixed 30+ image fixture completes eligible unique images and reports failures. Likely #46/#120, not proven duplicate.

<a id="issue-115"></a>

### P1 · [#115 Allow Exclude By Directory](https://github.com/reorx/obsidian-paste-image-rename/issues/115)
- Category: Compatibility / integrity
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/115#issuecomment-6157723733).
- Reproduction / request: Handle all attachments renames another plugin's incrementing CSV backups in protected folder.
- Acceptance / disposition: Protected attachment directories are untouched; same extensions elsewhere still rename. Duplicate capability of #121.

<a id="issue-112"></a>

### P1 · [#112 Stopped working some time ago](https://github.com/reorx/obsidian-paste-image-rename/issues/112)
- Category: Platform compatibility
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: No prompt on 1.8.10; macOS CleanShot/Finder and Windows JPG reports; Linux confirmed PR67 workaround.
- Acceptance / disposition: Test native clipboard and file copy with Handle all attachments both ways; avoid claiming single universal fix.

<a id="issue-108"></a>

### P1 · [#108 pasting in an image create duplicate named images](https://github.com/reorx/obsidian-paste-image-rename/issues/108)
- Category: Data integrity investigation
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Copy image file from folder, paste once; duplicate files and skipped counters appear.
- Acceptance / disposition: One imported file per intended paste; establish interfering plugins and event traces. No sufficient repro environment supplied.

<a id="issue-99"></a>

### P1 · [#99 “.tmp” Files Misidentified as Attachments](https://github.com/reorx/obsidian-paste-image-rename/issues/99)
- Category: Compatibility / integrity
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/99#issuecomment-6157715977).
- Reproduction / request: Syncthing .tmp file creation triggers rename; reported extension exclusion ineffective.
- Acceptance / disposition: Ignore temp/system files; extension exclusions apply consistently to every automatic path; document extension-only regex.

<a id="issue-96"></a>

### P1 · [#96 Better integration with git plugin](https://github.com/reorx/obsidian-paste-image-rename/issues/96)
- Category: Compatibility / integrity
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Git pull creates files; rename prompts/auto-renames cause merge conflicts.
- Acceptance / disposition: Background sync/import does not mutate unrelated attachments. Folder exclusion mitigates but does not establish paste provenance.

<a id="issue-91"></a>

### P1 · [#91 Paste does not work anymore in Obsidian 1.5.12](https://github.com/reorx/obsidian-paste-image-rename/issues/91)
- Category: Platform compatibility
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: macOS 14.3.1, Obsidian 1.5.12, sandbox PNG paste doesn't trigger.
- Acceptance / disposition: Reproduce current clean-vault clipboard cases; linked Imgur duplicate paste report informs #108.

<a id="issue-89"></a>

### P1 · [#89 Attachment by taking a photo sometimes crashes on iOS](https://github.com/reorx/obsidian-paste-image-rename/issues/89)
- Category: Crash / mobile
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: iOS 17.3.1 / Obsidian 1.5.11: attach > take photo > add crashes app intermittently.
- Acceptance / disposition: Physical iOS repro and large-photo test; attachment saved, linked, prompt handled without crash. Cause unconfirmed.

<a id="issue-68"></a>

### P1 · [#68 the plugin can't work on mobile phones if the image is large](https://github.com/reorx/obsidian-paste-image-rename/issues/68)
- Category: Platform compatibility
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Mobile camera photo too large to auto-rename, small screenshots work.
- Acceptance / disposition: Large slow imports supported without renaming unrelated startup/sync files; likely creation-time heuristic.

<a id="issue-61"></a>

### P1 · [#61 A naming conflict occurs when used with Local images plus](https://github.com/reorx/obsidian-paste-image-rename/issues/61)
- Category: Compatibility / integrity
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Local images plus Download all images with auto-rename enabled breaks MD5-based import naming.
- Acceptance / disposition: Importer-created attachments retain valid links; isolation/exclusion test. Related #121, not exact duplicate.

<a id="issue-56"></a>

### P1 · [#56 Exclude automatic paste image rename for selected user folders](https://github.com/reorx/obsidian-paste-image-rename/issues/56)
- Category: Compatibility / integrity
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/56#issuecomment-6157699502).
- Reproduction / request: Zotero-imported images trigger 10+ unwanted rename dialogs.
- Acceptance / disposition: Folder exclusions must distinguish note folders and attachment folders. Same capability #115/#121; PR90 checks note only.

<a id="issue-55"></a>

### P1 · [#55 Rename failed, Destination file already exists](https://github.com/reorx/obsidian-paste-image-rename/issues/55)
- Category: Path / collision bug
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Pattern Notes/Image/{{fileName}}, auto-rename + always-number, paste two images.
- Acceptance / disposition: Deduplicate in actual destination folder; no overwrite; consecutive unique names. Coupled with path feature semantics.

<a id="issue-46"></a>

### P1 · [#46 Embeded heading from other file stops "batch rename all images instantly" command.](https://github.com/reorx/obsidian-paste-image-rename/issues/46)
- Category: Batch bug
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/46#issuecomment-6157689431).
- Reproduction / request: Images before and after ![[Embedded_file#Heading 4]]; instant batch stops at note embed.
- Acceptance / disposition: Skip non-image and unresolved embeds, process later images, preserve note embeds. Master return statements confirm defect.

<a id="issue-25"></a>

### P1 · [#25 Pasted image not prompting a dialog](https://github.com/reorx/obsidian-paste-image-rename/issues/25)
- Category: Platform compatibility
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Linux filesystem ctime=0; network-drive paste takes >1s; no prompt.
- Acceptance / disposition: ctime=0 handled (PR67 confirmed by users); slow network paths and startup scans tested separately.

<a id="issue-117"></a>

### P2 · [#117 Image sizes change](https://github.com/reorx/obsidian-paste-image-rename/issues/117)
- Category: Rendering investigation
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: 1.10.3 / plugin 1.6.1: images reportedly become square/cropped after rename.
- Acceptance / disposition: Preserve embed aliases/width metadata and bytes; distinguish CSS/other plugin vs link rewriting before claiming fix.

<a id="issue-113"></a>

### P2 · [#113 Hope to add support for the AVIF format.](https://github.com/reorx/obsidian-paste-image-rename/issues/113)
- Category: Format feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/113#issuecomment-6157724934).
- Reproduction / request: Paste/batch AVIF images.
- Acceptance / disposition: Add AVIF detection where Obsidian supports it; safe preview fallback; no transcoding implied.

<a id="issue-109"></a>

### P2 · [#109 Chinese file names containing spaces are escaped](https://github.com/reorx/obsidian-paste-image-rename/issues/109)
- Category: Link compatibility / docs
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Batch rename image in 中 文 abc.md yields percent-encoded spaces in Markdown link.
- Acceptance / disposition: Link resolves and preserves correct syntax. %20 is valid Markdown URL encoding; clarify expected representation rather than blindly remove escaping.

<a id="issue-101"></a>

### P2 · [#101 Can't rename pasted image on canvas](https://github.com/reorx/obsidian-paste-image-rename/issues/101)
- Category: Canvas compatibility
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Paste image on canvas gives no active file error.
- Acceptance / disposition: Same #29 acceptance; duplicate report.

<a id="issue-97"></a>

### P2 · [#97 [Bug] Some punctuation marks disapear after rename images.](https://github.com/reorx/obsidian-paste-image-rename/issues/97)
- Category: Filename compatibility
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/97#issuecomment-6157714614).
- Reproduction / request: Rename with CJK punctuation 「」！？（）／; characters disappear.
- Acceptance / disposition: Preserve filesystem-valid Unicode, strip only forbidden path/link characters under explicit policy. Same sanitizer cluster #92/#87.

<a id="issue-93"></a>

### P2 · [#93 Can have setting to remove forbid character in original filename keeping?](https://github.com/reorx/obsidian-paste-image-rename/issues/93)
- Category: Filename / integrity
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/93#issuecomment-6157715274).
- Reproduction / request: Keep original filename containing # or other delimiters; resulting link reportedly broken.
- Acceptance / disposition: Safe filename/link handling; optional original-name editing; no silent destructive stripping of valid Unicode. Related #84.

<a id="issue-92"></a>

### P2 · [#92 Support for Emojis and Symbols in file name](https://github.com/reorx/obsidian-paste-image-rename/issues/92)
- Category: Filename compatibility
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/92#issuecomment-6157713896).
- Reproduction / request: Note names with ✅ and ▶ lose symbols in image name.
- Acceptance / disposition: Emoji/symbols survive safe filename generation; cross-platform invalid chars remain rejected.

<a id="issue-87"></a>

### P2 · [#87 Using en dash and em dash](https://github.com/reorx/obsidian-paste-image-rename/issues/87)
- Category: Filename compatibility
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/87#issuecomment-6157712877).
- Reproduction / request: Enter en dash or em dash in rename dialog.
- Acceptance / disposition: Both dashes preserved; shared allowlist defect with #92/#97.

<a id="issue-83"></a>

### P2 · [#83 [Feature]Allow folder creation.](https://github.com/reorx/obsidian-paste-image-rename/issues/83)
- Category: Path feature / bug
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Use imageNameKey folder path that doesn't exist.
- Acceptance / disposition: Same #49 folder creation capability, with nested-directory tests.

<a id="issue-82"></a>

### P2 · [#82 Option for file location](https://github.com/reorx/obsidian-paste-image-rename/issues/82)
- Category: Path compatibility / feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure](https://github.com/reorx/obsidian-paste-image-rename/issues/82#issuecomment-6159969522).
- Reproduction / request: Several plugins manage attachment location; user asks rename without moving.
- Acceptance / disposition: Plain-name rename must preserve parent; define explicit optional path behavior. Mixed comments also request custom destination.

<a id="issue-81"></a>

### P2 · [#81 Multiple use of DATE: variable](https://github.com/reorx/obsidian-paste-image-rename/issues/81)
- Category: Template bug
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Pattern _Journal/{{DATE:YYYY}}/{{DATE:YYYY-MM}}/{{fileName}} leaves second variable.
- Acceptance / disposition: All DATE and frontmatter occurrences rendered, including repeated calls; global regex lastIndex is stateful in master.

<a id="issue-80"></a>

### P2 · [#80 Can't put space at beginning of 'Duplicate number delimiter'](https://github.com/reorx/obsidian-paste-image-rename/issues/80)
- Category: Settings bug
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/80#issuecomment-6157702427).
- Reproduction / request: Set delimiter to leading-space ' - IMG'; leading space disappears.
- Acceptance / disposition: Preserve intentional delimiter whitespace while safely validating characters and empty fallback.

<a id="issue-79"></a>

### P2 · [#79 When I drag an image into a document, it can't be renamed](https://github.com/reorx/obsidian-paste-image-rename/issues/79)
- Category: Compatibility / docs
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: macOS built-in screenshot dragged/copied from Finder not renamed.
- Acceptance / disposition: Document file-copy vs clipboard prefix behavior; verify Handle all attachments works. Related #112.

<a id="issue-78"></a>

### P2 · [#78 When there are too many pictures in an article, such as 30, they cannot be effectively renamed.](https://github.com/reorx/obsidian-paste-image-rename/issues/78)
- Category: Batch / numbering
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: 30+ images with DATE seconds/milliseconds and mixed formats produce surprising counters.
- Acceptance / disposition: Stable per-batch timestamp; unique file identities; deterministic numbering policy. Contains #53/#73 requests too.

<a id="issue-76"></a>

### P2 · [#76 It doesn't effect when pictures are “webp” format](https://github.com/reorx/obsidian-paste-image-rename/issues/76)
- Category: Format compatibility
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Copy multiple web images; WEBP downloads fail rename while single PNG works.
- Acceptance / disposition: WEBP recognized for paste/batch/preview; batch already includes webp, so investigate creation route rather than assume unsupported.

<a id="issue-74"></a>

### P2 · [#74 It doesn't work in Excalidraw](https://github.com/reorx/obsidian-paste-image-rename/issues/74)
- Category: Excalidraw compatibility
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Title only: doesn't work in Excalidraw.
- Acceptance / disposition: Determine Excalidraw embedded-file representation and supported integration; don't apply Markdown rewrite blindly.

<a id="issue-66"></a>

### P2 · [#66 amazing! yet it does not seem to respect the obsidian subfolder name option for attachment saving?](https://github.com/reorx/obsidian-paste-image-rename/issues/66)
- Category: Path compatibility
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Obsidian attachment subfolder assets configured; reported images end up beside note (also iPad).
- Acceptance / disposition: Keep original Obsidian-chosen folder for ordinary rename; test root, same folder and subfolder. Master appears to retain file.parent, so needs repro.

<a id="issue-64"></a>

### P2 · [#64 Cannot enable plugin.  Have never encountered this before with any plugin.](https://github.com/reorx/obsidian-paste-image-rename/issues/64)
- Category: Install investigation
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Installed from community browser but cannot enable (screenshot only).
- Acceptance / disposition: Collect actual console/version errors and reproduce current clean install; insufficient text evidence for code fix.

<a id="issue-63"></a>

### P2 · [#63 Hope to support gif files](https://github.com/reorx/obsidian-paste-image-rename/issues/63)
- Category: Format compatibility / docs
- Current GitHub status (2026-10-14): Closed (completed); [verified closure](https://github.com/reorx/obsidian-paste-image-rename/issues/63#issuecomment-6160179450).
- Reproduction / request: Title requests GIF support; no body/repro.
- Acceptance / disposition: GIF already in batch regex and preview list; verify creation-route behavior before closing as supported.

<a id="issue-60"></a>

### P2 · [#60 Specifiying directory when renaming](https://github.com/reorx/obsidian-paste-image-rename/issues/60)
- Category: Path feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Enter foo/bar.png to save under attachment folder/foo.
- Acceptance / disposition: Clearly documented relative/vault-root paths; modal sanitization preserves allowed separators; traversal rejected.

<a id="issue-54"></a>

### P2 · [#54 Do not rename files that are already "well-named" when using "batch rename instantly" command.](https://github.com/reorx/obsidian-paste-image-rename/issues/54)
- Category: Batch bug
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/54#issuecomment-6157691224).
- Reproduction / request: Run instant batch twice over already conforming filenames.
- Acceptance / disposition: Idempotent repeated runs; existing current file excluded from collision list; stable links/content.

<a id="issue-49"></a>

### P2 · [#49 Create parent folder when it does not exist](https://github.com/reorx/obsidian-paste-image-rename/issues/49)
- Category: Path feature / bug
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Pattern {{fileName}}.assets/image-{{DATE:YYYYMMDD-HHmmssSSS}} with missing folder errors.
- Acceptance / disposition: Create authorized vault-relative parent folders safely; deduplicate at destination. Review PR52/#106/#85, don't merge wholesale.

<a id="issue-41"></a>

### P2 · [#41 Batch renaming not working on my side](https://github.com/reorx/obsidian-paste-image-rename/issues/41)
- Category: UX / documentation
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/41#issuecomment-6157688924).
- Reproduction / request: Batch dialog appears not to match regex until pressing Enter.
- Acceptance / disposition: Visible Preview button or explicit Enter hint; stale previews cannot accidentally execute outdated tasks. Comments confirm workaround.

<a id="issue-29"></a>

### P2 · [#29 pasting to a canvas doesn't trigger the plugin](https://github.com/reorx/obsidian-paste-image-rename/issues/29)
- Category: Canvas compatibility
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Create canvas and paste web image; no rename / no active file.
- Acceptance / disposition: Canvas rename updates canvas JSON file references; creating canvas must not itself prompt in Handle all attachments. PR110 candidate.

<a id="issue-116"></a>

### P3 · [#116 Add pattern option: {{headerName}}](https://github.com/reorx/obsidian-paste-image-rename/issues/116)
- Category: Template feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/116#issuecomment-6157724381).
- Reproduction / request: Request nearest previous heading as {{headerName}}.
- Acceptance / disposition: Find heading at paste/embed position, fallback defined, no heading above produces safe result. Duplicate #105.

<a id="issue-111"></a>

### P3 · [#111 Add pattern option: {{FileNameSlug}}](https://github.com/reorx/obsidian-paste-image-rename/issues/111)
- Category: Template feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure](https://github.com/reorx/obsidian-paste-image-rename/issues/111#issuecomment-6160263394).
- Reproduction / request: Request file-name slug with case and separators.
- Acceptance / disposition: Add deliberate slug variable/options, Unicode policy, preserve existing fileName. Duplicate capability #47.

<a id="issue-105"></a>

### P3 · [#105 Heading variable improved](https://github.com/reorx/obsidian-paste-image-rename/issues/105)
- Category: Template feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/105#issuecomment-6157723121).
- Reproduction / request: firstHeading insufficient for multi-section notes; request nearestHeading.
- Acceptance / disposition: Same #116 requirement; preserve firstHeading semantics.

<a id="issue-103"></a>

### P3 · [#103 hope to rename using permalink](https://github.com/reorx/obsidian-paste-image-rename/issues/103)
- Category: Documentation / existing capability
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Rename using permalink metadata.
- Acceptance / disposition: Document {{frontmatter:permalink}} already supported, ensure filename-safe values and repeated replacement fix #81.

<a id="issue-100"></a>

### P3 · [#100 Issue: Add Support for File Extensions in Rename Patterns](https://github.com/reorx/obsidian-paste-image-rename/issues/100)
- Category: Template feature / clarification
- Current GitHub status (2026-10-14): Closed (completed); [verified closure](https://github.com/reorx/obsidian-paste-image-rename/issues/100#issuecomment-6160359507).
- Reproduction / request: Request fileExt placeholder, example ends .{{fileExt}}.
- Acceptance / disposition: Clarify extension is already appended; if exposing ext, avoid .png.png and define whether template is stem or full filename.

<a id="issue-98"></a>

### P3 · [#98 Allow DATETIME variable](https://github.com/reorx/obsidian-paste-image-rename/issues/98)
- Category: Documentation / existing capability
- Current GitHub status (2026-10-14): Closed (completed); [verified closure](https://github.com/reorx/obsidian-paste-image-rename/issues/98#issuecomment-6160514036).
- Reproduction / request: Request DATETIME with date+time tokens.
- Acceptance / disposition: Document existing DATE:YYYY-MM-DDTHH-mm-ss and filename-safe tokens; no new DATETIME needed unless compatibility alias desired.

<a id="issue-95"></a>

### P3 · [#95 [Feature] Add Input Field and Presets for Image Width During Insertion](https://github.com/reorx/obsidian-paste-image-rename/issues/95)
- Category: Embed feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Request image-width field, remembered value and presets.
- Acceptance / disposition: Preserve existing width; valid wiki/Markdown syntax, optional default/presets. Superset of #57.

<a id="issue-88"></a>

### P3 · [#88 Add Field for Source of the image](https://github.com/reorx/obsidian-paste-image-rename/issues/88)
- Category: Embed feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Optional image-source field appended as caption.
- Acceptance / disposition: Non-destructive caption insertion, escape untrusted text, support insertion context and undo.

<a id="issue-84"></a>

### P3 · [#84 Button to copy original name in rename field](https://github.com/reorx/obsidian-paste-image-rename/issues/84)
- Category: Modal UX feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/84#issuecomment-6157712270).
- Reproduction / request: Want original filename copied into editable rename field.
- Acceptance / disposition: Use original name button keeps editable stem and extension correct; safe validation. Related #93.

<a id="issue-77"></a>

### P3 · [#77 Is it possible to convert MD Links to wikilinks?](https://github.com/reorx/obsidian-paste-image-rename/issues/77)
- Category: Link-format feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Request Markdown links converted to Wikilinks.
- Acceptance / disposition: Provide deliberate conversion option that preserves aliases, size and paths; no implicit format churn during rename.

<a id="issue-71"></a>

### P3 · [#71 Support putting the cursor at the beginning of the image name pattern](https://github.com/reorx/obsidian-paste-image-rename/issues/71)
- Category: Modal UX feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/71#issuecomment-6157701815).
- Reproduction / request: Pattern acts as suffix; want initial cursor at start.
- Acceptance / disposition: Configurable cursor/selection placement respecting IME and current defaults.

<a id="issue-65"></a>

### P3 · [#65 Colon is added between {{fileName}}-{{DATE::YYMMDDHHmmss}}](https://github.com/reorx/obsidian-paste-image-rename/issues/65)
- Category: Documentation / validation
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/65#issuecomment-6157701283).
- Reproduction / request: Pattern {{DATE::YYMMDDHHmmss}} has extra colon and Windows rename fails.
- Acceptance / disposition: Explain correct single colon; validate forbidden generated names consistently and actionable error.

<a id="issue-62"></a>

### P3 · [#62 Allow for templated suffix](https://github.com/reorx/obsidian-paste-image-rename/issues/62)
- Category: Embed feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Request arbitrary suffix for width/alignment after | plus dimensions.
- Acceptance / disposition: Safe configurable suffix for supported syntax, no link deletion when empty. PR75 not merge-ready.

<a id="issue-59"></a>

### P3 · [#59 Add a time variable similar to the DATE: variable.](https://github.com/reorx/obsidian-paste-image-rename/issues/59)
- Category: Documentation / existing capability
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/59#issuecomment-6157700702).
- Reproduction / request: Request TIME variable; user comment points to Moment formats.
- Acceptance / disposition: Document DATE supports HHmmss; verify examples and link current code.

<a id="issue-57"></a>

### P3 · [#57 Add an option to set width for pictures](https://github.com/reorx/obsidian-paste-image-rename/issues/57)
- Category: Embed feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Request optional width field/default with keyboard tab navigation.
- Acceptance / disposition: Shared with #95/#62; PR75 only suffix candidate and has correctness risks.

<a id="issue-53"></a>

### P3 · [#53 Files (of different types) shouldn't end up with the same name.](https://github.com/reorx/obsidian-paste-image-rename/issues/53)
- Category: Numbering feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure](https://github.com/reorx/obsidian-paste-image-rename/issues/53#issuecomment-6161124215).
- Reproduction / request: PNG/JPG receive same counter despite different types.
- Acceptance / disposition: Optional cross-extension counter with clear compatibility policy; distinct extensions are not actual path collision. Related #78.

<a id="issue-48"></a>

### P3 · [#48 Add the ability to set a counter with leading zeros in the plugin settings](https://github.com/reorx/obsidian-paste-image-rename/issues/48)
- Category: Numbering feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/48#issuecomment-6157690635).
- Reproduction / request: Want fileName-001.png through 021.png for sorting/publication.
- Acceptance / disposition: Configurable minimum digit width; parsing existing padded/nonpadded names collision-safe.

<a id="issue-47"></a>

### P3 · [#47 I would like to use the file name without spaces](https://github.com/reorx/obsidian-paste-image-rename/issues/47)
- Category: Template feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/47#issuecomment-6157689996).
- Reproduction / request: Request spaces replaced by hyphens or underscores.
- Acceptance / disposition: Same slug feature as #111.

<a id="issue-45"></a>

### P3 · [#45 default/alternative values in variables](https://github.com/reorx/obsidian-paste-image-rename/issues/45)
- Category: Template feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure](https://github.com/reorx/obsidian-paste-image-rename/issues/45#issuecomment-6161218295).
- Reproduction / request: Fallback expression imageNameKey|dirName|literal.
- Acceptance / disposition: Shared template-extension design #44; test missing, false, zero and empty values.

<a id="issue-44"></a>

### P3 · [#44 trim dashes from empty variables](https://github.com/reorx/obsidian-paste-image-rename/issues/44)
- Category: Template feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Empty variables leave leading/repeated separators.
- Acceptance / disposition: Define explicit optional-group/filter grammar; preserve compatibility. Don't trim intentional literal punctuation globally.

<a id="issue-38"></a>

### P3 · [#38 Keep original filename of attachment](https://github.com/reorx/obsidian-paste-image-rename/issues/38)
- Category: Template feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: {{fileName}}-{{originalAttachmentFileName}} desired for actual file imports.
- Acceptance / disposition: Expose original attachment stem, avoid doubled extension; preserve original before rename. Duplicate #37.

<a id="issue-37"></a>

### P3 · [#37 Add a {{attachmentName} for file. ](https://github.com/reorx/obsidian-paste-image-rename/issues/37)
- Category: Template feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/37#issuecomment-6157688381).
- Reproduction / request: Preserve original mail/attachment date filename as part of renamed file.
- Acceptance / disposition: Same original-attachment variable as #38.

<a id="issue-22"></a>

### P3 · [#22 Hex or UUID mode](https://github.com/reorx/obsidian-paste-image-rename/issues/22)
- Category: Template feature
- Current GitHub status (2026-10-14): Closed (completed); [verified closure record](https://github.com/reorx/obsidian-paste-image-rename/issues/22#issuecomment-6157680878).
- Reproduction / request: Request random hex / UUID variables.
- Acceptance / disposition: Document length/collision properties; per-file values stable through one operation, no silent rerender changes.

<a id="issue-94"></a>

### P4 · [#94 Add option to, while batch renaming, moving the picture to [[subfolder name]]](https://github.com/reorx/obsidian-paste-image-rename/issues/94)
- Category: Attachment lifecycle feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Move note to new folder; want batch rename also relocate attachments.
- Acceptance / disposition: Explicit opt-in move plan; shared attachments and links across notes preserved. Same wider feature #39.

<a id="issue-73"></a>

### P4 · [#73 Batch rename embeded files (whole vault)](https://github.com/reorx/obsidian-paste-image-rename/issues/73)
- Category: Bulk feature / high risk
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Want whole-vault batch rename rather than one note at a time.
- Acceptance / disposition: Defer until single-note safe/idempotent; preview, backup/recovery plan, shared-attachment ownership and cancellation.

<a id="issue-72"></a>

### P4 · [#72 Option for cancel button to delete file](https://github.com/reorx/obsidian-paste-image-rename/issues/72)
- Category: Deletion UX feature / high risk
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Cancel should optionally delete newly pasted file.
- Acceptance / disposition: Separate explicit discard control with recoverable trash and link cleanup; never delete shared/existing file.

<a id="issue-70"></a>

### P4 · [#70 Add Png to Jpeg option](https://github.com/reorx/obsidian-paste-image-rename/issues/70)
- Category: Compression feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: PNG-to-JPEG with quality slider.
- Acceptance / disposition: Subset #33; don't remove transparency or original bytes silently.

<a id="issue-39"></a>

### P4 · [#39 Move attachments with note](https://github.com/reorx/obsidian-paste-image-rename/issues/39)
- Category: Attachment lifecycle feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Move a note; attachments remain in old folder.
- Acceptance / disposition: Shared with #94; avoid guessing ownership from basename alone.

<a id="issue-33"></a>

### P4 · [#33 Support image optimization while renaming](https://github.com/reorx/obsidian-paste-image-rename/issues/33)
- Category: Compression feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Request lossy/lossless image optimization.
- Acceptance / disposition: Opt-in only; byte backup/recovery, transparency/orientation/animation preserved or warned; review PR114 separately.

<a id="issue-1"></a>

### P4 · [#1 auto move image by name-dest rules](https://github.com/reorx/obsidian-paste-image-rename/issues/1)
- Category: Attachment routing feature
- Current GitHub status (2026-10-14): Open.
- Reproduction / request: Move images via name/destination rules; comment asks tags considered.
- Acceptance / disposition: Define ordered explicit routing rules and safe previews; broader than rename maintenance.

<a id="issue-122"></a>

### G · [#122 Request to take over plugin/repository](https://github.com/reorx/obsidian-paste-image-rename/issues/122)
- Category: Governance
- Current GitHub status (2026-10-14): Open.
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

## Historical disposition ledger (all 73 originally open issues)

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

## Master merge and future workflow — 2026-10-14

The maintainer explicitly approved merging the maintenance work and requested that future changes default directly to `master`. Remote heads were read immediately before the operation: `master` was still baseline `3801513c406a86ad90c94a1bd7c95c6b837e063d`, and the maintenance branch was `88cdb1d2555cda28d77f85efdba97b3f3540742c`. Ancestry was verified, then master was advanced with a non-force, expected-head-checked update. A remote read confirmed the target, and the local working checkout was switched safely to `master`; existing branches were preserved.

The merge checkpoint has the exact maintenance tree. Relative to the accepted snapshot `19c50908`, only `docs/maintenance-plan.md` differs; all code, tests, configuration and evidence remain byte-identical. This follow-up updates only the plan to record the merge and branch preference. The earlier publication audit accurately describes the state at its own timestamp and is superseded by this section for the current branch state. No release, tag or version bump was made.

## Sequential remaining-issue pass — 2026-10-14

### #107 — Doing (02:52 UTC)

Fresh issue/comment review confirms Windows 11, Obsidian 1.8.9, Docxer 2.1.2, instant batch rename; there are no comments or source DOCX attachments. Attempt 1 checks actual Docxer import of a synthetic multi-image DOCX in an isolated Linux vault, retaining ordered image hashes. Attempt 2 checks collision and failed-rename mapping with the source-test seam. These cannot establish the original Windows document failure without its input. Existing synthetic Markdown mapping evidence remains historical, not a reproduction claim.

### #107 — Paused (02:54 UTC)

Attempt 1: four Docxer-style image names with an occupied destination, repeated batch, and injected second-rename I/O failure passed the source-seam mapping probe. Each parsed reference retained its exact intended file identity/content marker; on failure the remaining files and links stayed unchanged. The host rename/link behavior is mocked, so this does not reproduce Windows core behavior.

Attempt 2: official Docxer 2.1.2 and a synthetic four-image DOCX were prepared in a new disposable vault. Actual import was blocked before it ran: the native Open-folder GTK picker reported an unavailable AT-SPI provider. Reset/reconnect returned the same error. Stop after these bounded attempts. The original DOCX/imported note and original attachment folder plus a usable Windows/native reproduction are still needed. No closure or code change; prior synthetic native mapping pass remains narrower evidence.

### #119 — Doing (02:54 UTC)

Next row selected in table order. Fresh issue/comments review and a large mixed-embed batch probe will distinguish a real attachment limit from the already-fixed early-return behavior.

### #119 — Paused; #112 selected next (02:56 UTC)

The stopping screenshot shows suffix 303, not a fixed small limit. Fresh 500-image test includes an occupied destination, missing/non-image embeds, repeated references and a repeat batch; all 500 ordered identities remain correct. Focused 35-image and skip regressions also pass. No original note/attachments/errors or comments are supplied, and Windows 10/Obsidian 1.11.4 is unavailable. Leave open pending a minimal failing note and attachment set.

#112 is Doing: fresh comments describe several different cases (macOS CleanShot/Finder, filename prefix, Linux zero ctime, Windows, Custom Attachment Location). Check these independently rather than closing the aggregate on one passing case.

### #112 — Paused; #108 selected next (02:57 UTC)

Fresh nine-comment review separates confirmed old Linux timestamp failure from prefix-filter behavior and unresolved macOS/Windows/plugin interactions. Ten focused attachment/timestamp regressions pass, including delayed-reference behavior without ctime assumptions. Source inspection confirms default mode accepts the Pasted image prefix; Handle all attachments is the deliberate opt-in for other names. Previous native Linux paste passes do not prove macOS CleanShot/Finder or Custom Attachment Location compatibility. No usable matching platform/clipboard trace is available; pause rather than alter defaults or close this aggregate report. Needed: exact filename, settings, platform/clipboard route and minimal conflicting-plugin setup.

#108 is Doing. Reporter supplies no concrete version/settings/logs and no follow-up comments; inspect repeated create/change and prefix allocation before attributing duplicate physical files to this plugin.

### #108 — Paused; #96 selected next (02:58 UTC)

Four focused repeat-create/concurrency/multi-insert/idempotence tests pass. Prefix allocation tests preserve existing numbered members; source has no attachment create/copy/write API calls, only rename. Prior native pair-paste evidence retained exactly two input images and their hashes, but does not recreate this unspecified single-file route. No version, settings, duplicate filenames/hashes or conflicting-plugin set is provided; no native Windows setup is available. Pause for a minimal duplicated-file fixture/clipboard route, without treating skipped numeric counters alone as proof of duplicated bytes.

#96 is Doing. Report requests ignoring files arriving through Git pulls. Check both already-existing references and newly arriving note+attachment; do not assume create events carry provenance or link a remote account as a workaround.

### #96 — Paused; #91 selected next (02:58 UTC)

Four focused startup/restoration/source-identity regressions pass: already-referenced embeds and ordinary links, startup scans and unrelated-note changes do not rename. The new-reference test also demonstrates the remaining ambiguity: a Git pull that changes the active note after creating its attachment produces the same observable events as insertion. There is no Git-operation provenance in these Vault/metadata events. Integrating a particular Git-plugin lifecycle or changing default ownership to explicit paste/drop only needs a supported API and clear scope; linking a repository account would not solve event provenance. Pause with this concrete integration/ownership blocker; do not claim general sync safety.

#91 is Doing: original report is macOS Sonoma14.3.1/Obsidian1.5.12 clipboard PNG, with separate unversioned activation and Imgur duplicate follow-ups. The matching platform is not available; inspect activation/runtime and event-path evidence before disposition.

### #91 — Paused; #89 selected next (02:59 UTC)

Activation/layout registration, delayed zero-ctime reference and repeated-create tests pass (3/3). Manifest/runtime inspection finds no source-specific macOS branch; previous native Linux activation/paste worked. This does not establish compatibility with the original Sonoma14.3.1/Obsidian1.5.12 clipboard route or the separate Imgur local-paste duplication. A matching device/version, original clipboard route and console error are needed. Keep open; do not lower the minimum-version claim or alter clipboard handling without reproduction.

#89 is Doing: analyze the iOS camera crash report and whether this plugin reads/decodes image bytes; distinguish app memory/camera failures from rename lifecycle failures.

### #89 — Paused; #68 selected next (02:59 UTC)

The report identifies iPhone14,4/iOS17.3.1/Obsidian1.5.11, camera attachment and intermittent crash, with no crash log or original photo. Five lifecycle/timeout/unload/deleted-line regressions pass. Rename code does not read or transform image bytes, but the manual modal does create an image preview using a vault resource URL, so native decoder/memory behavior remains a plausible untested boundary. No matching iOS camera/runtime is available; desktop mocks cannot reproduce an iOS process crash. Pause pending crash report, image dimensions/format/size and auto/manual setting, rather than disable previews speculatively.

#68 is Doing: compare camera-sized versus screenshot-sized attachment metadata and delayed insertion; exact mobile OS/app version and source image are absent.

### #68 — Paused; #61 selected next (03:00 UTC)

All 12 creation/lifecycle tests pass with file.stat.size set to 80MiB and zero timestamps, including delayed metadata and timeout behavior. This exercises size-independent policy, not actual image decoding, mobile camera or transfer latency. Source has no size gate; the old one-second timestamp filter is removed, while references arriving after 30 seconds deliberately leave files untouched. Without the original photo, device/OS/app version and observed create-to-reference delay, changing that bound or preview behavior would be speculative. Pause for that evidence.

#61 is Doing: the concrete Local images plus download-all/MD5 naming workflow may have concurrent ownership. Inspect producer ordering/reuse and current reference-wait behavior; no arbitrary delay will be added as a substitute for evidence.

### #61 — Paused; #55 selected next (03:01 UTC)

Inspected [Local Images Plus source](https://github.com/Sergei-Korneev/obsidian-local-images-plus/tree/2b4dac116394dfab74a39c2406dea963b890bed4): README explicitly lists Paste Image Rename incompatibility. contentProcessor creates binary attachments, retains chosen hash filenames, then constructs links; main later rewrites the note and stores created paths. The new parsed-reference wait improves early ordering but does not establish exclusive ownership across producer caching/reuse or future rewrites. Four restore/source lifecycle tests passed earlier; no actual joint-plugin proof exists. Pause pending a supported downloader-completion hook or explicit single-renamer policy, rather than adding guessed delays or renaming producer-owned hashes.

#55 is Doing: requested Notes/Image/{{fileName}} routing plus always-numbered duplicates is an explicit destination-folder workflow. Verify safe rejection and document the unresolved base-path semantics instead of silently routing files.

### #55 — Paused; #25 selected next (03:02 UTC)

Exact requested behavior is unsupported: destination folder segments are rejected before any mutation. Three focused path/parent/concurrency tests pass, so ordinary duplicate allocation is safe but does not implement Notes/Image routing. Defining whether paths are vault-root-, note-, or attachment-relative, when folders are created, and how shared attachments move is a broader feature decision. Existing historical PR path approaches had repeat-nesting and wrong-directory risks. Pause for that policy instead of reintroducing implicit moves under a collision fix.

#25 is Doing. Fresh comments contain a concrete zero-ctime diagnosis plus distinct Spectacle/local and SMB/mapped-drive cases. Validate the zero-ctime/reference seam again; do not collapse the network/platform reports into that one cause.

### #25 — Paused; P1 pass complete (03:02 UTC)

Three focused zero-ctime/delayed-reference/captured-source/timeout cases pass. Timestamp-based rejection has already been removed; fresh comments still include local Spectacle and SMB/mapped-network-drive reports not tied conclusively to timestamps. No matching network mount or failing event trace is available, and changing the 30-second reference bound without latency evidence risks background-file renames. Keep open pending the original clipboard route, filesystem type, settings and create-to-reference timings.

All P0/P1 rows have now received this pass: #107, #119, #112, #108, #96, #91, #89, #68, #61, #55 and #25 are Paused with specific reproduction or design blockers. No new closure or code mutation was justified by these probes. P2 #117 is selected next, Doing: inspect whether bytes, embed width or rendering changes are being reported.

### #117 — Paused; #109 selected next (03:03 UTC)

Fresh report has no original/result image, dimensions, embed syntax, screenshot or theme details. Source review finds no image-byte transform and preview CSS is modal-scoped; width/alias preservation tests pass. Prior native tests verified unchanged image hashes and preserved width/alias, but cannot reproduce the reported square crop. Pause pending before/after file hashes, actual embed text and minimal theme/snippet reproduction.

#109 is Doing. Exact report changes a Markdown link containing spaces into percent-escaped spaces while Wikilinks is enabled. Determine valid Markdown destination behavior; preserving an existing Markdown link is separate from converting it into wiki syntax.

### #109 — Skipped; #101 selected next (03:04 UTC)

The requested raw-space bare Markdown destination is not a portable valid replacement. [CommonMark link destinations](https://spec.commonmark.org/0.31.2/#link-destination) distinguish angle-enclosed destinations from bare ones; spaces must be represented safely. Current batch delegates link updates to Obsidian and preserves existing Markdown syntax rather than converting every link when Wikilinks is enabled. Prior native angle-path/space mapping passed; width/alt/title tests pass. No corruption is established by %20 alone. Skip the requested blind unescaping; keep open if a specific angle-destination or wiki-conversion policy is desired.

#101 is Doing. Canvas requires a different source/reference model; first verify unsupported view handling does not rename a background attachment or throw the former no-active-file error.

### #101 — Paused; #83 selected next (03:04 UTC)

Absent-Markdown-source guards and unrelated-source tests pass (2/2), eliminating the unsafe active-note assumption, but Canvas image nodes are not Markdown metadata embeds. The public installed Obsidian type surface does not expose a CanvasView/node transaction API. Parsing a saved canvas file alone would not safely coordinate live edits and shared references. Pause the feature pending a supported Canvas integration and naming/source semantics; do not claim the feature solved merely because the old exception is gone.

#83 is Doing: inspect whether folder creation has a defined destination base and traversal/shared-attachment constraints before extending the safe filename-only contract.

### #83 — Paused; #82 selected next (03:05 UTC)

Reviewed supplied createFolder patch: it derives each new folder from file.parent, so applying the same folder-producing pattern again can nest the destination repeatedly. It also does not establish allocation in the destination directory or shared-file move ownership. Current path rejection is reproducible and leaves bytes/links untouched, but intentionally does not satisfy this feature. Pause until destination base/repeat semantics are chosen; do not merge the suggested three-line patch as a safe fix.

#82 is Doing: determine whether the request is an ordinary rename preserving the configured attachment directory or a new folder-routing policy.

### #82 — Solved/closed; #81 selected next (03:07 UTC)

Independent scope/code review confirmed the original no-move request is supported: ordinary rename joins the current parent directory. Parent-preservation/path/concurrency regressions pass; prior native four-image ordered-hash evidence remains in Attachments/. No historical root-move cause was claimed reproduced. [One explanatory comment](https://github.com/reorx/obsidian-paste-image-rename/issues/82#issuecomment-6159969522) and closed/completed state were read back. Custom routing remains in #55/#83 and the build remains unreleased. Removed only the #82 index row; preserved its history. 47 issues remain open.

#81 is Doing: repeat-DATE rendering has a regression fix, while the reported full pattern also routes into date-named folders. Test both boundaries before disposition.

### #81 — Paused; #79 selected next (03:08 UTC)

Repeated DATE/frontmatter and per-batch timestamp tests pass (2/2), so multiple-token rendering itself is fixed. However the supplied _Journal/year/month/name pattern is still rejected at save because folder routing is unsupported. Keep the original full example open rather than narrowing it artificially to close. Routing semantics remain the blocker described under #55/#83.

#79 is Doing: macOS desktop screenshot file copy/drag typically preserves a non-Pasted-image filename. Validate the filename-policy seam with Handle all attachments off/on; exact macOS clipboard behavior is a separate host boundary.

### #79 — Paused; #78 selected next (03:09 UTC)

Deterministic screenshot-name probe produces zero renames with Handle all attachments disabled and one rename after a new exact source reference with it enabled. This matches the documented prefix opt-in policy, not a confirmed macOS drag bug. Original report omits settings/version and no matching macOS screenshot route is available. Keep open pending that distinction; do not broaden defaults to every created file.

#78 is Doing: compare the reported around30-image limit with current mixed-image batch and repeat behavior; validate original filenames/settings if supplied.

### #78 — Paused; #76 selected next (03:09 UTC)

Fresh body is broader than the title: timestamp changes with milliseconds, cross-format numbering, and whole-vault processing. Existing per-batch clock fix prevents one changing timestamp per image; 35-image mixed and stable-clock regressions pass, and this pass reached500 images with correct mapping. DATE remains dynamic across separate commands by design. Numbering remains per extension, and whole-vault/shared-reference rename policy is not defined. Keep the aggregate open rather than claim those extra workflows implemented.

#76 is Doing: source already recognizes WEBP, so test actual extension acceptance and compare automatic prefix policy; inspect report for a distinct failing workflow.

### #76 — Paused; #74 selected next (03:10 UTC)

WEBP is already in the image set; mixed35-image batch tests include WEBP. A fresh WEBP filename/reference probe renames once with Handle all attachments enabled and zero times when its non-Pasted filename is filtered by default. Inspected the supplied batch screenshot: the visible local filename actually ends in _MD5.png, so that example does not establish unsupported WEBP decoding/extension handling; it suggests an importer/filename-policy interaction. Need original pasted content, actual local filenames, settings and producer plugins. Keep open without a cosmetic add-extension patch.

#74 is Doing: Excalidraw does not expose the active MarkdownView/embed cache assumed by this plugin. Inspect the requested scope before touching live drawing data.

### #74 — Paused; #66 selected next (03:10 UTC)

Fresh issue contains a title only, no body or comments. No drawing fixture, Excalidraw version or paste workflow establishes whether images are embedded inside drawing data or separate vault attachments. MarkdownView-only source detection intentionally leaves this unsupported view alone; two absent/unrelated-source guards passed under #101. A drawing adapter and supported live-reference update contract are needed before mutating its data. Pause for concrete integration evidence, not an arbitrary active-file cast.

#66 is Doing: current-parent retention may satisfy the original configured-subfolder report; inspect body/comments and test exact nested attachment paths before claiming a fix.

### #66 — Paused after native pass; #64 selected next (03:20 UTC)

Actual Linux Obsidian1.14.4 native test with accepted bundle SHA256 652dd495227de410789e0848a5a7706cc9c0a70d921bc4625d6abbd51afa6b51: configured In subfolder under current folder, assets; opened Issue66/Notes/Native assets paste.md; native file copy/paste produced two attachments first under Notes/assets, then renamed both there. Saved embeds resolve in original order and cyan/orange SHA256s are unchanged; nothing was moved beside the note. Nested source-seam collision/repeat/failure probe also passes. Independent review notes baseline3801513 already used parent.path joining, so this does not reproduce or establish a causal fix for the original macOS/iPad failure. Keep open pending that platform/fixture.

Native picker access recovered during this test. #107 retains its historical failed attempts but its current reason no longer presents that technical blocker as ongoing; original Windows DOCX/reproduction is still missing.

#64 is Doing: inspect installation/activation report and exact current build/manifest load path before guessing at a fix.

### #64 — Paused; #63 selected next (03:20 UTC)

Fresh report supplies only plugin-browser installation and an activation-failure screenshot, with no app/OS version or console error. Current manifest ID and required three build files are present; startup/layout registration regression passes, and #66 just exercised this exact bundle enabled in native Obsidian1.14.4. No failure can be reproduced from the available data. Pause for console stack, Obsidian/platform version and installed main.js/manifest files; do not change minimum-version metadata based on an unspecified install.

#63 is Doing: GIF is recognized by current code. Check actual local-file rename support, with animation bytes preserved, separately from downloading remote GIF URLs.

### #63 — Solved/closed; #60 selected next (03:25 UTC)

Independent review confirmed this title-only request is an existing capability, not a newly introduced format fix. Native Linux Obsidian1.14.4 verified both automatic paste and instant batch on a three-frame animated GIF; saved embeds and .gif extensions are correct, complete original SHA256 preserved. Automatic generic filenames require Handle all attachments; Auto rename chooses automatic versus prompt. Pure GIF collision/repeat/failure mapping also passed. [Comment and completed closure](https://github.com/reorx/obsidian-paste-image-rename/issues/63#issuecomment-6160179450) were read back; no release claim. Removed its index row, retained history;46 open.

#60 is Doing: inspect custom destination-folder scope and whether any safe no-routing subset satisfies the actual request.

### #60 — Paused; #49 selected next (03:26 UTC)

Original example asks attachment-relative foo/bar.png; follow-ups also request root-prefixed and note-relative destinations plus configurable routing. Current guards reject path segments without mutation, and ordinary parent-preserving rename is verified. A stable base must survive repeated batches and notes sharing one attachment; inferring current parent would recursively nest folders. Pause this routing feature with the related #55/#83 design gate rather than silently choose different semantics for comments.

#49 is Doing: per-note {{fileName}}.assets creation is explicit, but destination resolution/repeat behavior still needs safe treatment.

Compact native receipts are now tracked at [GIF verification](test-evidence/sequential-issue63-native.json) and [configured subfolder verification](test-evidence/sequential-issue66-native.json). They preserve exact test settings, saved links and byte hashes; Linux results are not platform-wide certification.

### #49 — Paused; #29 selected next (03:27 UTC)

The supplied note.assets/image-DATE pattern necessarily moves into a folder and may create it. Existing validation proves no mutation for unsupported paths; a createFolder patch alone cannot select a stable base or allocate against destination siblings, and repeated current-parent evaluation can nest note.assets indefinitely. Pause for the shared routing policy instead of partially implementing creation while leaving unsafe move semantics.

#29 is Doing: requires the pasted image name to derive from a Canvas and also mentions unwanted rename prompts on Canvas creation. Review current source guard separately from complete Canvas support.

### #29 — Paused; P2 pass complete (03:27 UTC)

Three startup/source/absent-note tests pass, so unrelated creation is no longer enough to target an arbitrary Markdown note. This does not implement deriving names from Canvas files or updating live Canvas nodes. Same integration boundary as #101: no supported public CanvasView transaction/reference API in the installed type surface; saved-file editing alone risks clobbering live state. Pause feature with that concrete requirement.

P2 completed in table order; #82 and #63 closed as independently reviewed supported capabilities with native evidence. Other P2 rows retain specific Paused/Skipped reasons. #111 is the first P3 item, Doing: compare requested slug variants with existing lowercase-hyphen behavior and implement only clearly defined optional syntax.

### #111 — implementation verified, publication/closure pending (03:31 UTC)

Added optional lower/preserve casing and hyphen/underscore arguments to both fileNameSlug aliases. Bare tokens retain lowercase-hyphen behavior; invalid combinations remain literal, Unicode is preserved before ordinary sanitization, and inserted values are never rescanned. All four requested outputs and filename-extension integration are tested. 76/76 tests, production build/typecheck, lint and whitespace checks pass; independent reviewer reran these plus53 supplemental assertions.

Native Linux Obsidian1.14.4, frozen bundle SHA25601b84f220fe1fe68a40a892519d12bdde63852dabbaaf498acf2a36c057096a0: {{FileNameSlug:preserve:underscore}} with note Obsidian Plugin Test File yields assets/Obsidian_Plugin_Test_File.png, correct persisted embed, unchanged original image hash. Defaults unchanged; no release/version bump.

### #111 — Solved/published/closed; #103 selected next (03:33 UTC)

Published [3e17222](https://github.com/reorx/obsidian-paste-image-rename/commit/3e172227371d2b24efbfae7207f81e3984282ad0) directly to master with non-force expected-head update. Remote tree24cefc459c4d191784af33e4ff4497a7a9373669 exactly matches the reviewed local candidate. [Native receipt](test-evidence/sequential-issue111-native.json) records the exact tested build/settings/link/hash. [Explanatory comment and closed/completed state](https://github.com/reorx/obsidian-paste-image-rename/issues/111#issuecomment-6160263394) verified. Removed row;45 open.

#103 is Doing: title/body ask renaming by permalink without an example or frontmatter/URL schema. Evaluate existing frontmatter token capability without inventing URL-to-folder rules.

### #103 — Paused; #100 selected next (03:34 UTC)

Existing {{frontmatter:permalink}} can use a filename-safe frontmatter value, and3 focused frontmatter/literal-data tests pass. The request supplies no example of permalink storage or desired output. Full URLs, slash paths and a final path segment have different semantics and safety implications; current filename-only routing guard must not be bypassed through frontmatter. Pause for example metadata and expected basename/path instead of inventing a permalink schema.

#100 is Doing: inspect exact file-extension syntax and current stem-plus-extension contract before introducing an alias that could produce duplicate extensions.

### #100 — implementation verified, publication/closure pending (03:40 UTC)

Added {{fileExt}} for the original attachment extension, preserving casing. A standalone parsed terminal .{{fileExt}} opts into full-filename syntax; prompt remains stem-only and the actual extension is appended once. Other token positions are ordinary stem text; old patterns and literal replacement data are unchanged. Independent review caught a malformed/nested-token truncation edge before publication; corrected helper uses the renderer’s exact token boundaries and removes only an exact final suffix, including original trailing whitespace. Dedicated regression added.

80/80 tests, production build/typecheck, lint and whitespace checks pass; independent reviewer reran them plus968 supplemental assertions. Native Linux Obsidian1.14.4 with frozen SHA2567ab10a1e09dbe4ea9524c2bbef8f7ba7c887b189f656a380985386d177598210 verifies {{fileName}}-{{DATE:YYYYMMDD}}.{{fileExt}} produces one .png extension, a correct saved link and unchanged bytes. Host-local date is used, not UTC. No faulty intermediate candidate was published.

### #100 — Solved/published/closed; #98 selected next (03:41 UTC)

Published [4827ee8](https://github.com/reorx/obsidian-paste-image-rename/commit/4827ee83891154c1596319424f3e15bf5492d8e5) with non-force expected-head update. Remote treebc338b454c92c940286d9a7be68fd2c364d62f56 matches reviewed local candidate exactly; fetched files compare byte-for-byte. [Native receipt](test-evidence/sequential-issue100-native.json) records the corrected tested bundle. [Comment and completed closure](https://github.com/reorx/obsidian-paste-image-rename/issues/100#issuecomment-6160359507) verified, row removed;44 open. No check runs reported for implementation commit; local/native verification is the evidence, not CI success.

#98 is Doing: read desired date-time notation and define a compatible explicit alias rather than silently interpreting foreign format tokens.

### #98 — implementation verified, publication/closure pending (03:53 UTC)

DATETIME accepts Moment format syntax plus explicitly limited %H/%M/%S directives with optional zero/space/no-padding flags. %% is literal percent; unknown percent-letter directives remain literal; DATE is unchanged. Independent review caught a mismatch in greedy Moment bracket-literal boundaries before publication; fixed against the installed Moment tokenizer and regression-tested. This is not full strftime support.

84/84 tests, build/typecheck, lint and whitespace checks pass; independent review reran them plus4048 grammar/time assertions. Native Linux Obsidian1.14.4 used the exact mixed pattern and frozen bundle SHA256f6fdb72ac31b2340cee99957ac621375f539832adb4316103f4c2abcab2af81e: host20:52:18PDT produced 2026-10-13T205218.png after existing safe colon removal, correct saved embed and unchanged image bytes. Earlier candidate was not pasted or published.

### #98 — Solved/published/closed; #95 selected next (03:55 UTC)

Published [e150ef9](https://github.com/reorx/obsidian-paste-image-rename/commit/e150ef946ad5d192c05ede08f2820ed9a9720f51) using a non-force expected-head update; remote tree6ca7ec5322937a54dc99f71948de7fcf1c3f7426 equals reviewed local candidate, fetched files identical. [Native receipt](test-evidence/sequential-issue98-native.json) records exact format, time window, safe filename and bytes. [Comment and completed closure](https://github.com/reorx/obsidian-paste-image-rename/issues/98#issuecomment-6160514036) verified; row removed,43 open. No remote check runs reported.

#95 is Doing: distinguish choosing displayed width for the newly inserted embed from changing every shared reference or image bytes. Review original preset/UI expectations before selecting a safe bounded implementation.


### #95 — prompt width candidate under review (04:29 UTC)

Implemented default-off width controls for newly inserted wiki image embeds in the rename prompt, customizable presets and remembering the last successfully applied width. Blank preserves current size; same-name confirmation still applies width; automatic/batch paths remain unchanged. Ambiguous repeated references, text aliases and Markdown syntax are not edited. Exact source/file identities, cancellation, unload and document context are checked before width mutation.

First review found that an unchanged embed line can become a fenced code example when surrounding lines change during rename. Corrected with a whole-document context snapshot allowing only the target destination transition, and regressions for both refreshed and stale metadata. 97 tests, typecheck, lint, build and whitespace checks pass. Corrected frozen bundle SHA2564a99e81adbc09cdf4fba919c76d7f453932c00f046a5c6f6f794274ee5a6bf52 is awaiting independent re-review and native settled-link verification. One failed review iteration; no candidate published and issue remains Doing.


### #95 — final bounded safety correction pending re-review (04:30 UTC)

Second review identified stale metadata already at capture: a code block can retain an earlier embed cache before parsing finishes. Width capture now receives the official metadata changed event’s data/cache pair, requires that exact parsed text to equal the live editor, and uses only that paired cache. Missing/mismatched proof omits width controls. The after-capture whole-document guard remains. 98 tests, typecheck, lint, build and whitespace checks pass; frozen SHA25667594237565835844aeafac87510b2d000cde8efb31dcb1531b2c3787482fdf2. Native work is held until independent approval. This is the final bounded correction attempt; another safety blocker will pause the issue and preserve the unpublished patch separately.

### #95 — Paused after native validation failure; #88 selected next (04:38 UTC)

Final reviewed candidate passed98 unit tests and252 independent assertions, but real Obsidian1.14.4 filename/link updates raced the width editor transaction. The native editor displayed a duplicated destination and the first saved-file read omitted width. This is the third meaningful failed validation after two stale-context corrections. Stop under the bounded-iteration rule: no width implementation was published, #95 remains open, and all six candidate source/test/README files were restored to published master. The unpublished patch and tested bundle are preserved outside the repository for a later host-transaction integration approach. A safe future solution needs coordinated core link-update completion rather than another timing guess. Native settled evidence is being captured.

#88 is Doing: examine the optional source-caption field and safe placement below the newly inserted image.

### #95 settled evidence; #88 Paused; #77 selected next (04:39 UTC)

The #95 failure persisted in the saved note26 seconds after Rename: ![[Width Preset ExampleWidth Preset Example.png|240]], while the physical file was Width Preset Example.png with unchanged bytes. The unsafe candidate is no longer installed. [Native failure receipt](test-evidence/sequential-issue95-native.json) preserves the exact tested bundle and result.

#88 requests an optional source field inserted as a caption below the image. Source inspection confirms no existing caption insertion workflow. Implementing another editor mutation immediately after attachment rename depends on the same host/core-link-update coordination that just failed natively in #95; changing a line below rather than its width does not establish transaction ownership. Pause on that concrete dependency instead of repeating an unsafe timing-based write. No caption code published.

#77 is Doing: inspect the requested behavior and existing file-reference guarantees.

### #77 — Paused after two architecture checks; #62 selected next (04:41 UTC)

Original request converts ![](image.png) to ![[image.png]], without requiring automatic conversion. A standalone command could avoid rename concurrency. Route1: the public getFileCache API provides positions but not the text snapshot they parsed, so it cannot prove current fenced-code/inline-code context for an existing note. Official changed events provide paired data/cache, but requiring a note edit just to use a conversion command is not a satisfactory general workflow. Route2: a maintained CommonMark parser such as @lezer/markdown can parse live text, but adds a new bundled dependency and requires explicit handling of alt text, dimensions, escaping, fragments and link resolution. No parser or conversion code added during this bounded pass. Pause for that tested parsing architecture, rather than a whole-note regex replacement or stale-cache mutation.

#62 is Doing: read the original issue before selecting a bounded behavior change.

### #62 — Paused; #57 selected next (04:41 UTC)

Read original request and both comments: reporter confirmed PR75 for custom alignment/width suffixes. That confirmation does not cover the current native core-link-update race. Existing PR75 inspection found empty-suffix link deletion, original pre-rename target reuse, and wiki-only closing-bracket assumptions. The requested arbitrary suffix/dimensions requires both a safe embed-edit transaction (blocked by the reproduced #95 host merge race) and defined handling of existing aliases/sizes. Pause rather than merge the unsafe PR or reinterpret filename templates as link HTML.

#57 is Doing: inspect original size-template scope before sharing or separating this blocker.

### #57 — Paused; #53 selected next (04:42 UTC)

Read original default-width/manual-field/Tab-navigation request and all five comments, including PR75 suggestion. This is the same post-rename width mutation that failed actual Obsidian testing in #95, with additional Markdown-alt syntax expectations. No independently safe implementation exists in the published code; pause on the demonstrated host merge race, not on lack of user interest.

#53 is Doing: reproduce whether different extensions receive the same duplicate number, then assess backward-compatible opt-in numbering without renaming unrelated files.

### #53 — opt-in shared counters reviewed; native check pending (04:44 UTC)

Reproduced extension-specific numbering in the existing allocator. Added default-off **Share duplicate numbers across extensions**: one stem/counter namespace per current attachment folder, preserving each actual extension and all file bytes. Existing matching names stay stable unless another extension occupies the same counter; leading-zero variants are normalized for counter conflicts. Only processed files are renamed. Prefix/suffix placement, escaped delimiters, minimum digits and decimal-string counters remain supported.

89 tests, typecheck, lint, build and whitespace checks pass. Independent review additionally passed10080 assertions, including default-off equivalence to published code and mixed-extension conflict repair/idempotence. Frozen bundle SHA2560b97d581476a22f529c54013b79f8574776b7f7b125345ec800e72ae5c91a222 awaits native mixed-format batch/repeat/hash verification before publication.

### #53 — native verification passed (04:47 UTC)

Linux Obsidian1.14.4 tested the exact reviewed bundle with the opt-in enabled. Native instant batch produced Note.png, Note-1.jpg and Note-2.webp in source order, with original extensions and SHA256 bytes preserved. A second native batch left saved Markdown byte-identical and all filenames/hashes unchanged. Ready for publication; no release/version bump.

### #53 — Solved/published/closed; #45 selected next (04:48 UTC)

Published [ea79573](https://github.com/reorx/obsidian-paste-image-rename/commit/ea79573d547716b4c3d24efb9c03fd53cb7d6dfc) with expected-head non-force update. Remote tree92344c79526f8a1bfced56c3d83d0ff9e2800c4e exactly matches the reviewed candidate; fetched changed files compare byte-for-byte. [Native receipt](test-evidence/sequential-issue53-native.json) records mixed-format and repeat passes. [Comment and completed closure](https://github.com/reorx/obsidian-paste-image-rename/issues/53#issuecomment-6161124215) verified. Row removed;42 open. No remote check runs reported; no release.

#45 is Doing: inspect the original request before determining its bounded implementation scope.

### #45 — fallback grammar reviewed; native check pending (04:52 UTC)

Implemented the requested ordered named-variable fallback, e.g. {{imageNameKey|dirName|my_default_value}}-{{fileName}}. Select first nonblank named value; final unknown item is literal, unknown intermediate names preserve the original token. Existing DATE/DATETIME/frontmatter/slug-option grammar keeps precedence, including literal pipes, and inserted data is never rescanned. Review found and corrected existing truthy extraction that dropped YAML imageNameKey zero/false; nullish extraction preserves both as nonblank strings, also for bare tokens, with README disclosure.

93 tests, typecheck, lint, build and whitespace checks pass. Independent review passed784 compatibility/fallback assertions and18 plugin-level falsy/root-folder checks. Frozen SHA256aaf58c59be133d1500b4ec8cc379772ef897022e67e8c330248a2fb4d4c0fde4 awaits native verification before publication.

### #45 — native fallback and zero-value verification passed (04:55 UTC)

Linux Obsidian1.14.4 tested the reviewed aaf58c59 bundle with the exact requested chain. Root-level missing-key note produced my_default_value-Issue45 Fallback.png; YAML imageNameKey:0 produced 0-Issue45 Zero.png. Both persisted correct embeds and retained original PNG SHA256 bytes. Ready for publication.

### #45 — Solved/published/closed; #44 selected next (04:56 UTC)

Published [2b5f3bb](https://github.com/reorx/obsidian-paste-image-rename/commit/2b5f3bbbd9a3105a7a253d0e9f884692adfa71c8) by non-force expected-head update. Remote tree8a079818b4489385d3fd8ee76c782376642bf4a9 matches reviewed candidate, fetched changed files identical. [Native receipt](test-evidence/sequential-issue45-native.json) records fallback/zero passes. [Comment and completed closure](https://github.com/reorx/obsidian-paste-image-rename/issues/45#issuecomment-6161218295) verified; row removed,41 open. No release.

#44 is Doing: inspect the original request and avoid treating partial token support as full resolution.

### #44 — conditional affixes independently verified (05:00 UTC)

Added opt-in {{variable:suffix}} and {{prefix:variable:suffix}} for plain named variables. Blank variables omit the complete affixed token; affixes are independent, so an empty dirName with a populated imageNameKey correctly yields __key__Note in the proposed combined example. The original request’s one missing-prefix example is inconsistent with its own grammar; no cross-variable coupling was introduced. Existing literal dashes are unchanged. No executable template engine was added.

Compatibility checks preserve DATE/DATETIME/frontmatter/slug syntax and #45 fallback final literals containing colons; affixes cannot contain colons or pipes. 97 tests, typecheck, lint, build and whitespace checks pass. Independent review passed1848 additional assertions on exact frozen SHA2561e4d3730e9936cd3eaed70452e4210005460484b2ef27b6b57b6ad13b671a290. Native transport recovery is being attempted once; results will be recorded separately.

### #44 — native check unavailable; publication gate is automated validation (05:01 UTC)

One bounded native transport recovery attempt failed. The candidate was not deployed or tested in Obsidian. This scoped pure-template change is approved for publication based on97 automated tests, build/typecheck/lint and independent1848-assertion review; no native-pass claim will be made. The last verified native artifact remains the preceding fallback candidate, not this affix build.
