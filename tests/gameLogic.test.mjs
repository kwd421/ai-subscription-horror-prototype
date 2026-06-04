import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  CAMERAS,
  MONTH_LENGTH_SECONDS,
  MONTH_PHASES,
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

test('month constants use FNAF-style 8m55s pacing and month phase boundaries', () => {
  assert.equal(MONTH_LENGTH_SECONDS, 535);
  assert.match(getMonthLabel(1), /^1/);
  assert.match(getMonthLabel(5), /^5/);
  assert.equal(getPhaseLabel(0), MONTH_PHASES[0]);
  assert.equal(getPhaseLabel(89.9), MONTH_PHASES[0]);
  assert.equal(getPhaseLabel(90), MONTH_PHASES[1]);
  assert.equal(getPhaseLabel(179), MONTH_PHASES[2]);
  assert.equal(getPhaseLabel(446), MONTH_PHASES[5]);
  assert.equal(getPhaseLabel(534.9), MONTH_PHASES[5]);
  assert.ok(CAMERAS.includes(ROOMS.CAM_1C_CLAUDE_CLOSET));
  assert.ok(CAMERAS.includes(ROOMS.CAM_3_SUPPLY_CLOSET));
  assert.ok(CAMERAS.includes(ROOMS.CAM_5_BACKSTAGE));
  assert.ok(CAMERAS.includes(ROOMS.CAM_7_RESTROOMS));
  assert.equal(CAMERAS.length, 11);
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
    ROOMS.CAM_5_BACKSTAGE,
    ROOMS.CAM_3_SUPPLY_CLOSET,
    ROOMS.CAM_2A_LEFT_HALL_FAR,
    ROOMS.CAM_2B_LEFT_HALL_NEAR,
    ROOMS.LEFT_DOOR
  ]);
  assert.equal(gemini.side, 'left');
  assert.equal(gemini.billingPlan, 'Google AI Ultra $249.99');
  assert.deepEqual(grok.route, [
    ROOMS.CAM_1A_STAGE,
    ROOMS.CAM_1B_LOBBY,
    ROOMS.CAM_7_RESTROOMS,
    ROOMS.CAM_6_SERVER_KITCHEN,
    ROOMS.CAM_4A_RIGHT_HALL_FAR,
    ROOMS.CAM_4B_RIGHT_HALL_NEAR,
    ROOMS.RIGHT_DOOR
  ]);
  assert.equal(grok.side, 'right');
  assert.equal(grok.billingPlan, 'Grok Heavy $300');
  assert.equal(chatgpt.billingPlan, 'ChatGPT Pro $200');
  assert.deepEqual(chatgpt.route, [
    ROOMS.CAM_1A_STAGE,
    ROOMS.CAM_1B_LOBBY,
    ROOMS.CAM_7_RESTROOMS,
    ROOMS.CAM_6_SERVER_KITCHEN,
    ROOMS.CAM_4A_RIGHT_HALL_FAR,
    ROOMS.CAM_4B_RIGHT_HALL_NEAR,
    ROOMS.RIGHT_DOOR
  ]);
  assert.equal(claude.role, 'curtain-runner');
  assert.equal(claude.billingPlan, 'Claude Max $200');
  assert.equal(claude.visualState, 'CLOSET_STAGE_0');
  assert.equal(gemini.actionIntervalMin, 4.97);
  assert.equal(gemini.actionIntervalMax, 4.97);
  assert.equal(grok.actionIntervalMin, 4.98);
  assert.equal(grok.actionIntervalMax, 4.98);
  assert.equal(chatgpt.actionIntervalMin, 3.02);
  assert.equal(chatgpt.actionIntervalMax, 3.02);
  assert.equal(claude.actionIntervalMin, 5.01);
  assert.equal(claude.actionIntervalMax, 5.01);
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
  assert.doesNotMatch(hudSource, /score|getHudScore/i);
  assert.match(hudSource, /labels\.tokens/);
});

test('CCTV map source has clickable cameras and no enemy position marker branch', async () => {
  const renderSource = await readFile('src/game/render.js', 'utf8');

  assert.match(renderSource, /camera:\$\{camera\}/);
  assert.doesNotMatch(renderSource, /drawEnemyDots|drawEnemyMapMarkers/);
  assert.doesNotMatch(renderSource, /state\.enemies\.forEach[\s\S]*ctx\.arc/);
});

test('CCTV map renders original-style connected CAM labels and YOU marker', async () => {
  const renderSource = await readFile('src/game/render.js', 'utf8');
  const miniMapStart = renderSource.indexOf('function drawMiniMap');
  const miniMapEnd = renderSource.indexOf('function drawCctvMapConnections', miniMapStart);
  const miniMapSource = renderSource.slice(miniMapStart, miniMapEnd);

  assert.match(renderSource, /drawCctvMapConnections\(ctx\)/);
  assert.match(renderSource, /drawCctvMapLabel\(ctx, camera, x, y, w, h, selected\)/);
  assert.match(renderSource, /const CAMERA_MAP_LABELS = Object\.freeze/);
  assert.match(renderSource, /text\(ctx, 'CAM'/);
  assert.match(renderSource, /function drawYouMarker/);
  assert.match(renderSource, /text\(ctx, 'YOU'/);
  assert.match(renderSource, /\[ROOMS\.CAM_7_RESTROOMS\]: '7'/);
  assert.doesNotMatch(renderSource, /shortCameraLabel\(camera\)/);
  assert.doesNotMatch(miniMapSource, /fillRect\(CCTV_MAP_LAYOUT_ORIGIN\.x - 2, CCTV_MAP_LAYOUT_ORIGIN\.y, 412, 348\)/);
  assert.doesNotMatch(miniMapSource, /rgba\(0, 0, 0, 0\.9\)/);
});

test('CCTV map uses compact hitboxes and corridor-style room outlines', async () => {
  const renderSource = await readFile('src/game/render.js', 'utf8');
  const layoutStart = renderSource.indexOf('const CCTV_MAP_LABEL_SIZE');
  const layoutEnd = renderSource.indexOf('const CAMERA_MAP_LABELS', layoutStart);
  const layoutSource = renderSource.slice(layoutStart, layoutEnd);
  const connectionsStart = renderSource.indexOf('function drawCctvMapConnections');
  const connectionsEnd = renderSource.indexOf('function drawCctvMapLabel', connectionsStart);
  const connectionsSource = renderSource.slice(connectionsStart, connectionsEnd);
  const markerStart = renderSource.indexOf('function drawYouMarker');
  const markerEnd = renderSource.indexOf('function drawMonthClear', markerStart);
  const markerSource = renderSource.slice(markerStart, markerEnd);

  assert.notEqual(layoutStart, -1);
  assert.notEqual(connectionsStart, -1);
  assert.notEqual(connectionsEnd, -1);
  assert.notEqual(markerStart, -1);
  assert.notEqual(markerEnd, -1);
  assert.match(renderSource, /const CCTV_MAP_LABEL_SIZE = Object\.freeze\(\{ w: 56, h: 40 \}\)/);
  assert.match(renderSource, /const CCTV_MAP_LAYOUT_ORIGIN = Object\.freeze\(\{ x: 870, y: 294 \}\)/);
  assert.doesNotMatch(layoutSource, /58,\s*42/);
  assert.match(layoutSource, /ROOMS\.CAM_1A_STAGE\]: \[CCTV_MAP_LAYOUT_ORIGIN\.x \+ 130, CCTV_MAP_LAYOUT_ORIGIN\.y \+ 0/);
  assert.match(layoutSource, /ROOMS\.CAM_1B_LOBBY\]: \[CCTV_MAP_LAYOUT_ORIGIN\.x \+ 108, CCTV_MAP_LAYOUT_ORIGIN\.y \+ 62/);
  assert.match(layoutSource, /ROOMS\.CAM_1C_CLAUDE_CLOSET\]: \[CCTV_MAP_LAYOUT_ORIGIN\.x \+ 78, CCTV_MAP_LAYOUT_ORIGIN\.y \+ 144/);
  assert.match(layoutSource, /ROOMS\.CAM_7_RESTROOMS\]: \[CCTV_MAP_LAYOUT_ORIGIN\.x \+ 336, CCTV_MAP_LAYOUT_ORIGIN\.y \+ 91/);
  assert.match(layoutSource, /ROOMS\.CAM_6_SERVER_KITCHEN\]: \[CCTV_MAP_LAYOUT_ORIGIN\.x \+ 316, CCTV_MAP_LAYOUT_ORIGIN\.y \+ 241/);
  assert.doesNotMatch(renderSource, /ctx\.strokeRect\(CCTV_MAP_LAYOUT_ORIGIN\.x -/);
  assert.match(renderSource, /const REFERENCE_CCTV_MAP_LINES = Object\.freeze/);
  assert.match(connectionsSource, /drawReferenceMapLines\(ctx, x, y\)/);
  assert.match(renderSource, /\[80, 61, 315, 61\]/);
  assert.match(renderSource, /\[80, 203, 315, 203\]/);
  assert.match(renderSource, /\[24, 229, 126, 229\]/);
  assert.match(renderSource, /\[331, 88, 407, 88\]/);
  assert.doesNotMatch(connectionsSource, /drawFloorplanRect/);
  assert.doesNotMatch(connectionsSource, /drawMapPath\(ctx/);
  assert.match(markerSource, /const markerX = x \+ 188/);
  assert.match(markerSource, /const markerY = y \+ 284/);
  assert.match(markerSource, /const markerW = 36/);
  assert.match(markerSource, /const markerH = 62/);
});

test('HUD source follows original-style time, token, and usage placement', async () => {
  const renderSource = await readFile('src/game/render.js', 'utf8');

  assert.match(renderSource, /drawTopRightTime\(ctx, state, boxed\)/);
  assert.match(renderSource, /drawBottomLeftTokenPanel\(ctx, state, boxed\)/);
  assert.match(renderSource, /drawUsageBars\(ctx, getUsageBarsForRender\(state\)\)/);
  assert.match(renderSource, /const CCTV_MAP_LAYOUT_ORIGIN = Object\.freeze\(\{ x: 870, y: 294 \}\)/);
  assert.doesNotMatch(renderSource, /function drawGlobalToggles/);
  assert.doesNotMatch(renderSource, /id, label: labelText, x: 1000, y: 590/);
});

test('office screen keeps visible CCTV, door, and light controls', async () => {
  const renderSource = await readFile('src/game/render.js', 'utf8');
  const officeStart = renderSource.indexOf('function drawOffice');
  const officeEnd = renderSource.indexOf('function drawCctv', officeStart);
  const officeSource = renderSource.slice(officeStart, officeEnd);
  const controlsStart = renderSource.indexOf('function drawDoorAndLightControls');
  const controlsEnd = renderSource.indexOf('function selectOfficeBackground', controlsStart);
  const controlsSource = renderSource.slice(controlsStart, controlsEnd);
  const hudStart = renderSource.indexOf('function drawHud');
  const hudEnd = renderSource.indexOf('function getUsageBarsForRender', hudStart);
  const hudSource = renderSource.slice(hudStart, hudEnd);

  assert.match(officeSource, /state\.ui\.push\(\{ id: 'toggleCctv'/);
  assert.match(officeSource, /drawButton\(ctx, state, 'toggleCctv', 'CCTV', 500, 638, 280, 48\)/);
  assert.match(officeSource, /drawHud\(ctx, state, \{ boxed: false \}\)/);
  assert.match(controlsSource, /drawButton\(ctx, state, 'leftDoor'/);
  assert.match(controlsSource, /drawButton\(ctx, state, 'leftLight'/);
  assert.match(controlsSource, /drawButton\(ctx, state, 'rightDoor'/);
  assert.match(controlsSource, /drawButton\(ctx, state, 'rightLight'/);
  assert.match(hudSource, /if \(boxed\) drawPanel/);
});

test('office light renderer draws left and right beams independently', async () => {
  const renderSource = await readFile('src/game/render.js', 'utf8');
  const officeStart = renderSource.indexOf('function drawOffice');
  const officeEnd = renderSource.indexOf('function drawCctv', officeStart);
  const officeSource = renderSource.slice(officeStart, officeEnd);
  const backgroundStart = renderSource.indexOf('function selectOfficeBackground');
  const backgroundEnd = renderSource.indexOf('function drawOfficeLightLayers', backgroundStart);
  const backgroundSource = renderSource.slice(backgroundStart, backgroundEnd);
  const layersStart = renderSource.indexOf('function drawOfficeLightLayers');
  const layersEnd = renderSource.indexOf('function drawDoorThreats', layersStart);
  const layersSource = renderSource.slice(layersStart, layersEnd);
  const lightStart = renderSource.indexOf('function drawLightCone');
  const lightEnd = renderSource.indexOf('function drawPaywall', lightStart);
  const lightSource = renderSource.slice(lightStart, lightEnd);

  assert.match(officeSource, /state\.lights\.leftOn && state\.lights\.rightOn/);
  assert.match(officeSource, /drawOfficeLightLayers\(ctx, state, assets, sway\)/);
  assert.match(backgroundSource, /state\.lights\.leftOn && state\.lights\.rightOn\) return assets\.images\.backgrounds\.office/);
  assert.match(backgroundSource, /assets\.images\.backgrounds\.leftLightGemini/);
  assert.match(backgroundSource, /assets\.images\.backgrounds\.rightLightChatgpt/);
  assert.match(backgroundSource, /assets\.images\.backgrounds\.rightLightGrok/);
  assert.match(layersSource, /if \(state\.lights\.leftOn\)/);
  assert.match(layersSource, /drawClippedOfficeLayer\(ctx, selectLeftLightLayer\(state, assets\), 'left', sway\)/);
  assert.match(layersSource, /if \(state\.lights\.rightOn\)/);
  assert.match(layersSource, /drawClippedOfficeLayer\(ctx, selectRightLightLayer\(state, assets\), 'right', sway\)/);
  assert.match(layersSource, /function drawClippedOfficeLayer/);
  assert.match(layersSource, /ctx\.clip\(\)/);
  assert.match(layersSource, /ctx\.translate\(sway, 0\)/);
  assert.match(layersSource, /drawCover\(ctx, image, -8, 0, W \+ 16, H\)/);
  assert.doesNotMatch(layersSource, /globalAlpha = 0\.96/);
  assert.notEqual(lightStart, -1);
  assert.notEqual(lightEnd, -1);
  assert.match(lightSource, /ctx\.globalAlpha = 0\.22/);
  assert.match(lightSource, /if \(state\.lights\.leftOn\) drawOfficeLightGradient\(ctx, 'left'\)/);
  assert.match(lightSource, /if \(state\.lights\.rightOn\) drawOfficeLightGradient\(ctx, 'right'\)/);
  assert.match(lightSource, /left \? 200 : 1080/);
  assert.match(lightSource, /gradient\.addColorStop\(0, '#f8f0c8'\)/);
});

test('renderer keeps global screen noise and the title easter egg path wired', async () => {
  const renderSource = await readFile('src/game/render.js', 'utf8');
  const titleStart = renderSource.indexOf('function drawTitle');
  const titleEnd = renderSource.indexOf('function drawTitleGlitch', titleStart);
  const titleSource = renderSource.slice(titleStart, titleEnd);

  assert.match(renderSource, /drawScreenNoise\(ctx, assets, state, now\)/);
  assert.match(renderSource, /function drawScreenNoise/);
  assert.match(renderSource, /assets\.images\.effects\.staticNoise/);
  assert.match(titleSource, /titleStare/);
  assert.match(titleSource, /drawTitleGlitch\(ctx, assets, now\)/);
});
