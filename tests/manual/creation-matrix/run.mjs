// Read-only repository access. All generated output goes to a new temp directory.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';

const scripts=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2);
function option(name, fallback) {
 const i=args.indexOf(name);
 if(i<0) return fallback;
 if(!args[i+1]||args[i+1].startsWith('--')) throw new Error(`Missing value for ${name}`);
 return args[i+1];
}
const repo=path.resolve(option('--repo',process.env.PIR_REPO||process.cwd()));
const currentRef=option('--current-ref','b2c2ac6ad25043c95aff55ac0583a24d80b0b509');
const legacyRef=option('--legacy-ref','1.6.1');
const explicitOutput=option('--out','');
const root=explicitOutput?path.resolve(explicitOutput):fs.mkdtempSync(path.join(os.tmpdir(),'pir-creation-matrix-'));
if(explicitOutput) {
 if(fs.existsSync(root)) throw new Error('--out must name a new directory, to avoid touching existing files.');
 fs.mkdirSync(root,{recursive:true});
}
const keepFixtures=args.includes('--keep-fixtures');
const {build}=await import(pathToFileURL(path.join(repo,'node_modules/esbuild/lib/main.js')).href);
console.log(`Creation matrix artifacts: ${root}`);
try {
 const refs={};
 for(const [destination,ref] of [['current',currentRef],['legacy',legacyRef]]) {
  const output=path.join(root,destination);fs.mkdirSync(output,{recursive:true});
  const paths=destination==='current'?['src','package.json','tests/obsidian-mock.ts']:['src','package.json'];
  const archive=execFileSync('git',['-C',repo,'archive',ref,...paths],{maxBuffer:20_000_000});
  execFileSync('tar',['-x','-C',output],{input:archive});
  fs.symlinkSync(path.join(repo,'node_modules'),path.join(output,'node_modules'),'dir');
  refs[destination]={ref,commit:execFileSync('git',['-C',repo,'rev-parse',ref],{encoding:'utf8'}).trim()};
 }
 fs.writeFileSync(path.join(root,'refs.json'),JSON.stringify(refs,null,2));
 execFileSync('python',['-B',path.join(scripts,'generate-fixtures.py'),root]);
 await build({entryPoints:[path.join(scripts,'matrix.ts')],outfile:path.join(root,'matrix.cjs'),bundle:true,platform:'node',format:'cjs',alias:{obsidian:path.join(root,'current/tests/obsidian-mock.ts'),'pir-current':path.join(root,'current/src/main.ts'),'pir-legacy':path.join(root,'legacy/src/main.ts')},define:{'process.env.BUILD_ENV':'"production"','process.env.PIR_TEST_ROOT':JSON.stringify(root),'process.env.PIR_CURRENT_REF':JSON.stringify(refs.current.commit),'process.env.PIR_LEGACY_REF':JSON.stringify(refs.legacy.commit)}});
 const result=spawnSync(process.execPath,[path.join(root,'matrix.cjs')],{stdio:'inherit'});process.exitCode=result.status??1;
} finally {
 if(!keepFixtures) {
  for(const name of ['Pasted image huge.png','Pasted image wide.webp','Note.png','Note.webp']) fs.rmSync(path.join(root,name),{force:true});
  console.log('Generated image files removed; source snapshots, bundle and JSON evidence retained. Use --keep-fixtures to retain the images.');
 }
}
