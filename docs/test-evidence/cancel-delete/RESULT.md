# Cancel and Delete native QA: PASS

Tested on official Obsidian 1.14.4, Linux cloud desktop, 2026-10-14. Only newly generated, isolated fixtures were used. No repository source edits.

Exact tested main.js SHA256: `cb5d2cacb7b4c091923939852b82ed1d114611ca0aea6204f1c7e1a53330630a` (candidate and installed bundle verified).

Vault: `/workspace/shared/cancel-delete-native/vault`, separate profile/launcher. Initial vault had only ordinary Markdown and precreated `assets/`. Settings: autoRename=false, handleAllAttachments=true, imageNamePattern={{fileName}}. Native clipboard workflow: select one actual PNG in Thunar, Ctrl+C, focus empty middle line of active note, Ctrl+V. No synthetic JS events or host API mocks.

## Results

- **Successful discard:** Native prompt offered a distinct enabled Cancel and Delete action and the local-trash/Undo/30-second warning. Clicking within the proof window removed exactly the inserted embed, preserving `Before\n\nAfter\n`. Physical image moved from assets to local vault `.trash`, original filename unchanged. Trash SHA256 matched clipboard input: `f19fdba651c1c02b196ce5cf202740023f9cec9d5064b86774188d0c4d27a098`.
- **Undo limitation and manual recovery:** One native Ctrl+Z restored only the embed; Obsidian visibly reported the image could not be found while file remained in `.trash`. Native Thunar cut/paste moved it back to assets. The embed rendered again, and SHA256 remained identical.
- **Ordinary Cancel and Escape:** Separate new orange/magenta files and notes. Both left the exact saved new embed and original asset name/bytes intact; no trash operation or rename.
- **Shared reference refusal:** A separate ordinary Markdown note already mentioned the incoming green filename. Discard refused with `Other Reference.md: ... Another mention or reference to this attachment exists.` Both references and image bytes remained intact. Delete and Rename became disabled; clicks on both did nothing. Cancel still closed the prompt.
- **Stale source refusal:** After prompt capture, externally appended `External edit preserved` to the owned active fixture. Discard refused because captured source/editor changed. The new edit, embed, and attachment remained intact.
- **Rapid double-click:** A new blue image received a double-click on Cancel and Delete. One visible success, source restored exactly, one unchanged-byte trash file under its original name, no rename. Reopening the note after other cases still showed exact original surrounding text. This checks visible/physical results; no claim of native instrumentation of internal trash call count.
- **Mixed-vault refusal:** Added an owned `Unsupported.canvas` fixture before pasting a new red image into ordinary Markdown. Discard refused with `Unsupported container blocks deletion: Unsupported.canvas`. Note/reference, image hash and Canvas contents remained intact.
- **Settled integrity:** All seven pasted raster hashes equal their distinct inputs. Saved notes match expected exact strings. The final trash contains only the blue double-click fixture; first success image was manually recovered.

## Evidence

Screenshots 01–12 and JSON evidence are in `evidence/`:
- `01-success-disk.json`: exact source and local trash hash before Undo
- `03-undo-note.md`, screenshots 03–05: dangling Undo and manual restoration
- screenshots 06–09: Cancel/Escape, shared and stale refusals
- `10-double-click-disk.json`, screenshots 10/12: one trash result and reopened success
- screenshot 11: Canvas refusal
- `settled-state.json`: all final notes, image paths/hashes, Canvas content
- `restoration.json`: verified cleanup

## Cleanup and limits

Obsidian closed using its native close button; window inventory confirmed it absent. Tested config moved outside active vault to `tested-vault-config/`; isolated original app/community config restored byte-for-byte, with no active plugin installation. All 14 original main-QA config files remain byte-for-byte unchanged. Own fixtures and recoverable trash preserved.

Native coverage is Linux Obsidian 1.14.4 with genuine single PNG file clipboard paste and wiki embeds in Live Preview. No claim of native mobile/macOS/Windows, OS clipboard image re-encoding, every raster format, drag/drop, all unsupported container types, timed expiration boundary, new-folder invalidation, or injected host-trash error. Automated review/probe coverage is separate from these native observations.

Repository evidence includes the compact JSON files listed above. Screenshot filenames refer to the preserved native QA run; screenshot binaries are not included in this source checkpoint.
