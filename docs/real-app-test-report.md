# Real Obsidian test report

Date: 2026-10-13. Host: isolated Linux cloud desktop. Obsidian 1.14.4 from https://obsidian.md/download (official vendor Deb link). App launched via native file manager; no sandbox disabling or security changes. Disposable vault only.

## Builds
- Upstream baseline main.js SHA256: 352092bfcf28161b80e416b944ac970df1dce5841d96a865b755f3e3a77b5f39
- Candidate 1 commit b177c36c665be1faea8b4a6c81397793cabaee80; main.js SHA256 7a94396bafc50700249deff3d4107136ceceadfffd0c922e47b492bc25ade449
- Candidate 2 commit 0bde998c03fe38ce5aadd796ce0264fd813b48cc; main.js SHA256 6b25450f87d86afbc6fe2ea0c9deccd41e315ec1edc26585fe4e5a45669d5730

## Verified in native Obsidian UI
1. Baseline mixed-embed regression: Nonimage first.md embeds a Markdown note, then unique.png twice with |40 and |alias. Running Batch rename all images instantly does nothing. This reproduces early return on a nonimage embed.
2. Candidate 1 same fixture: renames unique.png to Nonimage first.png once; both duplicate links update while retaining width/alias; Shared reference.md also updates its link retaining |20. PNG SHA256 remains unchanged.
3. Candidate 1 repeated same batch: both Markdown notes and all PNG hashes remain identical; no filename churn.
4. Candidate 1 core Automatically update internal links OFF: a fresh guard-original.png embed remains unchanged when batch invoked. No broken link produced. Re-enabled setting afterward.
5. Candidate 1 real clipboard paste FAILURE: native Thunar selected two external PNG files and copied them; native Obsidian editor pasted both at once, autoRename=true. Filenames became Paste integrity.png/Paste integrity-1.png, bytes correct, but SAVED note retained old Pasted image 202610130001.png/0002.png references. UI initially displayed cached images, demonstrating why rendering alone is insufficient. Broken saved note retained in test-evidence/candidate1-multipaste-broken.md.
6. Candidate 2 exact same native clipboard paste PASS in fresh Paste second.md: both saved links point to Paste second.png and Paste second-1.png. Both files exist, display cyan/orange, and their SHA256s match original fixtures exactly. Evidence/candidate2-multipaste-passed.md.
7. Candidate 2 repeat pair paste in another fresh note Switch source.md PASS: both saved references correct and files exist. Attempted immediate navigation landed an image view because the file explorer shifted after creation; this is NOT a controlled source-note-switch-race pass. Destination note remained unchanged, but timing relative to renaming was not established.

## Explicitly not verified
- Actual Docxer plugin/DOCX import (no fixture document available); no claim that #107 is fully resolved.
- Cursor-move while rename pending (controlled note-switch was later tested; see continuation).
- Ordinary ZIP attachment, excluded folder, missing first embed. Markdown-angle-link import syntax was later tested; see continuation.
- Candidate 2 rerun of every Candidate 1 batch/settings scenario.

## UI limits
Native UI worked via Linux native UI automation; Obsidian accessibility was x11-only, screenshots and coordinates required. Settings is a separate native window. One final native UI automation call opening Async source.md stalled over 2 minutes and was terminated; stopped before claiming those pending tests.

No user vault/account or third-party publishing used. Saved-note/hash evidence and the small paste fixtures in test-evidence/ are synthetic. The disposable application vault is separate.

## Continued verification after UI recovered

The stalled native UI automation click eventually completed. A bounded inventory retry confirmed the actual active note, and tests resumed without repeating uncertain actions.

8. Candidate 2 Docxer-style synthetic fixture PASS: source-informed fixture from Docxer 2.1.2 uses four distinct-color PNGs, Markdown links with spaces/angle brackets and long alt text, while Use Wikilinks=true. Instant batch preserved the ordinal image-to-SHA256 mapping for all four images. Repeated batch preserved saved note text and every hash. Evidence: docxer-candidate2-mapping.json and docxer-candidate2-note.md. This is NOT the original issue DOCX or actual Docxer execution.
9. Candidate 2 controlled delayed source-switch PASS: active Async source.md; created Pasted image delayed.png via filesystem; switched through native UI to AAA destination.md before appending the image link to Async source.md. Plugin renamed to Async source.png and updated source's |25 link. AAA destination.md stayed exactly '# AAA destination\n\nUNCHANGED DESTINATION.\n'. This exercises live Obsidian create/cache events plus actual navigation, with an explicitly synthetic delayed importer. Evidence: candidate2-async-source.md and candidate2-async-destination.md.
10. Candidate 3 final smoke PASS: commit d4686517e986142a48064139e61076020b4a73ab; deployed bundle SHA256 3349ead7fc70756e71b2e8939023fccfbde1adac50e4a4b57b12066d17919ed2. Native two-file clipboard paste in Final paste.md saves Final paste.png and Final paste-1.png references correctly; both original fixture SHA256s match.
11. Candidate 3 final mixed-embed smoke PASS: note embed precedes duplicate image embeds. Instant batch renames image once and preserves |40 and |caption. Evidence: candidate3-final-mixed.md, candidate3-final-paste.md.

Earlier full checks are tied to their exact candidate builds; candidate 3 has targeted final smoke, not a claim that every earlier test was rerun. No remaining environment blocker; additional coverage gaps above remain genuine scope gaps.

## Candidate 4 safety preview QA

Commit 9f62b64c6f8428d80dfe0f90c66f584ef72fcafc, main.js SHA256 078581678e10956457d60fbd513c0b68c5346edf44e5db7f0b2440c04b984d58.

12. Native two-file paste PASS: Fourth paste.md saved correct Fourth paste.png/-1.png references; both PNG hashes match cyan/orange source fixtures.
13. Batch preview rendered two expected rows PASS: qa-one.png -> rone.png and qa-two.png -> rtwo.png for regex qa- replacement r.
14. External-filesystem-move stale-preview preflight GAP FOUND: after preview, moved qa-two.png to qa-moved.png on disk, then clicked Rename all and confirmed Yes. The first image renamed rone.png before second failed stale-path/identity processing. No rtwo.png was created. This differs from the goal of detecting every already-stale task before the first mutation: external rename may become delete/create without changing old TFile.path. The regression was reproduced and corrected in the following candidate. The second broken note reference was caused by test's external move, not the plugin; the plugin introduced a partial rename of the first file. Evidence candidate4-stale-preview-partial.md. Canceled remaining preview afterward.

Cancellation DURING an in-flight batch has not been exercised in native UI; existing unit coverage is not equivalent to this UI scenario.

## Feature2 and final artifact QA

15. Feature2 SHA256 8b3ac46b694d6bc87a8c2ea33e1893b5f29f4c4d4251220ecb9d4527ecf51e56: exact external-move stale-preview regression PASS. Preview zb-one/zb-two -> fone/ftwo, external move of second file to zb-moved.png, then Rename all + Yes. No first-file mutation occurred, both proposed targets absent, original note unchanged. This resolves the Candidate4 preflight gap. Evidence feature2-stale-preflight-passed.md.
16. Final code commit ffd813ec49de8c5172ea2792d9aae467a9e839d2, deployed main.js SHA256 652dd495227de410789e0848a5a7706cc9c0a70d921bc4625d6abbd51afa6b51: manual prompt PASS. With autoRename=false, handleAllAttachments=true and nameInputPosition=select, created and linked Original Photo sample.png. Prompt suggested AAA manual test. Use original name filled Original Photo sample (without .png), selected the full stem, left modal open, and made no filesystem rename. Typing single r replaced selection; clicking Rename produced r.png and updated saved note. Evidence final-manual-name.md.
17. Same final artifact native multi-file paste with options PASS: imageNamePattern={{fileNameSlug}}, dupNumberAlways=true, dupNumberWidth=3. Native clipboard pasted the same cyan/orange PNG pair into AAA Slug 测试.md. Result aaa-slug-测试-001.png and aaa-slug-测试-002.png; saved links correct, Unicode retained, space/case normalization correct, extension preserved, ordered original SHA256s exactly matched. Evidence final-unicode-slug-padded-paste.md and final-artifact-qa.json.

Final artifact verification is targeted: no live UI coverage claimed for every UUID/HEX/nearestHeading/attachmentName alias or all cursor modes. Their unit tests are separate. Cancellation mid-flight remains not exercised in native UI. No issue was closed and no build was externally published during verification.
