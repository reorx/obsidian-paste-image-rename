# 1.7.2 native label compatibility smoke test

2026-10-15. Official Obsidian 1.14.4 on an isolated Linux desktop with a disposable
vault, freshly launched with the final production bundle.

Tested and published `main.js` SHA256:
`da4590b9908c1bef865f1798efe4c50884dc04140c942aaaf5a2863c053d2a5b`.

- All twelve settings labels and their associated controls rendered correctly.
- Disable rename notice toggled on and persisted as true, then toggled off and
  persisted as false, confirmed on disk after app close.
- A genuine PNG copied from Thunar and pasted into a synthetic note inserted and
  rendered normally. The rename dialog displayed New name and its input.
- Rename with the UUID template produced
  `assets/c651a288-b330-4e45-8efa-b714339f9b6e.png`; the saved note contained
  `![[c651a288-b330-4e45-8efa-b714339f9b6e.png]]`.
  Image bytes matched the original SHA256:
  `8cf6e8fe7ae2af91e4805c1a163c1a284c3810166062bfe7e391e748ac36f89c`.
- All three batch labels rendered. Entered name regex `.*`, extension `png`,
  and replacement `qa`; preview showed the expected `qaqa.png` result
  (the global regex also matches the empty terminal string). Cancel retained the
  original file and embed. This label-focused smoke did not execute the batch.

The app was closed and the original disposable configuration restored and compared.
This is targeted Linux smoke coverage, not an exhaustive suite, native 0.12
compatibility certification, or cross-platform certification. User vaults were not
involved.

## Published asset verification

The successful [release run](https://github.com/reorx/obsidian-paste-image-rename/actions/runs/38770030320)
published exactly three assets. Independent public downloads matched the tested build:

| Asset | Bytes | SHA256 |
| --- | ---: | --- |
| main.js | 232756 | da4590b9908c1bef865f1798efe4c50884dc04140c942aaaf5a2863c053d2a5b |
| manifest.json | 290 | 61856083c80b27e8a0ead7a0c3b5e50c21bb1fe3fd7ddbaa9f75ad10e4a66b1b |
| styles.css | 1973 | 81282918372dffbb88d8948099cd8133c8ed3177c772dc141a8c43fb8861f72a |
