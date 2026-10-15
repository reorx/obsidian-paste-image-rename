# Releasing the plugin

Releases use plain semantic version tags such as `1.7.0`, matching `manifest.json`
exactly. Do not add `v`: Obsidian downloads plugin assets from the matching release
([official guidance](https://docs.obsidian.md/plugins/releasing/submit-plugin)).

1. Update `package.json`, both root package versions in `package-lock.json`,
   `manifest.json`, and `versions.json`, and write `docs/releases/VERSION.md`.
2. Run `npm ci`, `node --test tests/release-automation.mjs`, `npm test`,
   `npm run typecheck`, `npm run lint`, and `npm run build`.
3. Commit and push the reviewed release to `master`.
4. Create the new plain version tag at that exact commit and push it. Never move
   or force-push an existing release tag.
5. Follow **Release Obsidian plugin** in GitHub Actions. The read-only build job
   verifies the tag/version, tests, builds, validates the three assets and bundled
   notices, and passes a SHA256 inventory to a separate publication job.

Publication uses only GitHub's automatically provided, job-scoped `GITHUB_TOKEN`
with `contents: write`. No personal access token, stored credential, npm token,
repository secret, or additional account connection is required. Actions are
pinned to reviewed full commit SHAs, and checkout does not persist credentials.
The workflow publishes only `main.js`, `manifest.json`, and `styles.css`.

Publication first creates a draft, uploads missing assets, downloads and verifies
all bytes, verifies the immutable tag target again, and then publishes. Rerun a
failed run to recover a transient failure. An identical completed release is a
verified no-op; an incomplete draft can resume only if its existing tag, notes and
assets match. The workflow refuses mismatched tags, differing existing assets,
unexpected uploads, incomplete published releases, and changed release notes.
It never moves tags or overwrites/deletes release assets. Inspect those conflicts
before deciding how to recover them; do not force a release over them.

## First automated release

Version [1.7.0](https://github.com/reorx/obsidian-paste-image-rename/releases/tag/1.7.0)
was published by [this successful Actions run](https://github.com/reorx/obsidian-paste-image-rename/actions/runs/38677284098)
at commit `943eb06b7764fff52475aa86d175bddc6db2d90c`. Its temporary, tightly gated
master bootstrap has been removed. The current workflow accepts version-tag
pushes only; branch pushes cannot publish a release.

## Community maintenance release 1.7.1

Version [1.7.1](https://github.com/reorx/obsidian-paste-image-rename/releases/tag/1.7.1)
uses reviewed source commit `ec796dae3f65e3f0589268d41696858455404dac` and immutable
release commit `11b7ef17d0f08680793664c3b1031d9236e9befc`.
[Actions run](https://github.com/reorx/obsidian-paste-image-rename/actions/runs/38763787899)
performs tests, lint, build, and byte-verified publication using GITHUB_TOKEN.
The temporary exact-parent/subject/event-gated master bootstrap was removed after
verification; ordinary branch pushes cannot publish. No new persistent credential
or permission was introduced. See the [native smoke evidence](test-evidence/community-review-1.7.1.md)
and [Community review audit](community-review.md) for test scope and remaining advisories.

## Legacy label API cleanup 1.7.2

Version [1.7.2](https://github.com/reorx/obsidian-paste-image-rename/releases/tag/1.7.2)
uses reviewed source commit `c47b4342f30b18978d6e2be4c143e6d86dd8f80b` and release
commit `f1cf54ebe04fbda094cf361e9ead2e3d02bb3ee0`.
[Actions run](https://github.com/reorx/obsidian-paste-image-rename/actions/runs/38770030320)
succeeded, including tests, lint, build and byte-verified publication. The three public
assets were independently downloaded and matched the locally tested SHA256 hashes.
The temporary exact-parent/subject/event-gated master bootstrap was then removed,
restoring the version-tag-only workflow without adding persistent credentials or
permissions. See [native smoke evidence](test-evidence/community-review-1.7.2.md)
and the [audit](community-review.md): API warnings decreased from 41 to 25; this
does not certify old native runtimes or predict Community service approval.
