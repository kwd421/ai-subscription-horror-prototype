import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildSingleFileHtml } from '../scripts/single-file-builder.mjs';

test('single-file package embeds code and generated PNG assets without external game references', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'ai-horror-single-'));
  const outFile = join(tempDir, 'PLAY.html');

  try {
    await buildSingleFileHtml({
      rootDir: process.cwd(),
      outFile
    });

    const html = await readFile(outFile, 'utf8');
    assert.match(html, /<script>window\.__PACKED_GAME_MANIFEST__ = /);
    assert.match(html, /data:image\/png;base64,/);
    assert.match(html, /function renderGame\(/);
    assert.doesNotMatch(html, /src="\.\/src\/main\.js/);
    assert.doesNotMatch(html, /assets\/generated\/[^"')]+\.png/);
    assert.doesNotMatch(html, /type="module"/);
    assert.doesNotMatch(html, /fetch\('assets\/generated\/asset_manifest\.json'\)/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
