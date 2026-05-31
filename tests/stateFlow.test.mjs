import test from 'node:test';
import assert from 'node:assert/strict';

import { createEnemy } from '../src/game/enemies.js';
import { createSeededRng } from '../src/game/rng.js';
import {
  STATES,
  advanceAfterClear,
  createInitialState,
  getSelectedCamera,
  startRun,
  switchCamera,
  toggleCamera,
  toggleDoor,
  updateState
} from '../src/game/state.js';

const silentAudio = {
  beep() {},
  chime() {},
  click() {},
  scare() {},
  staticBurst() {},
  thud() {}
};

test('start run, CCTV, camera switching, and door toggles update state together', () => {
  const state = createInitialState();
  startRun(state);

  assert.equal(state.screen, STATES.OFFICE);
  assert.equal(state.currentNight, 1);
  assert.equal(state.power, 100);
  assert.equal(toggleCamera(state), true);
  assert.equal(state.screen, STATES.CCTV);
  assert.equal(getSelectedCamera(state), 'STAGE');
  assert.equal(switchCamera(state, 1), true);
  assert.equal(getSelectedCamera(state), 'LOBBY');
  assert.equal(toggleDoor(state, 'left'), true);
  assert.equal(toggleDoor(state, 'right'), true);
  assert.equal(state.doors.leftClosed, true);
  assert.equal(state.doors.rightClosed, true);
});

test('correct closed door repels an office attack and awards a block', () => {
  const state = createInitialState();
  startRun(state);
  state.doors.leftClosed = true;
  state.enemies = [
    {
      ...createEnemy('gemini', 1, createSeededRng(99)),
      active: true,
      currentRoom: 'OFFICE_LEFT_ATTACK',
      routeIndex: 4,
      side: 'left',
      attackTimer: 0,
      pose: 'running'
    }
  ];

  updateState(state, 0.05, silentAudio);

  assert.equal(state.screen, STATES.OFFICE);
  assert.equal(state.stats.successfulDoorBlocks, 1);
  assert.equal(state.enemies[0].currentRoom, 'LEFT_HALL_FAR');
});

test('open door attack flows through fakeout, jumpscare, and game over score', () => {
  const state = createInitialState();
  startRun(state);
  state.enemies = [
    {
      ...createEnemy('grok', 2, createSeededRng(100)),
      active: true,
      currentRoom: 'OFFICE_RIGHT_ATTACK',
      routeIndex: 4,
      side: 'right',
      attackTimer: 0,
      pose: 'running'
    }
  ];

  updateState(state, 0.05, silentAudio);
  assert.equal(state.screen, STATES.GAME_OVER_FAKEOUT);
  assert.equal(state.defeatedBy, 'Grok Doll');

  updateState(state, 1.1, silentAudio);
  assert.equal(state.screen, STATES.JUMPSCARE);

  updateState(state, 1.2, silentAudio);
  assert.equal(state.screen, STATES.GAME_OVER);
  assert.ok(state.gameOverScore > 0);
});

test('powerout opens and locks doors, then enters fakeout if 6 AM has not arrived', () => {
  const state = createInitialState();
  startRun(state);
  toggleCamera(state);
  state.doors.leftClosed = true;
  state.doors.rightClosed = true;
  state.power = 0.01;

  updateState(state, 1, silentAudio);

  assert.equal(state.power, 0);
  assert.equal(state.screen, STATES.OFFICE);
  assert.equal(state.doors.leftClosed, false);
  assert.equal(state.doors.rightClosed, false);
  assert.equal(state.doors.lockedByPowerOut, true);
  assert.equal(state.stats.powerOut, true);

  state.powerOutDelay = 0.01;
  updateState(state, 0.02, silentAudio);
  assert.equal(state.screen, STATES.GAME_OVER_FAKEOUT);
});

test('surviving five nights records every score and reaches final clear', () => {
  const state = createInitialState();
  startRun(state);

  for (let night = 1; night <= 5; night += 1) {
    state.elapsed = 90;
    updateState(state, 0.1, silentAudio);
    if (night < 5) {
      assert.equal(state.screen, STATES.NIGHT_CLEAR);
      assert.ok(state.nightScores[night - 1] > 0);
      advanceAfterClear(state);
      assert.equal(state.currentNight, night + 1);
    }
  }

  assert.equal(state.screen, STATES.FINAL_CLEAR);
  assert.equal(state.completedNights, 5);
  assert.equal(state.nightScores.length, 5);
  assert.ok(state.nightScores.every((score) => score > 0));
});
