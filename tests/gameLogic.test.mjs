import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  CAMERAS,
  MONTH_LENGTH_SECONDS,
  ROOMS,
  getMonthLabel,
  getPhaseLabel
} from '../src/game/constants.js';
import { createEnemy } from '../src/game/enemies.js';
import { createSeededRng } from '../src/game/rng.js';
import {
  calculateFinalTokenScore,
  calculateGameOverTokenScore,
  calculateMonthTokenScore
} from '../src/game/score.js';

test('month constants use token-era pacing and Korean month labels', () => {
  assert.equal(MONTH_LENGTH_SECONDS, 90);
  assert.equal(getMonthLabel(1), '1개월차');
  assert.equal(getMonthLabel(5), '5개월차');
  assert.equal(getPhaseLabel(0), '월초');
  assert.equal(getPhaseLabel(89.9), '월말 직전');
  assert.ok(CAMERAS.includes(ROOMS.CAM_1C_CLAUDE_CLOSET));
});

test('seeded rng is deterministic and stays inside [0, 1)', () => {
  const a = createSeededRng(5091);
  const b = createSeededRng(5091);

  const valuesA = Array.from({ length: 8 }, () => a.next());
  const valuesB = Array.from({ length: 8 }, () => b.next());

  assert.deepEqual(valuesA, valuesB);
  assert.ok(valuesA.every((value) => value >= 0 && value < 1));
});

test('enemy definitions match month-era role contracts and invoice plans', () => {
  const gemini = createEnemy('gemini', 1, createSeededRng(1));
  const grok = createEnemy('grok', 1, createSeededRng(2));
  const chatgpt = createEnemy('chatgpt', 3, createSeededRng(3));
  const claude = createEnemy('claude', 3, createSeededRng(4));

  assert.deepEqual(gemini.route, [
    ROOMS.CAM_1A_STAGE,
    ROOMS.CAM_1B_LOBBY,
    ROOMS.CAM_2A_LEFT_HALL_FAR,
    ROOMS.CAM_2B_LEFT_HALL_NEAR,
    ROOMS.LEFT_DOOR
  ]);
  assert.equal(gemini.side, 'left');
  assert.equal(gemini.billingPlan, 'Google AI Ultra $249.99');
  assert.deepEqual(grok.route.slice(-3), [
    ROOMS.CAM_4A_RIGHT_HALL_FAR,
    ROOMS.CAM_4B_RIGHT_HALL_NEAR,
    ROOMS.RIGHT_DOOR
  ]);
  assert.equal(grok.side, 'right');
  assert.equal(grok.billingPlan, 'Grok Heavy $300');
  assert.equal(chatgpt.billingPlan, 'ChatGPT Pro $200');
  assert.equal(claude.role, 'curtain-runner');
  assert.equal(claude.billingPlan, 'Claude Max $200');
  assert.equal(claude.visualState, 'CLOSET_STAGE_0');
});

test('token scoring follows GAMESPEC examples', () => {
  assert.equal(calculateMonthTokenScore(83.444), 83.4);

  const gameOver = calculateGameOverTokenScore({
    clearedTokenResults: [80.1, 70.2],
    failedMonthTokens: 50.0,
    survivedRatio: 0.5
  });

  assert.equal(gameOver.partialFailedMonthScore, 25.0);
  assert.equal(gameOver.finalScore, 175.3);
  assert.equal(calculateFinalTokenScore([80.1, 70.2, 60.3, 50.4, 40.5]), 301.5);
});

test('active HUD source does not render realtime score text', async () => {
  const renderSource = await readFile('src/game/render.js', 'utf8');
  const hudStart = renderSource.indexOf('function drawHud');
  const hudEnd = renderSource.indexOf('function drawTokenGauge', hudStart);
  const hudSource = renderSource.slice(hudStart, hudEnd);

  assert.notEqual(hudStart, -1);
  assert.notEqual(hudEnd, -1);
  assert.doesNotMatch(hudSource, /점수|score|getHudScore/i);
  assert.match(hudSource, /남은 토큰/);
});

test('CCTV map source has clickable cameras and no enemy position marker branch', async () => {
  const renderSource = await readFile('src/game/render.js', 'utf8');

  assert.match(renderSource, /camera:\$\{camera\}/);
  assert.doesNotMatch(renderSource, /drawEnemyDots|drawEnemyMapMarkers/);
  assert.doesNotMatch(renderSource, /state\.enemies\.forEach[\s\S]*ctx\.arc/);
});
