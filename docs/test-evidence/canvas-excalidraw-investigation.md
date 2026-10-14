# Canvas / Excalidraw compatibility QA

Tested 2026-10-14 in a disposable cloud vault, using native Obsidian 1.14.4 and official Excalidraw 2.29.0. No repository source was edited for this investigation.

## Result

Extension exclusion alone is insufficient. Canvas assets and Excalidraw assets are ordinary PNG files in these native tests. The current Paste Image Rename (PIR) Markdown-view guard already avoided automatic renames on both drawing boards. Excalidraw's Markdown editing mode bypassed that distinction: pasted PNGs were renamed, including after setting the target extension exclusion to `^(canvas|excalidraw)$` and restarting Obsidian. No broken reference or image corruption was observed in the tested flows.

Recommended minimal protection: retain the Markdown-view guard and exclude recognized drawing *source files*, including their Markdown mode, from automatic and both batch rename entry points. Excalidraw 2.29.0 recognizes legacy final extension `.excalidraw` and a truthy `excalidraw-plugin` frontmatter marker, with its own cached-classification fallback during metadata gaps. A source named `drawing.excalidraw.md` has final extension `md`; matching only final extension `excalidraw` misses it. Do not restrict the marker to the value `parsed`, or use `tags: [excalidraw]` alone as a precise classifier.

This is source-context protection, not proof of asset provenance. A PNG reused in an ordinary Markdown note still has the same extension as any other PNG. Excluding `png` would disable ordinary PNG renaming globally. General protection for shared/exported assets requires an explicit policy or provenance/reference handling, beyond a container-extension regex.

## Version and installation evidence

- Reviewed PIR bundle tested: SHA-256 `f0233e30ff734d7ab5d4cdf9ebb10cf9aa187e2b3cb6f622ce9c09e006b24243`, filename-only source checkpoint `29cb548a27259363c6dca5b20d9ec775adf83bf0`.
- The native community marketplace returned “Failed to load community plugins.” Installation used the authorized official release artifacts, not a third-party mirror: https://github.com/zsviczian/obsidian-excalidraw-plugin/releases/tag/2.29.0
- Official main.js SHA-256 `4da2084a4eafe7d328484fa5742004b9fb990346c4c84fde924b885a5ecc1c17`; manifest `4880b885c50643ef848d31cea829776ca2e96747353aee334d71e875f79d31c0`; styles `173e9c161a01c53b3c173344e023de4d327fd0658e476961b46b0e6a93117ded`. Release digests were checked. Excalidraw's native welcome screen verified successful activation.
- Test configuration: autoRename and handleAllAttachments true; template `{{fileName}}`; initially no extension/folder exclusions. Exact settings are retained in evidence.

## Native test results

1. **Canvas file paste:** Created a built-in Canvas using the command palette. Copied two synthetic 20×20 PNG files through Thunar, then pasted into the Canvas. Both names stayed `Pasted image 202610140001.png` / `...0002.png`. Saved `.canvas` JSON had `type: file` nodes pointing to those paths. Both file hashes matched the input fixtures.
2. **Ordinary Markdown positive control:** Pasted the same file clipboard into `Canvas Excalidraw QA/Control.md`. PIR renamed the new files to `Control.png` and `Control-1.png`, with correct embeds. The Canvas assets/references were unchanged. This confirms PIR was enabled and functioning during the drawing tests.
3. **Excalidraw file paste:** Created a drawing natively. Actual source was `Excalidraw/Control 2026-10-14 03.29.39.excalidraw.md`, with `excalidraw-plugin: parsed` and `tags: [excalidraw]`. Pasted the same two PNG files on the drawing board. Native collision allocation produced `Pasted image 202610140001 1.png` and `...0002 1.png`; PIR did not rename them. Their bytes matched input fixtures. The Markdown saved ID-to-file mappings under `## Embedded Files` plus the compressed scene.
4. **Actual pixel clipboard:** Used Obsidian's image context menu → Copy image, then pasted onto Excalidraw and Canvas. Each created `Pasted image YYYYMMDDHHmmss.png`, not a special drawing-specific image extension. PIR left those names alone. Pixel-paste PNG encoding differed from the file fixture, but decoded 20×20 RGBA pixels were exactly equal. Both containers saved valid references.
5. **Reopen:** Switched away and reopened each container. Canvas and Excalidraw each displayed all three intended scene images. The drawing also survived an app restart with those three images intact.
6. **Excalidraw Markdown-mode edge:** Used Excalidraw's “Toggle between Excalidraw and Markdown mode” command. Pasting pixels into its ordinary Markdown area generated an embed and PIR renamed the PNG to `Control 2026-10-14 03.29.39.excalidraw.png`. The scene's three ID-to-asset mappings were unchanged.
7. **Proposed exclusion tested:** Set `excludeExtensionPattern` to `^(canvas|excalidraw)$`, restarted, returned to the same drawing's Markdown mode, and pasted the two PNG files again. PIR renamed both to `...excalidraw-1.png` and `...excalidraw-2.png`. The screenshot includes both rename notices. The regex applies to the new attachment's extension `png`, not its container.
8. **Batch scope:** Both existing PIR batch commands appeared in the command palette on the drawing's Markdown mode. The interactive batch preview listed the three ordinary `![[PNG]]` embeds in its Markdown body. It did not list the three scene-ID `[[PNG]]` mappings. Preview was cancelled without applying. The instant command was inspected in source, not executed; it uses the same active Markdown file and metadata embeds.
9. **Integrity:** All six PNG references in the final drawing exist. The entire `# Excalidraw Data` suffix stayed byte-identical before/after the Markdown-mode pastes. All 70 files present before this investigation passed the original SHA-256 manifest after testing.

## Extension / format findings

- Canvas container: `.canvas`, JSON Canvas. Its file nodes reference asset paths. The tested image assets are `.png`. Canvas image export can also be PNG, according to official documentation.
- Modern Excalidraw container: `.md`, normally named `*.excalidraw.md`; legacy container: `.excalidraw`.
- Excalidraw source supports ordinary PNG, JPG, SVG and GIF attachment names for image MIME data; current paste code uses Obsidian `app.saveAttachment` in the normal active drawing flow. Only PNG was exercised natively in this investigation.
- Excalidraw can export PNG/SVG and legacy `.excalidraw` data. Official source derives export paths from the drawing path. Therefore a coincidental image extension or basename is not a reliable ownership marker. Export collision/overwrite behavior was not tested and is not claimed here.
- Official text-mode code handles marker values `parsed` and legacy `locked` as parsed mode, otherwise raw. File classification checks truthiness, rather than those exact mode values.

## Evidence index

- `evidence/canvas-file-paste.png`, `canvas-after-paste.canvas`
- `evidence/canvas-after-pixel-paste.canvas`, `canvas-ref-check.json`
- `evidence/markdown-positive-control.md`
- `evidence/excalidraw-after-file-paste.md`, `excalidraw-file-paste-hashes.json`
- `evidence/excalidraw-after-pixel-paste.md`, `excalidraw-reopened.png`
- `evidence/excalidraw-before-markdown-mode.md`, `excalidraw-markdown-side-renamed.md`
- `evidence/excalidraw-extension-filter-result.md`, `excalidraw-extension-filter-renames.png`
- `evidence/excalidraw-batch-preview.png`
- `evidence/test-settings-no-exclusion.json`, `test-settings-extension-exclusion.json`
- `evidence/final-drawing-ref-check.json`, `preexisting-file-integrity.txt`, `vault-before.sha256`
- `evidence/handoff-state.json`

## Official sources

- Canvas: https://obsidian.md/help/plugins/canvas
- JSON Canvas file-node format: https://jsoncanvas.org/spec/1.0/
- Excalidraw project and Markdown format: https://github.com/zsviczian/obsidian-excalidraw-plugin
- Release 2.29.0 and app.saveAttachment change: https://github.com/zsviczian/obsidian-excalidraw-plugin/releases/tag/2.29.0 and https://github.com/zsviczian/obsidian-excalidraw-plugin/pull/2964
- Exact drawing classification: https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/2.29.0/src/core/managers/FileManager.ts
- Exact text-mode markers: https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/2.29.0/src/shared/TextMode.ts
- Attachment creation / path handling: https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/2.29.0/src/shared/ExcalidrawData.ts and https://github.com/zsviczian/obsidian-excalidraw-plugin/blob/2.29.0/src/utils/fileUtils.ts

## Safe handoff

Obsidian is closed. Original `.obsidian` settings, workspace and PIR bundle were restored from the pre-test backup; enabled community plugins are again `[]`. Restored PIR SHA-256 is `652dd495227de410789e0848a5a7706cc9c0a70d921bc4625d6abbd51afa6b51`. This is deliberately the original baseline, not a deployment of the next unreviewed candidate. The official Excalidraw 2.29.0 installation remains available but disabled. The tested configuration is backed up separately in `obsidian-config-tested`.

All new drawing/control fixtures and assets remain in the disposable vault for subsequent regression. Launch script: `/workspace/shared/obsidian-ui-test/launch-obsidian.sh`. Vault: `/workspace/shared/obsidian-ui-test/vault`. The next approved QA build must be deployed explicitly and required plugins reenabled before testing.

Scope limits: latest desktop versions and PNG paths only; no mobile/older-version guarantee, no native GIF/JPEG/SVG matrix, no legacy-file import/export test, and no corruption inferred merely from a rename. Filename modal `../name` smoke testing was not repeated during this phase.
