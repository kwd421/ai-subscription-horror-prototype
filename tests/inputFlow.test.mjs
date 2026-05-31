import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('game input handlers do not block gameplay on audio unlock', async () => {
  const source = await readFile('src/main.js', 'utf8');

  assert.doesNotMatch(source, /await safeAudioUnlock\(\)/);
  assert.match(source, /void safeAudioUnlock\(\)/);
});
