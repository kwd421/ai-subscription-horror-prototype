import {
  CAMERAS,
  NIGHT_LENGTH_SECONDS,
  getAttackWindow,
  getClockLabel,
  getNightLabel
} from './constants.js';
import {
  NIGHT_RULES,
  createNightEnemies,
  handleAttackResolution,
  tickEnemy
} from './enemies.js';
import { createSeededRng } from './rng.js';
import { calculateNightScore, calculatePartialScore, sumScores } from './score.js';

export const STATES = Object.freeze({
  TITLE: 'TITLE',
  HOW_TO_PLAY: 'HOW_TO_PLAY',
  OFFICE: 'OFFICE',
  CCTV: 'CCTV',
  NIGHT_CLEAR: 'NIGHT_CLEAR',
  GAME_OVER_FAKEOUT: 'GAME_OVER_FAKEOUT',
  JUMPSCARE: 'JUMPSCARE',
  GAME_OVER: 'GAME_OVER',
  FINAL_CLEAR: 'FINAL_CLEAR'
});

const BASE_POWER_DRAIN = 0.15;
const CCTV_POWER_DRAIN = 0.34;
const DOOR_POWER_DRAIN = 0.39;
const SURGE_POWER_DRAIN = 0.14;

export function createInitialState() {
  return {
    screen: STATES.TITLE,
    currentNight: 1,
    completedNights: 0,
    nightScores: [],
    lastNightScore: 0,
    power: 100,
    elapsed: 0,
    selectedCameraIndex: 0,
    cameraOpen: false,
    doors: {
      leftClosed: false,
      rightClosed: false,
      lockedByPowerOut: false
    },
    enemies: [],
    rng: createSeededRng('title'),
    stats: emptyStats(),
    defeatedBy: '',
    defeatedId: '',
    gameOverScore: 0,
    fakeoutTimer: 0,
    jumpscareTimer: 0,
    clearTimer: 0,
    powerOutDelay: null,
    lowPowerBeepCooldown: 0,
    blackoutTimer: 0,
    blackoutsUsed: 0,
    nextBlackoutAt: null,
    surgeTimer: 0,
    surgeDone: false,
    paywallTimer: 0,
    paywallShown: false,
    staticBurst: 0,
    screenShake: 0,
    reduceMotion: false,
    muted: false,
    ui: []
  };
}

function emptyStats() {
  return {
    successfulDoorBlocks: 0,
    cameraUseSeconds: 0,
    doorClosedSeconds: 0,
    powerOut: false
  };
}

export function startRun(state) {
  state.currentNight = 1;
  state.completedNights = 0;
  state.nightScores = [];
  state.lastNightScore = 0;
  startNight(state, 1);
}

export function startNight(state, night) {
  const seed = `night-${night}-subscription-${state.nightScores.join('-')}`;
  state.screen = STATES.OFFICE;
  state.currentNight = night;
  state.power = 100;
  state.elapsed = 0;
  state.selectedCameraIndex = 0;
  state.cameraOpen = false;
  state.doors = {
    leftClosed: false,
    rightClosed: false,
    lockedByPowerOut: false
  };
  state.rng = createSeededRng(seed);
  state.enemies = createNightEnemies(night, state.rng);
  state.stats = emptyStats();
  state.defeatedBy = '';
  state.defeatedId = '';
  state.gameOverScore = 0;
  state.fakeoutTimer = 0;
  state.jumpscareTimer = 0;
  state.clearTimer = 0;
  state.powerOutDelay = null;
  state.lowPowerBeepCooldown = 0;
  state.blackoutTimer = 0;
  state.blackoutsUsed = 0;
  state.nextBlackoutAt = night >= 4 ? state.rng.range(22, 40) : null;
  state.surgeTimer = 0;
  state.surgeDone = false;
  state.paywallTimer = 0;
  state.paywallShown = false;
  state.staticBurst = 0.4;
  state.screenShake = 0;
}

export function advanceAfterClear(state) {
  if (state.currentNight >= 5) {
    state.screen = STATES.FINAL_CLEAR;
    return;
  }
  startNight(state, state.currentNight + 1);
}

export function toggleCamera(state) {
  if (![STATES.OFFICE, STATES.CCTV].includes(state.screen)) return false;
  if (state.doors.lockedByPowerOut || state.power <= 0) return false;
  state.cameraOpen = !state.cameraOpen;
  state.screen = state.cameraOpen ? STATES.CCTV : STATES.OFFICE;
  state.staticBurst = Math.max(state.staticBurst, 0.22);
  return true;
}

export function closeCamera(state) {
  if (state.screen === STATES.CCTV) {
    state.cameraOpen = false;
    state.screen = STATES.OFFICE;
  }
}

export function switchCamera(state, direction) {
  if (state.screen !== STATES.CCTV) return false;
  state.selectedCameraIndex = (state.selectedCameraIndex + direction + CAMERAS.length) % CAMERAS.length;
  state.staticBurst = Math.max(state.staticBurst, 0.32);
  return true;
}

export function toggleDoor(state, side) {
  if (![STATES.OFFICE, STATES.CCTV].includes(state.screen)) return false;
  if (state.doors.lockedByPowerOut) return false;
  const key = side === 'left' ? 'leftClosed' : 'rightClosed';
  state.doors[key] = !state.doors[key];
  state.screenShake = Math.max(state.screenShake, 0.05);
  return true;
}

export function updateState(state, dt, audio) {
  state.ui = [];
  state.staticBurst = Math.max(0, state.staticBurst - dt);
  state.screenShake = Math.max(0, state.screenShake - dt);

  if (state.screen === STATES.GAME_OVER_FAKEOUT) {
    state.fakeoutTimer -= dt;
    if (state.fakeoutTimer <= 0) {
      state.screen = STATES.JUMPSCARE;
      state.jumpscareTimer = 1.05;
      state.screenShake = 0.8;
      audio?.scare();
    }
    return;
  }

  if (state.screen === STATES.JUMPSCARE) {
    state.jumpscareTimer -= dt;
    state.screenShake = Math.max(state.screenShake, 0.18);
    if (state.jumpscareTimer <= 0) {
      finishGameOver(state);
    }
    return;
  }

  if (![STATES.OFFICE, STATES.CCTV].includes(state.screen)) return;

  state.elapsed += dt;
  state.lowPowerBeepCooldown = Math.max(0, state.lowPowerBeepCooldown - dt);
  if (state.screen === STATES.CCTV) state.stats.cameraUseSeconds += dt;
  if (state.doors.leftClosed) state.stats.doorClosedSeconds += dt;
  if (state.doors.rightClosed) state.stats.doorClosedSeconds += dt;

  updateNightEvents(state, dt, audio);
  drainPower(state, dt, audio);

  if (state.elapsed >= NIGHT_LENGTH_SECONDS) {
    clearNight(state, audio);
    return;
  }

  if (state.power <= 0) {
    updatePowerOut(state, dt);
    return;
  }

  tickEnemies(state, dt, audio);
}

function updateNightEvents(state, dt, audio) {
  const rules = NIGHT_RULES[state.currentNight] ?? NIGHT_RULES[5];
  if (state.blackoutTimer > 0) {
    state.blackoutTimer = Math.max(0, state.blackoutTimer - dt);
    state.staticBurst = Math.max(state.staticBurst, 0.2);
  }
  if (
    state.nextBlackoutAt !== null &&
    state.elapsed >= state.nextBlackoutAt &&
    state.blackoutsUsed < rules.blackouts
  ) {
    state.blackoutTimer = 1.5;
    state.blackoutsUsed += 1;
    state.nextBlackoutAt = state.blackoutsUsed < rules.blackouts ? state.elapsed + state.rng.range(18, 28) : null;
    state.staticBurst = 1;
    audio?.staticBurst(0.35, 0.09);
  }

  if (rules.surgeAt && !state.surgeDone && state.elapsed >= rules.surgeAt) {
    state.surgeDone = true;
    state.surgeTimer = 15;
    state.paywallTimer = 3.8;
    state.paywallShown = true;
    state.staticBurst = 1;
    audio?.beep();
  }
  if (state.surgeTimer > 0) state.surgeTimer = Math.max(0, state.surgeTimer - dt);
  if (state.paywallTimer > 0) state.paywallTimer = Math.max(0, state.paywallTimer - dt);

  const claudeNear = state.enemies.some(
    (enemy) => enemy.id === 'claude' && ['LEFT_HALL_NEAR', 'RIGHT_HALL_NEAR'].includes(enemy.currentRoom)
  );
  if (state.currentNight >= 3 && claudeNear && !state.paywallShown) {
    state.paywallShown = true;
    state.paywallTimer = 2.6;
    audio?.staticBurst(0.2, 0.06);
  }
}

function drainPower(state, dt, audio) {
  if (state.power <= 0) return;
  const rules = NIGHT_RULES[state.currentNight] ?? NIGHT_RULES[5];
  let drain = BASE_POWER_DRAIN * rules.powerMultiplier;
  if (state.screen === STATES.CCTV) drain += CCTV_POWER_DRAIN;
  if (state.doors.leftClosed) drain += DOOR_POWER_DRAIN;
  if (state.doors.rightClosed) drain += DOOR_POWER_DRAIN;
  if (state.surgeTimer > 0) drain += SURGE_POWER_DRAIN;
  state.power = Math.max(0, state.power - drain * dt);
  if (state.power <= 12 && state.lowPowerBeepCooldown <= 0) {
    state.lowPowerBeepCooldown = 4;
    audio?.beep();
  }
  if (state.power <= 0) {
    state.stats.powerOut = true;
    state.cameraOpen = false;
    state.screen = STATES.OFFICE;
    state.doors.leftClosed = false;
    state.doors.rightClosed = false;
    state.doors.lockedByPowerOut = true;
    state.powerOutDelay = state.rng.range(2.2, 5);
    state.staticBurst = 1;
    audio?.staticBurst(0.55, 0.11);
  }
}

function updatePowerOut(state, dt) {
  if (state.powerOutDelay === null) return;
  state.powerOutDelay -= dt;
  if (state.powerOutDelay <= 0 && state.elapsed < NIGHT_LENGTH_SECONDS) {
    const enemy = state.enemies.find((candidate) => candidate.active) ?? state.enemies[0];
    triggerFakeout(state, enemy?.id ?? 'claude', enemy?.displayName ?? 'Power Out');
  }
}

function tickEnemies(state, dt, audio) {
  const selectedCamera = CAMERAS[state.selectedCameraIndex];
  const updated = [];
  for (const enemy of state.enemies) {
    const next = tickEnemy(enemy, dt, {
      night: state.currentNight,
      cameraOpen: state.screen === STATES.CCTV,
      selectedCamera,
      rng: state.rng
    });

    if (next.currentRoom === 'OFFICE_LEFT_ATTACK' || next.currentRoom === 'OFFICE_RIGHT_ATTACK') {
      const result = handleAttackResolution(next, state.doors);
      if (result.outcome === 'repelled') {
        state.stats.successfulDoorBlocks += 1;
        state.staticBurst = Math.max(state.staticBurst, 0.7);
        state.screenShake = Math.max(state.screenShake, 0.18);
        audio?.thud();
        updated.push(result.enemy);
        continue;
      }
      updated.push(result.enemy);
      triggerFakeout(state, next.id, result.defeatedBy);
      break;
    }
    updated.push(next);
  }

  if ([STATES.OFFICE, STATES.CCTV].includes(state.screen)) {
    state.enemies = updated;
  }
}

function triggerFakeout(state, enemyId, defeatedBy) {
  state.cameraOpen = false;
  state.screen = STATES.GAME_OVER_FAKEOUT;
  state.fakeoutTimer = 1;
  state.defeatedId = enemyId;
  state.defeatedBy = defeatedBy;
  state.screenShake = 0;
}

function clearNight(state, audio) {
  state.cameraOpen = false;
  state.doors.leftClosed = false;
  state.doors.rightClosed = false;
  const nightScore = calculateNightScore({
    currentNight: state.currentNight,
    remainingPower: Math.floor(state.power),
    successfulDoorBlocks: state.stats.successfulDoorBlocks,
    cameraUseSeconds: state.stats.cameraUseSeconds,
    doorClosedSeconds: state.stats.doorClosedSeconds
  });
  state.lastNightScore = nightScore;
  state.nightScores[state.currentNight - 1] = nightScore;
  state.completedNights = Math.max(state.completedNights, state.currentNight);
  state.screen = state.currentNight >= 5 ? STATES.FINAL_CLEAR : STATES.NIGHT_CLEAR;
  state.clearTimer = 1.2;
  state.staticBurst = 0.15;
  audio?.chime();
}

function finishGameOver(state) {
  state.gameOverScore = getFinalGameOverScore(state);
  state.screen = STATES.GAME_OVER;
}

export function getFinalGameOverScore(state) {
  return sumScores(state.nightScores) + calculatePartialScore({
    completedNights: state.completedNights,
    survivedTimeRatio: Math.min(1, state.elapsed / NIGHT_LENGTH_SECONDS),
    remainingPower: Math.floor(state.power),
    successfulDoorBlocks: state.stats.successfulDoorBlocks
  });
}

export function getHudScore(state) {
  return sumScores(state.nightScores) + calculatePartialScore({
    completedNights: state.completedNights,
    survivedTimeRatio: Math.min(1, state.elapsed / NIGHT_LENGTH_SECONDS),
    remainingPower: Math.floor(state.power),
    successfulDoorBlocks: state.stats.successfulDoorBlocks
  });
}

export function getSelectedCamera(state) {
  return CAMERAS[state.selectedCameraIndex];
}

export function getRuntimeLabels(state) {
  return {
    night: getNightLabel(state.currentNight),
    clock: getClockLabel(state.elapsed),
    attackWindow: getAttackWindow(state.currentNight)
  };
}
