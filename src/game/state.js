import {
  CAMERAS,
  INVOICE_PLANS,
  MONTH_COUNT,
  MONTH_LENGTH_SECONDS,
  ROOMS,
  getMonthLabel,
  getPhaseIndex,
  getPhaseLabel,
  getProgressRatio
} from './constants.js';
import {
  createMonthEnemies,
  resolveDoorAttack,
  sideForRoom,
  tickEnemy
} from './enemies.js';
import { createRuntimeRng, createSeededRng } from './rng.js';
import {
  calculateFinalTokenScore,
  calculateGameOverTokenScore,
  calculateMonthTokenScore
} from './score.js';

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

const TOKEN_COUNTER_MAX = 999;
const TOKEN_DISPLAY_DIVISOR = 10;
const PASSIVE_TOKEN_DRAIN_INTERVALS = Object.freeze({ 2: 6, 3: 5, 4: 4, 5: 3 });
const TITLE_GLITCH_MIN_DELAY = 10;
const TITLE_GLITCH_MAX_DELAY = 20;
const TITLE_GLITCH_MIN_DURATION = 0.2;
const TITLE_GLITCH_MAX_DURATION = 0.5;

export function createInitialState() {
  const rng = createSeededRng('title');
  return {
    screen: STATES.TITLE,
    currentMonth: 1,
    completedMonths: 0,
    stageTokenResults: [],
    lastMonthTokenScore: 0,
    tokenUnits: TOKEN_COUNTER_MAX,
    tokens: tokenPercentFromUnits(TOKEN_COUNTER_MAX),
    tokenDrainAccumulator: 0,
    passiveTokenDrainAccumulator: 0,
    elapsed: 0,
    cameras: [...CAMERAS],
    selectedCameraIndex: 0,
    cameraOpen: false,
    doors: {
      leftClosed: false,
      rightClosed: false,
      lockedByTokenOut: false
    },
    lights: {
      leftOn: false,
      rightOn: false
    },
    visibleDoorThreats: {
      left: [],
      right: []
    },
    enemies: [],
    rng,
    stats: emptyStats(),
    defeatedBy: '',
    defeatedId: '',
    invoice: null,
    failedMonthTokenScore: 0,
    partialFailedMonthScore: 0,
    finalScore: 0,
    fakeoutTimer: 0,
    jumpscareTimer: 0,
    clearTimer: 0,
    tokenOutDelay: null,
    lowTokenBeepCooldown: 0,
    paywallTimer: 0,
    staticBurst: 0,
    screenShake: 0,
    panicTimer: 0,
    reduceMotion: false,
    muted: false,
    approachLog: [],
    titleGlitch: createTitleGlitch(rng),
    ui: []
  };
}

function emptyStats() {
  return {
    successfulDoorBlocks: 0,
    cctvUseSeconds: 0,
    doorClosedSeconds: 0,
    lightUseSeconds: 0,
    tokenOut: false
  };
}

export function startRun(state, options = {}) {
  state.currentMonth = 1;
  state.completedMonths = 0;
  state.stageTokenResults = [];
  state.lastMonthTokenScore = 0;
  state.finalScore = 0;
  startMonth(state, 1, options);
}

export function startMonth(state, month, options = {}) {
  const rng = options.rng ?? (options.seed === undefined ? createRuntimeRng() : createSeededRng(options.seed));
  state.screen = STATES.OFFICE;
  state.currentMonth = month;
  state.tokenUnits = TOKEN_COUNTER_MAX;
  state.tokens = tokenPercentFromUnits(TOKEN_COUNTER_MAX);
  state.tokenDrainAccumulator = 0;
  state.passiveTokenDrainAccumulator = 0;
  state.elapsed = 0;
  state.selectedCameraIndex = 0;
  state.cameraOpen = false;
  state.doors = {
    leftClosed: false,
    rightClosed: false,
    lockedByTokenOut: false
  };
  state.lights = {
    leftOn: false,
    rightOn: false
  };
  state.visibleDoorThreats = { left: [], right: [] };
  state.rng = rng;
  state.enemies = createMonthEnemies(month, rng);
  state.stats = emptyStats();
  state.defeatedBy = '';
  state.defeatedId = '';
  state.invoice = null;
  state.failedMonthTokenScore = 0;
  state.partialFailedMonthScore = 0;
  state.finalScore = 0;
  state.fakeoutTimer = 0;
  state.jumpscareTimer = 0;
  state.clearTimer = 0;
  state.tokenOutDelay = null;
  state.lowTokenBeepCooldown = 0;
  state.paywallTimer = 0;
  state.staticBurst = 0.4;
  state.screenShake = 0;
  state.panicTimer = 0;
  state.approachLog = [];
}

export function advanceAfterClear(state) {
  if (state.currentMonth >= MONTH_COUNT) {
    state.screen = STATES.FINAL_CLEAR;
    state.finalScore = calculateFinalTokenScore(state.stageTokenResults);
    return;
  }
  startMonth(state, state.currentMonth + 1);
}

export function toggleCamera(state) {
  if (![STATES.OFFICE, STATES.CCTV].includes(state.screen)) return false;
  if (state.doors.lockedByTokenOut || state.tokens <= 0) return false;
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
  state.selectedCameraIndex = (state.selectedCameraIndex + direction + state.cameras.length) % state.cameras.length;
  state.staticBurst = Math.max(state.staticBurst, 0.3);
  return true;
}

export function selectCamera(state, camera) {
  if (state.screen !== STATES.CCTV) return false;
  const index = state.cameras.indexOf(camera);
  if (index < 0) return false;
  state.selectedCameraIndex = index;
  state.staticBurst = Math.max(state.staticBurst, 0.24);
  return true;
}

export function toggleDoor(state, side) {
  if (![STATES.OFFICE, STATES.CCTV].includes(state.screen)) return false;
  if (state.doors.lockedByTokenOut || hasEnteredOffice(state)) {
    state.panicTimer = 0.25;
    return false;
  }
  const key = side === 'left' ? 'leftClosed' : 'rightClosed';
  state.doors[key] = !state.doors[key];
  state.screenShake = Math.max(state.screenShake, 0.05);
  return true;
}

export function toggleLight(state, side) {
  if (![STATES.OFFICE, STATES.CCTV].includes(state.screen)) return false;
  if (state.doors.lockedByTokenOut || hasEnteredOffice(state)) {
    state.panicTimer = 0.25;
    return false;
  }
  const key = side === 'left' ? 'leftOn' : 'rightOn';
  state.lights[key] = !state.lights[key];
  refreshVisibleDoorThreats(state);
  return true;
}

export function updateState(state, dt, audio) {
  state.ui = [];
  state.staticBurst = Math.max(0, state.staticBurst - dt);
  state.screenShake = Math.max(0, state.screenShake - dt);
  state.panicTimer = Math.max(0, state.panicTimer - dt);

  if (state.screen === STATES.TITLE) {
    updateTitleGlitch(state, dt);
    return;
  }

  if (state.screen === STATES.GAME_OVER_FAKEOUT) {
    state.fakeoutTimer -= dt;
    if (state.fakeoutTimer <= 0) {
      state.screen = STATES.JUMPSCARE;
      state.jumpscareTimer = 1.25;
      state.screenShake = 0.9;
      audio?.scare?.();
    }
    return;
  }

  if (state.screen === STATES.JUMPSCARE) {
    state.jumpscareTimer -= dt;
    state.screenShake = Math.max(state.screenShake, 0.25);
    if (state.jumpscareTimer <= 0) {
      finishGameOver(state);
    }
    return;
  }

  if (![STATES.OFFICE, STATES.CCTV].includes(state.screen)) return;

  state.elapsed += dt;
  if (state.elapsed >= MONTH_LENGTH_SECONDS) {
    clearMonth(state, audio);
    return;
  }

  state.lowTokenBeepCooldown = Math.max(0, state.lowTokenBeepCooldown - dt);
  if (state.screen === STATES.CCTV) state.stats.cctvUseSeconds += dt;
  if (state.doors.leftClosed) state.stats.doorClosedSeconds += dt;
  if (state.doors.rightClosed) state.stats.doorClosedSeconds += dt;
  if (state.lights.leftOn) state.stats.lightUseSeconds += dt;
  if (state.lights.rightOn) state.stats.lightUseSeconds += dt;

  drainTokens(state, dt, audio);
  refreshVisibleDoorThreats(state);

  if (state.tokens <= 0) {
    updateTokenOut(state, dt);
    return;
  }

  tickEnemies(state, dt, audio);
  refreshVisibleDoorThreats(state);
}

function createTitleGlitch(rng) {
  return {
    nextIn: rng.range(TITLE_GLITCH_MIN_DELAY, TITLE_GLITCH_MAX_DELAY),
    flashTimer: 0
  };
}

function updateTitleGlitch(state, dt) {
  if (!state.titleGlitch) state.titleGlitch = createTitleGlitch(state.rng);
  if (state.titleGlitch.flashTimer > 0) {
    state.titleGlitch.flashTimer = Math.max(0, state.titleGlitch.flashTimer - dt);
    return;
  }

  state.titleGlitch.nextIn -= dt;
  if (state.titleGlitch.nextIn <= 0) {
    state.titleGlitch.flashTimer = state.rng.range(TITLE_GLITCH_MIN_DURATION, TITLE_GLITCH_MAX_DURATION);
    state.titleGlitch.nextIn = state.rng.range(TITLE_GLITCH_MIN_DELAY, TITLE_GLITCH_MAX_DELAY);
    state.staticBurst = Math.max(state.staticBurst, 0.75);
    state.screenShake = Math.max(state.screenShake, 0.12);
  }
}

function tokenPercentFromUnits(units) {
  return Number((Math.max(0, Math.min(TOKEN_COUNTER_MAX, units)) / TOKEN_DISPLAY_DIVISOR).toFixed(1));
}

function syncTokenUnitsFromDisplayedTokens(state) {
  const displayedUnits = Math.round(Math.max(0, Math.min(99.9, state.tokens)) * TOKEN_DISPLAY_DIVISOR);
  if (Math.abs(displayedUnits - state.tokenUnits) > 1) {
    state.tokenUnits = displayedUnits;
    state.tokenDrainAccumulator = 0;
    state.passiveTokenDrainAccumulator = 0;
  }
}

function getUsageBars(state) {
  let usage = 1;
  if (state.screen === STATES.CCTV) usage += 1;
  if (state.doors.leftClosed) usage += 1;
  if (state.doors.rightClosed) usage += 1;
  if (state.lights.leftOn) usage += 1;
  if (state.lights.rightOn) usage += 1;
  return usage;
}

function drainTokens(state, dt, audio) {
  if (state.tokens <= 0) return;
  syncTokenUnitsFromDisplayedTokens(state);

  state.tokenDrainAccumulator += dt;
  while (state.tokenDrainAccumulator >= 1 && state.tokenUnits > 0) {
    state.tokenUnits -= getUsageBars(state);
    state.tokenDrainAccumulator -= 1;
  }

  const passiveInterval = PASSIVE_TOKEN_DRAIN_INTERVALS[state.currentMonth];
  if (passiveInterval) {
    state.passiveTokenDrainAccumulator += dt;
    while (state.passiveTokenDrainAccumulator >= passiveInterval && state.tokenUnits > 0) {
      state.tokenUnits -= 1;
      state.passiveTokenDrainAccumulator -= passiveInterval;
    }
  }

  state.tokenUnits = Math.max(0, Math.min(TOKEN_COUNTER_MAX, Math.round(state.tokenUnits)));
  state.tokens = tokenPercentFromUnits(state.tokenUnits);
  if (state.tokens <= 12 && state.lowTokenBeepCooldown <= 0) {
    state.lowTokenBeepCooldown = 4;
    audio?.beep?.();
  }
  if (state.tokens <= 0) {
    state.tokenUnits = 0;
    state.stats.tokenOut = true;
    state.cameraOpen = false;
    state.screen = STATES.OFFICE;
    state.doors.leftClosed = false;
    state.doors.rightClosed = false;
    state.doors.lockedByTokenOut = true;
    state.lights.leftOn = false;
    state.lights.rightOn = false;
    state.tokenOutDelay = state.rng.range(2.2, 5);
    state.staticBurst = 1;
    audio?.staticBurst?.(0.55, 0.11);
  }
}

function updateTokenOut(state, dt) {
  if (state.tokenOutDelay === null) return;
  state.tokenOutDelay -= dt;
  if (state.tokenOutDelay <= 0 && state.elapsed < MONTH_LENGTH_SECONDS) {
    triggerFakeout(state, 'tokenOut', '토큰 소진');
  }
}

function tickEnemies(state, dt, audio) {
  const selectedCamera = getSelectedCamera(state);
  const context = {
    month: state.currentMonth,
    elapsed: state.elapsed,
    phaseIndex: getPhaseIndex(state.elapsed),
    cameraOpen: state.screen === STATES.CCTV,
    selectedCamera,
    rng: state.rng
  };

  const updated = [];
  for (const enemy of state.enemies) {
    const result = tickEnemy(enemy, dt, context);
    let nextEnemy = result.enemy;
    for (const event of result.events) {
      if (event.type === 'approach') {
        state.approachLog.push({ id: event.id, side: event.side, room: event.room, at: state.elapsed });
      }
      if (event.type === 'doorAttack') {
        const resolution = resolveDoorAttack(nextEnemy, state.doors, state.rng);
        nextEnemy = resolution.enemy;
        if (resolution.outcome === 'repelled') {
          state.stats.successfulDoorBlocks += 1;
          if (resolution.tokenPenalty) {
            state.tokens = Math.max(0, state.tokens - resolution.tokenPenalty);
            state.tokenUnits = Math.round(state.tokens * TOKEN_DISPLAY_DIVISOR);
          }
          state.staticBurst = Math.max(state.staticBurst, 0.75);
          state.screenShake = Math.max(state.screenShake, 0.3);
          audio?.thud?.();
        } else {
          updated.push(nextEnemy);
          triggerFakeout(state, resolution.defeatedId, resolution.defeatedBy);
          return;
        }
      }
    }
    updated.push(nextEnemy);
  }
  state.enemies = updated;
}

function triggerFakeout(state, defeatedId, defeatedBy) {
  state.cameraOpen = false;
  state.lights.leftOn = false;
  state.lights.rightOn = false;
  state.screen = STATES.GAME_OVER_FAKEOUT;
  state.fakeoutTimer = 0.9;
  state.defeatedId = defeatedId;
  state.defeatedBy = defeatedBy;
  state.screenShake = 0;
  state.failedMonthTokenScore = calculateMonthTokenScore(state.tokens);
  state.invoice = createInvoice(state);
}

function clearMonth(state, audio) {
  state.cameraOpen = false;
  state.doors.leftClosed = false;
  state.doors.rightClosed = false;
  state.lights.leftOn = false;
  state.lights.rightOn = false;
  const tokenScore = calculateMonthTokenScore(state.tokens);
  state.lastMonthTokenScore = tokenScore;
  state.stageTokenResults[state.currentMonth - 1] = tokenScore;
  state.completedMonths = Math.max(state.completedMonths, state.currentMonth);
  state.screen = state.currentMonth >= MONTH_COUNT ? STATES.FINAL_CLEAR : STATES.NIGHT_CLEAR;
  state.clearTimer = 1.2;
  state.staticBurst = 0.15;
  state.finalScore = state.currentMonth >= MONTH_COUNT ? calculateFinalTokenScore(state.stageTokenResults) : 0;
  audio?.chime?.();
}

function finishGameOver(state) {
  const survivedRatio = getProgressRatio(state.elapsed);
  const score = calculateGameOverTokenScore({
    clearedTokenResults: state.stageTokenResults,
    failedMonthTokens: state.tokens,
    survivedRatio
  });
  state.partialFailedMonthScore = score.partialFailedMonthScore;
  state.finalScore = score.finalScore;
  state.invoice = createInvoice(state);
  state.screen = STATES.GAME_OVER;
}

function createInvoice(state) {
  const defeatedId = state.defeatedId || 'tokenOut';
  const survivedRatio = getProgressRatio(state.elapsed);
  const score = calculateGameOverTokenScore({
    clearedTokenResults: state.stageTokenResults,
    failedMonthTokens: state.tokens,
    survivedRatio
  });
  return {
    plan: INVOICE_PLANS[defeatedId] ?? INVOICE_PLANS.tokenOut,
    defeatedBy: state.defeatedBy || 'Unknown',
    reachedMonth: getMonthLabel(state.currentMonth),
    progressRatio: survivedRatio,
    failedMonthTokens: calculateMonthTokenScore(state.tokens),
    partialFailedMonthScore: score.partialFailedMonthScore,
    finalScore: score.finalScore,
    clearedTokenResults: [...state.stageTokenResults]
  };
}

function refreshVisibleDoorThreats(state) {
  state.visibleDoorThreats = {
    left: state.lights.leftOn
      ? state.enemies.filter((enemy) => enemy.currentRoom === ROOMS.LEFT_DOOR && enemy.id !== 'claude')
      : [],
    right: state.lights.rightOn
      ? state.enemies.filter((enemy) => enemy.currentRoom === ROOMS.RIGHT_DOOR && enemy.id !== 'claude')
      : []
  };
}

function hasEnteredOffice(state) {
  return state.enemies.some((enemy) => enemy.enteredOffice);
}

export function getSelectedCamera(state) {
  return state.cameras[state.selectedCameraIndex] ?? state.cameras[0];
}

export function getRuntimeLabels(state) {
  return {
    month: getMonthLabel(state.currentMonth),
    phase: getPhaseLabel(state.elapsed),
    progressRatio: getProgressRatio(state.elapsed),
    tokens: `${state.tokens.toFixed(1)}%`
  };
}

export function getDoorSideForEnemy(enemy) {
  return sideForRoom(enemy.currentRoom) ?? enemy.side;
}
