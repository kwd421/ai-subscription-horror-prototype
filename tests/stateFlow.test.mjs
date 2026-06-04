import test from 'node:test';
import assert from 'node:assert/strict';

import { MONTH_LENGTH_SECONDS, ROOMS } from '../src/game/constants.js';
import { createEnemy } from '../src/game/enemies.js';
import { createSeededRng } from '../src/game/rng.js';
import {
  STATES,
  advanceAfterClear,
  closeCamera,
  createInitialState,
  getSelectedCamera,
  selectCamera,
  startRun,
  switchCamera,
  toggleCamera,
  toggleDoor,
  toggleLight,
  updateState
} from '../src/game/state.js';

const silentAudio = {
  beep() {},
  chime() {},
  click() {},
  doorPanic() {},
  scare() {},
  staticBurst() {},
  thud() {}
};

const alwaysSuccessRng = {
  next() { return 0; },
  range(min) { return min; },
  int() { return 1; },
  chance() { return false; },
  choice(items) { return items[0]; }
};

function tick(state, seconds, dt = 0.25) {
  for (let elapsed = 0; elapsed < seconds; elapsed += dt) {
    updateState(state, dt, silentAudio);
  }
}

test('start run, CCTV map selection, doors, and lights update month-token state', () => {
  const state = createInitialState();
  startRun(state, { seed: 'controls' });

  assert.equal(state.screen, STATES.OFFICE);
  assert.equal(state.currentMonth, 1);
  assert.equal(state.tokens, 99.9);
  assert.equal(toggleCamera(state), true);
  assert.equal(state.screen, STATES.CCTV);
  assert.equal(getSelectedCamera(state), ROOMS.CAM_1A_STAGE);
  assert.equal(switchCamera(state, 1), true);
  assert.equal(getSelectedCamera(state), ROOMS.CAM_1B_LOBBY);
  assert.equal(selectCamera(state, ROOMS.CAM_4B_RIGHT_HALL_NEAR), true);
  assert.equal(getSelectedCamera(state), ROOMS.CAM_4B_RIGHT_HALL_NEAR);
  assert.equal(toggleDoor(state, 'left'), true);
  assert.equal(toggleDoor(state, 'right'), true);
  assert.equal(toggleLight(state, 'left'), true);
  assert.equal(toggleLight(state, 'right'), true);
  assert.equal(state.doors.leftClosed, true);
  assert.equal(state.doors.rightClosed, true);
  assert.equal(state.lights.leftOn, true);
  assert.equal(state.lights.rightOn, true);
});

test('token drain uses FNAF-style internal 999 counter, usage bars, and passive monthly drain', () => {
  const state = createInitialState();
  startRun(state, { seed: 'fnaf-token-drain' });
  state.enemies = [];

  tick(state, 10, 0.5);
  assert.equal(state.tokens, 98.9);

  toggleCamera(state);
  state.doors.leftClosed = true;
  state.doors.rightClosed = true;
  state.lights.leftOn = true;
  tick(state, 3, 0.25);
  assert.equal(state.tokens, 97.4);

  startRun(state, { seed: 'fnaf-passive-drain' });
  state.enemies = [];
  state.currentMonth = 3;
  tick(state, 5, 0.5);
  assert.equal(state.tokens, 99.3);
});

test('title stare glitch appears once per randomized 10 to 20 second window', () => {
  const state = createInitialState();

  assert.ok(state.titleGlitch.nextIn >= 10);
  assert.ok(state.titleGlitch.nextIn <= 20);
  assert.equal(state.titleGlitch.flashTimer, 0);

  const firstDelay = state.titleGlitch.nextIn;
  tick(state, firstDelay + 0.1, 0.1);

  assert.ok(state.titleGlitch.flashTimer > 0);
  assert.ok(state.titleGlitch.flashTimer <= 0.5);
  assert.ok(state.staticBurst >= 0.65);
  assert.ok(state.titleGlitch.nextIn >= 10);
  assert.ok(state.titleGlitch.nextIn <= 20);

  tick(state, 1, 0.1);

  assert.equal(state.titleGlitch.flashTimer, 0);
});

test('month 1 randomized action opportunities do not always produce the same first approaches', () => {
  const signatures = new Set();
  const sides = new Set();

  for (let run = 0; run < 50; run += 1) {
    const state = createInitialState();
    startRun(state, { seed: `month-1-random-${run}` });
    tick(state, 360, 0.5);
    const firstTwo = state.approachLog.slice(0, 2).map((entry) => `${entry.id}:${entry.side}`).join('|');
    if (firstTwo) signatures.add(firstTwo);
    state.approachLog.forEach((entry) => sides.add(entry.side));
  }

  assert.ok(signatures.size > 1);
  assert.ok(sides.has('left'));
  assert.ok(sides.has('right'));
});

test('watching Gemini camera freezes movement for 30 simulated seconds', () => {
  const state = createInitialState();
  startRun(state, { seed: 'freeze-gemini' });
  const gemini = {
    ...createEnemy('gemini', 5, createSeededRng('freeze-gemini')),
    currentRoom: ROOMS.CAM_2A_LEFT_HALL_FAR,
    routeIndex: 4,
    actionCooldown: 0.1,
    aiLevelsByMonthPhase: { 5: [20, 20, 20, 20, 20, 20] }
  };
  state.currentMonth = 5;
  state.screen = STATES.CCTV;
  state.cameraOpen = true;
  state.selectedCameraIndex = state.cameras.indexOf(ROOMS.CAM_2A_LEFT_HALL_FAR);
  state.enemies = [gemini];

  tick(state, 30, 0.5);

  assert.equal(state.enemies[0].currentRoom, ROOMS.CAM_2A_LEFT_HALL_FAR);
  assert.equal(state.enemies[0].pose, 'camera_stare');
});

test('wrong camera does not freeze Grok when AI roll succeeds', () => {
  const state = createInitialState();
  startRun(state, { seed: 'wrong-camera-grok' });
  const grok = {
    ...createEnemy('grok', 5, createSeededRng('wrong-camera-grok')),
    currentRoom: ROOMS.CAM_4A_RIGHT_HALL_FAR,
    routeIndex: 4,
    actionCooldown: 0.1,
    aiLevelsByMonthPhase: { 5: [20, 20, 20, 20, 20, 20] }
  };
  state.currentMonth = 5;
  state.screen = STATES.CCTV;
  state.cameraOpen = true;
  state.selectedCameraIndex = state.cameras.indexOf(ROOMS.CAM_1A_STAGE);
  state.enemies = [grok];

  tick(state, 6, 0.5);

  assert.notEqual(state.enemies[0].currentRoom, ROOMS.CAM_4A_RIGHT_HALL_FAR);
});

test('blocked Bonnie and Chica-style door attempts return to CAM 1B', () => {
  const state = createInitialState();
  startRun(state, { seed: 'door-return-1b' });
  state.enemies = [
    {
      ...createEnemy('grok', 5, createSeededRng('door-return-1b')),
      currentRoom: ROOMS.RIGHT_DOOR,
      routeIndex: 6,
      side: 'right',
      doorAttackTimer: 0
    }
  ];
  state.doors.rightClosed = true;

  updateState(state, 0.05, silentAudio);

  assert.equal(state.enemies[0].currentRoom, ROOMS.CAM_1B_LOBBY);
  assert.equal(state.enemies[0].routeIndex, 1);
});

test('ChatGPT waits for the stage peers to leave before moving from CAM 1A', () => {
  const state = createInitialState();
  startRun(state, { seed: 'freddy-stage-wait' });
  state.currentMonth = 5;
  state.rng = alwaysSuccessRng;
  state.enemies = [
    {
      ...createEnemy('chatgpt', 5, createSeededRng('freddy-stage-wait-chatgpt')),
      actionCooldown: 0.1,
      aiLevelsByMonthPhase: { 5: [20, 20, 20, 20, 20, 20] }
    },
    {
      ...createEnemy('gemini', 5, createSeededRng('freddy-stage-wait-gemini')),
      currentRoom: ROOMS.CAM_1A_STAGE
    }
  ];

  tick(state, 6, 0.5);

  assert.equal(state.enemies[0].currentRoom, ROOMS.CAM_1A_STAGE);
});

test('ChatGPT movement opportunities only roll while the camera is down', () => {
  const state = createInitialState();
  startRun(state, { seed: 'freddy-camera-down-only' });
  state.currentMonth = 5;
  state.screen = STATES.CCTV;
  state.cameraOpen = true;
  state.selectedCameraIndex = state.cameras.indexOf(ROOMS.CAM_1B_LOBBY);
  state.rng = alwaysSuccessRng;
  state.enemies = [
    {
      ...createEnemy('chatgpt', 5, createSeededRng('freddy-camera-down-only')),
      actionCooldown: 0.1,
      aiLevelsByMonthPhase: { 5: [20, 20, 20, 20, 20, 20] }
    }
  ];

  tick(state, 6, 0.5);

  assert.equal(state.enemies[0].currentRoom, ROOMS.CAM_1A_STAGE);
});

test('ChatGPT successful movement rolls wait out the Freddy delay before moving', () => {
  const state = createInitialState();
  startRun(state, { seed: 'freddy-delay' });
  state.currentMonth = 5;
  state.rng = alwaysSuccessRng;
  state.enemies = [
    {
      ...createEnemy('chatgpt', 5, createSeededRng('freddy-delay')),
      currentRoom: ROOMS.CAM_1B_LOBBY,
      routeIndex: 1,
      actionCooldown: 0.1,
      aiLevelsByMonthPhase: { 5: [8, 8, 8, 8, 8, 8] }
    }
  ];

  tick(state, 0.5, 0.1);
  assert.equal(state.enemies[0].currentRoom, ROOMS.CAM_1B_LOBBY);
  assert.ok(state.enemies[0].freddyMovePending);

  tick(state, 3.2, 0.1);
  assert.equal(state.enemies[0].currentRoom, ROOMS.CAM_7_RESTROOMS);
});

test('ChatGPT cannot enter from CAM 4B until the camera is raised and returns to CAM 4A when blocked', () => {
  const state = createInitialState();
  startRun(state, { seed: 'freddy-4b-camera-gate' });
  state.currentMonth = 5;
  state.rng = alwaysSuccessRng;
  state.enemies = [
    {
      ...createEnemy('chatgpt', 5, createSeededRng('freddy-4b-camera-gate')),
      currentRoom: ROOMS.CAM_4B_RIGHT_HALL_NEAR,
      routeIndex: 5,
      actionCooldown: 0.1,
      aiLevelsByMonthPhase: { 5: [20, 20, 20, 20, 20, 20] }
    }
  ];

  tick(state, 6, 0.5);
  assert.equal(state.enemies[0].currentRoom, ROOMS.CAM_4B_RIGHT_HALL_NEAR);

  state.screen = STATES.CCTV;
  state.cameraOpen = true;
  state.selectedCameraIndex = state.cameras.indexOf(ROOMS.CAM_1B_LOBBY);
  tick(state, 0.5, 0.5);
  assert.equal(state.enemies[0].currentRoom, ROOMS.RIGHT_DOOR);

  state.doors.rightClosed = true;
  tick(state, 1.5, 0.1);
  assert.equal(state.enemies[0].currentRoom, ROOMS.CAM_4A_RIGHT_HALL_FAR);
  assert.equal(state.enemies[0].routeIndex, 4);
});

test('Claude sprint continues even while the left hallway camera is watched', () => {
  const state = createInitialState();
  startRun(state, { seed: 'claude-sprint' });
  const claude = {
    ...createEnemy('claude', 5, createSeededRng('claude-sprint')),
    currentRoom: ROOMS.CAM_2A_LEFT_HALL_FAR,
    visualState: 'SPRINTING_LEFT_HALL',
    sprintStep: 0,
    sprintTimer: 0.1
  };
  state.currentMonth = 5;
  state.screen = STATES.CCTV;
  state.cameraOpen = true;
  state.selectedCameraIndex = state.cameras.indexOf(ROOMS.CAM_2A_LEFT_HALL_FAR);
  state.enemies = [claude];

  tick(state, 1.5, 0.1);

  assert.notEqual(state.enemies[0].currentRoom, ROOMS.CAM_2A_LEFT_HALL_FAR);
});

test('Claude stage interval pauses on CAM 1C without growing extra cooldown', () => {
  const state = createInitialState();
  startRun(state, { seed: 'foxy-1c-pause' });
  state.currentMonth = 5;
  state.screen = STATES.CCTV;
  state.cameraOpen = true;
  state.selectedCameraIndex = state.cameras.indexOf(ROOMS.CAM_1C_CLAUDE_CLOSET);
  state.enemies = [
    {
      ...createEnemy('claude', 5, createSeededRng('foxy-1c-pause')),
      actionCooldown: 1,
      aiLevelsByMonthPhase: { 5: [20, 20, 20, 20, 20, 20] }
    }
  ];

  tick(state, 5, 0.5);

  assert.equal(state.enemies[0].visualState, 'CLOSET_STAGE_0');
  assert.equal(state.enemies[0].actionCooldown, 1);
});

test('Claude cannot advance stages while any CCTV camera is raised', () => {
  const state = createInitialState();
  startRun(state, { seed: 'foxy-other-camera-hold' });
  state.currentMonth = 5;
  state.screen = STATES.CCTV;
  state.cameraOpen = true;
  state.selectedCameraIndex = state.cameras.indexOf(ROOMS.CAM_1A_STAGE);
  state.rng = alwaysSuccessRng;
  state.enemies = [
    {
      ...createEnemy('claude', 5, createSeededRng('foxy-other-camera-hold')),
      actionCooldown: 0.1,
      aiLevelsByMonthPhase: { 5: [20, 20, 20, 20, 20, 20] }
    }
  ];

  tick(state, 6, 0.5);

  assert.equal(state.enemies[0].visualState, 'CLOSET_STAGE_0');
});

test('Claude waits after CCTV is lowered before taking another stage action', () => {
  const state = createInitialState();
  startRun(state, { seed: 'foxy-camera-drop-delay' });
  state.currentMonth = 5;
  state.rng = alwaysSuccessRng;
  state.enemies = [
    {
      ...createEnemy('claude', 5, createSeededRng('foxy-camera-drop-delay')),
      actionCooldown: 0,
      cameraDropFreezeTimer: 0.83,
      aiLevelsByMonthPhase: { 5: [20, 20, 20, 20, 20, 20] }
    }
  ];

  tick(state, 0.5, 0.1);
  assert.equal(state.enemies[0].visualState, 'CLOSET_STAGE_0');

  tick(state, 0.5, 0.1);
  assert.equal(state.enemies[0].visualState, 'CLOSET_STAGE_1');
});

test('left light reveals a door enemy and closed door repels it', () => {
  const state = createInitialState();
  startRun(state, { seed: 'light-reveal' });
  state.enemies = [
    {
      ...createEnemy('gemini', 2, createSeededRng('light-reveal')),
      currentRoom: ROOMS.LEFT_DOOR,
      routeIndex: 6,
      side: 'left',
      doorAttackTimer: 0.4
    }
  ];

  toggleLight(state, 'left');
  assert.deepEqual(state.visibleDoorThreats.left.map((enemy) => enemy.id), ['gemini']);
  toggleDoor(state, 'left');
  tick(state, 1, 0.1);

  assert.equal(state.screen, STATES.OFFICE);
  assert.equal(state.stats.successfulDoorBlocks, 1);
  assert.notEqual(state.enemies[0].currentRoom, ROOMS.LEFT_DOOR);
});

test('open door attack flows through fakeout, jumpscare, and invoice score', () => {
  const state = createInitialState();
  startRun(state, { seed: 'invoice' });
  state.stageTokenResults = [80.1, 70.2];
  state.currentMonth = 3;
  state.elapsed = MONTH_LENGTH_SECONDS / 2;
  state.tokens = 50;
  state.enemies = [
    {
      ...createEnemy('grok', 3, createSeededRng('invoice')),
      currentRoom: ROOMS.RIGHT_DOOR,
      routeIndex: 6,
      side: 'right',
      doorAttackTimer: 0
    }
  ];

  updateState(state, 0.05, silentAudio);
  assert.equal(state.screen, STATES.GAME_OVER_FAKEOUT);
  assert.equal(state.defeatedBy, 'Grok Doll');

  updateState(state, 1.1, silentAudio);
  assert.equal(state.screen, STATES.JUMPSCARE);

  updateState(state, 1.4, silentAudio);
  assert.equal(state.screen, STATES.GAME_OVER);
  assert.equal(state.invoice.plan, 'Grok Heavy $300');
  assert.equal(state.finalScore, 175.3);
});

test('token depletion disables systems and can trigger subscription blackout', () => {
  const state = createInitialState();
  startRun(state, { seed: 'tokens-out' });
  toggleCamera(state);
  state.doors.leftClosed = true;
  state.doors.rightClosed = true;
  state.lights.leftOn = true;
  state.tokens = 0.01;

  updateState(state, 1, silentAudio);

  assert.equal(state.tokens, 0);
  assert.equal(state.screen, STATES.OFFICE);
  assert.equal(state.doors.leftClosed, false);
  assert.equal(state.doors.rightClosed, false);
  assert.equal(state.lights.leftOn, false);
  assert.equal(state.doors.lockedByTokenOut, true);
  assert.equal(state.stats.tokenOut, true);

  state.tokenOutDelay = 0.01;
  updateState(state, 0.02, silentAudio);
  assert.equal(state.screen, STATES.GAME_OVER_FAKEOUT);
  assert.equal(state.defeatedBy, '토큰 소진');
});

test('surviving five months records token results and reaches final clear', () => {
  const state = createInitialState();
  startRun(state, { seed: 'clear-five' });

  for (let month = 1; month <= 5; month += 1) {
    state.tokens = 80 + month / 10;
    state.elapsed = MONTH_LENGTH_SECONDS;
    updateState(state, 0.1, silentAudio);
    if (month < 5) {
      assert.equal(state.screen, STATES.NIGHT_CLEAR);
      assert.equal(state.stageTokenResults[month - 1], 80 + month / 10);
      advanceAfterClear(state);
      assert.equal(state.currentMonth, month + 1);
    }
  }

  assert.equal(state.screen, STATES.FINAL_CLEAR);
  assert.equal(state.completedMonths, 5);
  assert.equal(state.stageTokenResults.length, 5);
  assert.equal(state.finalScore, 401.5);
});
