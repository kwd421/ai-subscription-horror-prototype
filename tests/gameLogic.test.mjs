import test from 'node:test';
import assert from 'node:assert/strict';

import { ATTACK_WINDOWS, NIGHT_LENGTH_SECONDS, getClockLabel } from '../src/game/constants.js';
import { createEnemy, handleAttackResolution, moveEnemyForward } from '../src/game/enemies.js';
import { createSeededRng } from '../src/game/rng.js';
import { calculateNightScore, calculatePartialScore } from '../src/game/score.js';

test('night clear score follows the GAMESPEC formula', () => {
  const score = calculateNightScore({
    currentNight: 3,
    remainingPower: 42,
    successfulDoorBlocks: 4,
    cameraUseSeconds: 73.2,
    doorClosedSeconds: 81.7
  });

  assert.equal(score, 3 * 1000 + Math.floor(42 * 35) + 4 * 150 + (500 - Math.floor(73.2 * 3)) + (500 - Math.floor(81.7 * 2)));
});

test('partial game-over score includes completed nights, survival, power, and blocks', () => {
  const score = calculatePartialScore({
    completedNights: 2,
    survivedTimeRatio: 0.625,
    remainingPower: 31,
    successfulDoorBlocks: 3
  });

  assert.equal(score, 2 * 1000 + Math.floor(0.625 * 800) + Math.floor(31 * 10) + 3 * 75);
});

test('night constants match prototype pacing and attack windows', () => {
  assert.equal(NIGHT_LENGTH_SECONDS, 90);
  assert.deepEqual(ATTACK_WINDOWS, {
    1: 2.4,
    2: 2.1,
    3: 1.8,
    4: 1.5,
    5: 1.25
  });
  assert.equal(getClockLabel(0), '12 AM');
  assert.equal(getClockLabel(89.9), '5 AM');
  assert.equal(getClockLabel(90), '6 AM');
});

test('seeded rng is deterministic and stays inside [0, 1)', () => {
  const a = createSeededRng(5091);
  const b = createSeededRng(5091);

  const valuesA = Array.from({ length: 8 }, () => a.next());
  const valuesB = Array.from({ length: 8 }, () => b.next());

  assert.deepEqual(valuesA, valuesB);
  assert.ok(valuesA.every((value) => value >= 0 && value < 1));
});

test('enemy routes and side metadata match each doll contract', () => {
  const gemini = createEnemy('gemini', 1, createSeededRng(1));
  const grok = createEnemy('grok', 2, createSeededRng(2));
  const chatgpt = createEnemy('chatgpt', 3, createSeededRng(3));
  const claude = createEnemy('claude', 3, createSeededRng(4));

  assert.deepEqual(gemini.route, ['STAGE', 'LOBBY', 'LEFT_HALL_FAR', 'LEFT_HALL_NEAR', 'OFFICE_LEFT_ATTACK']);
  assert.equal(gemini.side, 'left');
  assert.deepEqual(grok.route, ['STAGE', 'SERVER', 'RIGHT_HALL_FAR', 'RIGHT_HALL_NEAR', 'OFFICE_RIGHT_ATTACK']);
  assert.equal(grok.side, 'right');
  assert.equal(chatgpt.currentRoom, 'STAGE');
  assert.match(chatgpt.route.join('>'), /^STAGE>LOBBY>(LEFT|RIGHT)_HALL_FAR>/);
  assert.deepEqual(claude.route.slice(0, 3), ['STAGE', 'STORAGE', 'SERVER']);
  assert.ok(['left', 'right'].includes(claude.side));
});

test('moving to a near hall changes pose and exposes the warning', () => {
  const gemini = createEnemy('gemini', 5, createSeededRng(8));
  const far = moveEnemyForward(gemini);
  const near = moveEnemyForward(moveEnemyForward(far));

  assert.equal(near.currentRoom, 'LEFT_HALL_NEAR');
  assert.equal(near.pose, 'running');
  assert.equal(near.warningText, '내놔!!!!');
  assert.equal(near.attackTimer, ATTACK_WINDOWS[5]);
});

test('closed correct door repels an attack and open door causes a breach', () => {
  const attacker = {
    ...createEnemy('grok', 2, createSeededRng(22)),
    currentRoom: 'OFFICE_RIGHT_ATTACK',
    side: 'right',
    attackTimer: 0
  };

  const repelled = handleAttackResolution(attacker, { leftClosed: false, rightClosed: true });
  assert.equal(repelled.outcome, 'repelled');
  assert.equal(repelled.enemy.currentRoom, 'RIGHT_HALL_FAR');
  assert.ok(repelled.enemy.repelledCooldown > 0);

  const breached = handleAttackResolution(attacker, { leftClosed: false, rightClosed: false });
  assert.equal(breached.outcome, 'breach');
  assert.equal(breached.defeatedBy, 'Grok Doll');
});
