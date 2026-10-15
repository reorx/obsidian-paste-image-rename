# 1.7.1 native maintenance smoke test

2026-10-15. Official Obsidian 1.14.4 on an isolated Linux desktop, using a disposable
vault. Native app restarted after installing the final production build.

Tested `main.js` SHA256:
`ec82949f86ec64b60e4f424e1733849927d8eff9ae933fd6a74e22edfa20ea70`.

- A genuine PNG file copied in Thunar and pasted into the active note inserted
  and rendered normally.
- The UUID template generated a valid v4 identifier. Rename created
  `assets/9561ad47-5f92-4a03-8f0e-3b8d4135f142.png`, and the saved note contained
  `![[9561ad47-5f92-4a03-8f0e-3b8d4135f142.png]]`.
- The renamed image SHA256 exactly matched its original clipboard file:
  `68d56c7d74e2ec2cf7661d97bb5b957da737e1171381ac067aef557e18ac7971`.
- Manual rename error was initially hidden. Clearing the name and clicking Rename
  displayed the red-bordered empty-name error without renaming. Ordinary Cancel
  retained the inserted image.
- Batch error was initially hidden. Enter in an empty Name pattern displayed the
  red-bordered empty-pattern error. Preview with malformed regex `[` displayed an
  invalid-regex notice without changing files.

All cases were repeated on the final frozen bundle. This is targeted smoke coverage,
not an exhaustive regression suite, a native 0.12 runtime test, or cross-platform
certification. The app was closed and the original disposable configuration restored
and compared after testing. User vaults were not involved.
