import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => readFile(path.join(root, file), 'utf8');
const config = JSON.parse(await read('wrangler.jsonc'));
assert.equal(config.name, 'trana-website-preview');
assert.equal(config.account_id, '32e5ce409bf8494ab7e611df6adaeaca');
assert.deepEqual(config.routes, []);
assert.equal(config.workers_dev, true);
assert.equal(config.preview_urls, false);
assert.equal(config.assets.directory, './dist');
assert.equal(config.assets.not_found_handling, '404-page');
assert.equal(config.main, undefined);
assert.equal(config.build, undefined, 'Build/deploy hooks are intentionally absent');
const robots = await read('dist/robots.txt');
assert.match(robots, /User-agent:\s*\*[\s\S]*Disallow:\s*\//);
const headers = await read('dist/_headers');
assert.match(headers, /^\/\*\s*\n\s+X-Robots-Tag:\s*noindex, nofollow, noarchive/m);
await read('dist/404.html');
let count = 0;
async function inspect(directory) {
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await inspect(file);
    else if (entry.name.endsWith('.html')) {
      const html = await read(file);
      const tag = html.match(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i)?.[0] ?? '';
      for (const directive of ['noindex', 'nofollow', 'noarchive']) assert.ok(tag.includes(directive), `${file}: missing ${directive}`);
      count++;
    }
  }
}
await inspect('dist');
assert.ok(count > 0);
console.log(`Preview guard passed: ${count} HTML documents, custom 404, robots and headers.`);
