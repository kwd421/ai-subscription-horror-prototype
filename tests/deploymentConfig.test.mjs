import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('index redirects file-protocol launches to the generated single-file build before loading modules', async () => {
  const html = await readFile('index.html', 'utf8');
  const redirectIndex = html.indexOf("location.protocol === 'file:'");
  const moduleIndex = html.indexOf('<script type="module"');

  assert.notEqual(redirectIndex, -1);
  assert.notEqual(moduleIndex, -1);
  assert.ok(redirectIndex < moduleIndex);
  assert.match(html, /PLAY\.html/);
});

test('Netlify deploys the reproducible build output', async () => {
  const config = await readFile('netlify.toml', 'utf8');

  assert.match(config, /\[build\]/);
  assert.match(config, /command\s*=\s*"npm run build"/);
  assert.match(config, /publish\s*=\s*"dist"/);
});
