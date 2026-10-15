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

## One-time 1.7.0 bootstrap

The initial automation commit can also start the first release without an
externally authenticated tag push. This exception is restricted to a non-forced
push to `master`, version `1.7.0`, exactly one direct parent
`0487fc9acc3cc059edaf8e58e92e0ad5163b7b60`, matching event `before`/`after` values,
and exact commit subject `ci: bootstrap automated release 1.7.0`.
It builds and verifies that exact event commit, creates the plain `1.7.0` tag at it,
and publishes through the same guarded path. No other master push is eligible.
A tag created using `GITHUB_TOKEN` does not trigger another push workflow, so this
single run completes publication directly.

Remove the master trigger and bootstrap exception after the verified release.
Future releases use only plain version-tag pushes. Plugin source, version and
release notes must not change while a release is being finalized.
