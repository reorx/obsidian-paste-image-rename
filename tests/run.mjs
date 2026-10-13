import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

// Keep test bundles out of build/, which the release script publishes.
const outfile = '.test-build/regressions.cjs';
await build({
  entryPoints: ['tests/regressions.ts'],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  alias: { obsidian: './tests/obsidian-mock.ts' },
  define: { 'process.env.BUILD_ENV': '"production"' },
});
const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit' });
process.exitCode = result.status ?? 1;
