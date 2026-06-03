import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('game input handlers do not block gameplay on audio unlock', async () => {
  const source = await readFile('src/main.js', 'utf8');

  assert.doesNotMatch(source, /await safeAudioUnlock\(\)/);
  assert.match(source, /void safeAudioUnlock\(\)/);
});

test('gameplay controls are mouse-only with no keyboard shortcut listener', async () => {
  const source = await readFile('src/main.js', 'utf8');

  assert.doesNotMatch(source, /addEventListener\('keydown'/);
  assert.doesNotMatch(source, /performAction\('mute'\)/);
  assert.doesNotMatch(source, /performAction\('motion'\)/);
});

test('docs describe the current mouse-only gameplay controls', async () => {
  const spec = await readFile('GAMESPEC.md', 'utf8');
  const readme = await readFile('README.md', 'utf8');

  assert.doesNotMatch(spec, /\b(?:C|Esc|Q|E|A\/D|M|R):/);
  assert.doesNotMatch(spec, /keyboard controls|arrow keys/i);
  assert.match(spec, /Mouse: click all UI controls/);
  assert.match(readme, /키보드 단축키.*없습니다/);
});
