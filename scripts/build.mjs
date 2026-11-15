import { spawn } from 'node:child_process';
import { mkdir, readFile, rename, rm, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const stage = resolve(root, '.cache/next-build');
const previous = resolve(root, '.cache/previous-build');
const dist = resolve(root, 'dist');
const exists = async path => stat(path).then(() => true, error => { if (error.code === 'ENOENT') return false; throw error; });
await mkdir(dirname(stage), { recursive: true });
await rm(stage, { recursive: true, force: true });
const astro = JSON.parse(await readFile(resolve(root, 'node_modules/astro/package.json'), 'utf8'));
const bin = typeof astro.bin === 'string' ? astro.bin : astro.bin.astro;
const cli = resolve(root, 'node_modules/astro', bin);
const code = await new Promise((resolveCode, reject) => {
  const child = spawn(process.execPath, [cli, 'build', '--outDir', stage], { cwd: root, stdio: 'inherit', env: process.env });
  child.once('error', reject);
  child.once('exit', (code, signal) => resolveCode(signal ? 1 : code ?? 1));
});
if (code !== 0) {
  console.error('Build failed; the previous dist/ has been preserved.');
  process.exitCode = code;
} else {
  await rm(previous, { recursive: true, force: true });
  const hadPrevious = await exists(dist);
  if (hadPrevious) await rename(dist, previous);
  try { await rename(stage, dist); }
  catch (error) { if (hadPrevious) await rename(previous, dist); throw error; }
  console.log('Successful build promoted to dist/.');
}
