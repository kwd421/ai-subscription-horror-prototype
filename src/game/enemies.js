import { INVOICE_PLANS, ROOMS, getPhaseIndex } from './constants.js';

export const AI_LEVELS = Object.freeze({
  chatgpt: {
    1: [0, 0, 0, 0, 0, 0],
    2: [0, 0, 0, 0, 0, 0],
    3: [1, 1, 1, 1, 1, 1],
    4: [2, 2, 2, 2, 2, 2],
    5: [3, 3, 3, 3, 3, 3]
  },
  gemini: {
    1: [0, 0, 1, 2, 3, 3],
    2: [3, 3, 4, 5, 6, 6],
    3: [0, 0, 1, 2, 3, 3],
    4: [2, 2, 3, 4, 5, 5],
    5: [5, 5, 6, 7, 8, 8]
  },
  grok: {
    1: [0, 0, 0, 1, 2, 2],
    2: [1, 1, 1, 2, 3, 3],
    3: [5, 5, 5, 6, 7, 7],
    4: [4, 4, 4, 5, 6, 6],
    5: [7, 7, 7, 8, 9, 9]
  },
  claude: {
    1: [0, 0, 0, 1, 2, 2],
    2: [1, 1, 1, 2, 3, 3],
    3: [2, 2, 2, 3, 4, 4],
    4: [6, 6, 6, 7, 8, 8],
    5: [5, 5, 5, 6, 7, 7]
  }
});

export const ENEMY_DEFS = Object.freeze({
  gemini: {
    id: 'gemini',
    displayName: 'Gemini Doll',
    billingPlan: INVOICE_PLANS.gemini,
    role: 'left-pressure',
    side: 'left',
    route: [
      ROOMS.CAM_1A_STAGE,
      ROOMS.CAM_1B_LOBBY,
      ROOMS.CAM_5_BACKSTAGE,
      ROOMS.CAM_3_SUPPLY_CLOSET,
      ROOMS.CAM_2A_LEFT_HALL_FAR,
      ROOMS.CAM_2B_LEFT_HALL_NEAR,
      ROOMS.LEFT_DOOR
    ],
    actionIntervalMin: 3,
    actionIntervalMax: 5
  },
  grok: {
    id: 'grok',
    displayName: 'Grok Doll',
    billingPlan: INVOICE_PLANS.grok,
    role: 'right-pressure',
    side: 'right',
    route: [
      ROOMS.CAM_1A_STAGE,
      ROOMS.CAM_1B_LOBBY,
      ROOMS.CAM_7_RESTROOMS,
      ROOMS.CAM_6_SERVER_KITCHEN,
      ROOMS.CAM_4A_RIGHT_HALL_FAR,
      ROOMS.CAM_4B_RIGHT_HALL_NEAR,
      ROOMS.RIGHT_DOOR
    ],
    actionIntervalMin: 2.6,
    actionIntervalMax: 4.7
  },
  chatgpt: {
    id: 'chatgpt',
    displayName: 'ChatGPT Doll',
    billingPlan: INVOICE_PLANS.chatgpt,
    role: 'stage-leader',
    side: 'right',
    route: [
      ROOMS.CAM_1A_STAGE,
      ROOMS.CAM_1B_LOBBY,
      ROOMS.CAM_7_RESTROOMS,
      ROOMS.CAM_6_SERVER_KITCHEN,
      ROOMS.CAM_4A_RIGHT_HALL_FAR,
      ROOMS.CAM_4B_RIGHT_HALL_NEAR,
      ROOMS.RIGHT_DOOR
    ],
    actionIntervalMin: 3,
    actionIntervalMax: 3
  },
  claude: {
    id: 'claude',
    displayName: 'Claude Doll',
    billingPlan: INVOICE_PLANS.claude,
    role: 'curtain-runner',
    side: 'left',
    route: [],
    actionIntervalMin: 3,
    actionIntervalMax: 5
  }
});

const DOOR_ATTACK_GRACE_SECONDS = 1.05;
const SPRINT_ROOMS = [
  ROOMS.CAM_2A_LEFT_HALL_FAR,
  ROOMS.CAM_2B_LEFT_HALL_NEAR,
  ROOMS.LEFT_DOOR
];

export function createEnemy(id, month, rng) {
  const def = ENEMY_DEFS[id];
  if (!def) throw new Error(`Unknown enemy: ${id}`);

  const enemy = {
    id,
    displayName: def.displayName,
    billingPlan: def.billingPlan,
    role: def.role,
    side: def.side,
    route: [...def.route],
    routeIndex: 0,
    currentRoom: id === 'claude' ? ROOMS.CAM_1C_CLAUDE_CLOSET : ROOMS.CAM_1A_STAGE,
    aiLevelsByMonthPhase: AI_LEVELS[id],
    actionCooldown: nextActionCooldown(def, rng),
    actionIntervalMin: def.actionIntervalMin,
    actionIntervalMax: def.actionIntervalMax,
    visualState: 'IDLE',
    enteredOffice: false,
    blockedCount: 0,
    approachLogged: false,
    lastWatchedAt: null,
    freezeAfterCameraCloseTimer: 0,
    pose: id === 'claude' ? 'closet_peek1' : 'idle_close',
    doorAttackTimer: null,
    active: true
  };

  if (id === 'claude') {
    enemy.visualState = 'CLOSET_STAGE_0';
    enemy.sprintStep = -1;
    enemy.sprintTimer = null;
    enemy.sprintArmedTimer = null;
  }

  return enemy;
}

export function createMonthEnemies(month, rng) {
  return Object.keys(ENEMY_DEFS).map((id) => createEnemy(id, month, rng));
}

export function tickEnemy(enemy, dt, context) {
  if (!enemy.active) return { enemy, events: [] };
  if (enemy.id === 'claude') return tickClaude(enemy, dt, context);
  return tickPathEnemy(enemy, dt, context);
}

export function resolveDoorAttack(enemy, doors, rng) {
  const closed = enemy.side === 'left' ? doors.leftClosed : doors.rightClosed;
  if (!closed) {
    return {
      outcome: 'breach',
      defeatedId: enemy.id,
      defeatedBy: enemy.displayName,
      enemy: { ...enemy, enteredOffice: true, pose: 'jumpscare' }
    };
  }

  if (enemy.id === 'claude') {
    const tokenPenalty = 1 + enemy.blockedCount * 4;
    return {
      outcome: 'repelled',
      tokenPenalty,
      enemy: {
        ...enemy,
        currentRoom: ROOMS.CAM_1C_CLAUDE_CLOSET,
        visualState: rng.chance(0.5) ? 'CLOSET_STAGE_0' : 'CLOSET_STAGE_1',
        sprintStep: -1,
        sprintTimer: null,
        sprintArmedTimer: null,
        blockedCount: enemy.blockedCount + 1,
        doorAttackTimer: null,
        pose: 'closet_peek1',
        actionCooldown: 5
      }
    };
  }

  const fallbackRoom = enemy.side === 'left' ? ROOMS.CAM_1B_LOBBY : ROOMS.CAM_6_SERVER_KITCHEN;
  const fallbackIndex = Math.max(1, enemy.route.indexOf(fallbackRoom));
  return {
    outcome: 'repelled',
    tokenPenalty: 0,
    enemy: {
      ...enemy,
      currentRoom: fallbackRoom,
      routeIndex: fallbackIndex,
      doorAttackTimer: null,
      pose: 'hallway_far',
      actionCooldown: 3 + enemy.blockedCount,
      blockedCount: enemy.blockedCount + 1
    }
  };
}

export function isDoorRoom(room) {
  return room === ROOMS.LEFT_DOOR || room === ROOMS.RIGHT_DOOR;
}

export function sideForRoom(room) {
  if ([ROOMS.CAM_3_SUPPLY_CLOSET, ROOMS.CAM_2A_LEFT_HALL_FAR, ROOMS.CAM_2B_LEFT_HALL_NEAR, ROOMS.LEFT_DOOR].includes(room)) return 'left';
  if ([ROOMS.CAM_7_RESTROOMS, ROOMS.CAM_6_SERVER_KITCHEN, ROOMS.CAM_4A_RIGHT_HALL_FAR, ROOMS.CAM_4B_RIGHT_HALL_NEAR, ROOMS.RIGHT_DOOR].includes(room)) return 'right';
  return null;
}

function tickPathEnemy(enemy, dt, context) {
  const watched = isWatched(enemy, context);
  if (watched) {
    return {
      enemy: {
        ...enemy,
        lastWatchedAt: context.elapsed,
        pose: 'camera_stare',
        freezeAfterCameraCloseTimer: 0.35 + Math.max(0, 5 - context.month) * 0.08
      },
      events: []
    };
  }

  if (enemy.freezeAfterCameraCloseTimer > 0) {
    return {
      enemy: {
        ...enemy,
        freezeAfterCameraCloseTimer: Math.max(0, enemy.freezeAfterCameraCloseTimer - dt)
      },
      events: []
    };
  }

  if (isDoorRoom(enemy.currentRoom)) {
    const doorAttackTimer = Math.max(0, (enemy.doorAttackTimer ?? DOOR_ATTACK_GRACE_SECONDS) - dt);
    if (doorAttackTimer > 0) return { enemy: { ...enemy, doorAttackTimer, pose: 'door_peek' }, events: [] };
    return { enemy: { ...enemy, doorAttackTimer: 0, pose: 'door_peek' }, events: [{ type: 'doorAttack', enemy }] };
  }

  const actionCooldown = enemy.actionCooldown - dt;
  if (actionCooldown > 0) return { enemy: { ...enemy, actionCooldown }, events: [] };

  const acted = rollAction(enemy, context);
  const base = {
    ...enemy,
    actionCooldown: nextActionCooldown(enemy, context.rng)
  };
  if (!acted) return { enemy: base, events: [] };

  const moved = advancePathEnemy(base, context);
  const events = [];
  const side = sideForRoom(moved.currentRoom);
  if (side && !enemy.approachLogged) {
    events.push({ type: 'approach', id: moved.id, side, room: moved.currentRoom });
    moved.approachLogged = true;
  }
  return { enemy: moved, events };
}

function tickClaude(enemy, dt, context) {
  if (enemy.visualState === 'SPRINTING_LEFT_HALL') {
    const sprintTimer = Math.max(0, (enemy.sprintTimer ?? 0.45) - dt);
    if (sprintTimer > 0) return { enemy: { ...enemy, sprintTimer, pose: sprintPose(enemy.sprintStep) }, events: [] };
    const nextStep = Math.min(SPRINT_ROOMS.length - 1, (enemy.sprintStep ?? 0) + 1);
    const currentRoom = SPRINT_ROOMS[nextStep];
    if (currentRoom === ROOMS.LEFT_DOOR) {
      return {
        enemy: {
          ...enemy,
          currentRoom,
          sprintStep: nextStep,
          sprintTimer: null,
          visualState: 'AT_LEFT_DOOR',
          doorAttackTimer: 0.25,
          pose: 'door_bang',
          approachLogged: true
        },
        events: enemy.approachLogged ? [] : [{ type: 'approach', id: enemy.id, side: 'left', room: currentRoom }]
      };
    }
    return {
      enemy: {
        ...enemy,
        currentRoom,
        sprintStep: nextStep,
        sprintTimer: 0.38,
        pose: sprintPose(nextStep),
        approachLogged: true
      },
      events: enemy.approachLogged ? [] : [{ type: 'approach', id: enemy.id, side: 'left', room: currentRoom }]
    };
  }

  if (enemy.visualState === 'AT_LEFT_DOOR' || enemy.currentRoom === ROOMS.LEFT_DOOR) {
    const doorAttackTimer = Math.max(0, (enemy.doorAttackTimer ?? 0.25) - dt);
    if (doorAttackTimer > 0) return { enemy: { ...enemy, doorAttackTimer, pose: 'door_bang' }, events: [] };
    return { enemy: { ...enemy, doorAttackTimer: 0, pose: 'door_bang' }, events: [{ type: 'doorAttack', enemy }] };
  }

  if (enemy.visualState === 'SPRINT_ARMED') {
    const watchedLeftHall = context.cameraOpen && [
      ROOMS.CAM_2A_LEFT_HALL_FAR,
      ROOMS.CAM_2B_LEFT_HALL_NEAR
    ].includes(context.selectedCamera);
    const sprintArmedTimer = Math.max(0, (enemy.sprintArmedTimer ?? 25) - dt);
    if (!watchedLeftHall && sprintArmedTimer > 0) return { enemy: { ...enemy, sprintArmedTimer }, events: [] };
    return {
      enemy: {
        ...enemy,
        currentRoom: ROOMS.CAM_2A_LEFT_HALL_FAR,
        visualState: 'SPRINTING_LEFT_HALL',
        sprintStep: 0,
        sprintTimer: 0.42,
        pose: 'sprint_01',
        approachLogged: true
      },
      events: enemy.approachLogged ? [] : [{ type: 'approach', id: enemy.id, side: 'left', room: ROOMS.CAM_2A_LEFT_HALL_FAR }]
    };
  }

  const exactClosetWatch = context.cameraOpen && context.selectedCamera === ROOMS.CAM_1C_CLAUDE_CLOSET;
  const cctvSlow = context.cameraOpen ? 0.32 : 1;
  if (exactClosetWatch) {
    return {
      enemy: {
        ...enemy,
        lastWatchedAt: context.elapsed,
        pose: poseForClaudeStage(enemy.visualState),
        actionCooldown: enemy.actionCooldown + dt * 0.2
      },
      events: []
    };
  }

  const actionCooldown = enemy.actionCooldown - dt * cctvSlow;
  if (actionCooldown > 0) return { enemy: { ...enemy, actionCooldown }, events: [] };

  const acted = rollAction(enemy, context);
  const base = {
    ...enemy,
    actionCooldown: nextActionCooldown(enemy, context.rng)
  };
  if (!acted) return { enemy: base, events: [] };

  const nextState = nextClaudeClosetState(enemy.visualState);
  if (nextState === 'SPRINT_ARMED') {
    return {
      enemy: {
        ...base,
        visualState: nextState,
        pose: 'closet_out',
        sprintArmedTimer: 25,
        currentRoom: ROOMS.CAM_1C_CLAUDE_CLOSET
      },
      events: []
    };
  }

  return {
    enemy: {
      ...base,
      visualState: nextState,
      pose: poseForClaudeStage(nextState),
      currentRoom: ROOMS.CAM_1C_CLAUDE_CLOSET
    },
    events: []
  };
}

function advancePathEnemy(enemy, context) {
  let routeIndex = Math.min(enemy.route.length - 1, enemy.routeIndex + 1);
  if (
    enemy.id === 'gemini' &&
    context.month >= 4 &&
    enemy.currentRoom === ROOMS.CAM_1B_LOBBY &&
    context.rng.chance(0.28)
  ) {
    routeIndex = enemy.route.indexOf(ROOMS.CAM_2B_LEFT_HALL_NEAR);
  }
  const currentRoom = enemy.route[routeIndex];
  return {
    ...enemy,
    currentRoom,
    routeIndex,
    side: sideForRoom(currentRoom) ?? enemy.side,
    pose: poseForPathRoom(currentRoom),
    doorAttackTimer: isDoorRoom(currentRoom) ? DOOR_ATTACK_GRACE_SECONDS : null
  };
}

function isWatched(enemy, context) {
  if (enemy.id === 'claude') return false;
  return context.cameraOpen && context.selectedCamera === enemy.currentRoom;
}

function rollAction(enemy, context) {
  return getAiLevel(enemy, context.month, context.phaseIndex) >= context.rng.int(1, 20);
}

function getAiLevel(enemy, month, phaseIndex) {
  const levels = enemy.aiLevelsByMonthPhase?.[month] ?? enemy.aiLevelsByMonthPhase?.[5] ?? [0, 0, 0, 0, 0, 0];
  return levels[Math.max(0, Math.min(levels.length - 1, phaseIndex ?? getPhaseIndex(0)))] ?? 0;
}

function nextActionCooldown(enemyOrDef, rng) {
  return rng.range(enemyOrDef.actionIntervalMin, enemyOrDef.actionIntervalMax);
}

function poseForPathRoom(room) {
  if (isDoorRoom(room)) return 'door_peek';
  if ([ROOMS.CAM_2A_LEFT_HALL_FAR, ROOMS.CAM_4A_RIGHT_HALL_FAR].includes(room)) return 'hallway_far';
  if ([ROOMS.CAM_3_SUPPLY_CLOSET, ROOMS.CAM_2B_LEFT_HALL_NEAR, ROOMS.CAM_4B_RIGHT_HALL_NEAR].includes(room)) return 'hallway_near';
  return 'idle_close';
}

function nextClaudeClosetState(state) {
  if (state === 'CLOSET_STAGE_0') return 'CLOSET_STAGE_1';
  if (state === 'CLOSET_STAGE_1') return 'CLOSET_STAGE_2';
  if (state === 'CLOSET_STAGE_2') return 'CLOSET_STAGE_3';
  return 'SPRINT_ARMED';
}

function poseForClaudeStage(state) {
  if (state === 'CLOSET_STAGE_1') return 'closet_peek1';
  if (state === 'CLOSET_STAGE_2') return 'closet_peek2';
  if (state === 'CLOSET_STAGE_3') return 'closet_out';
  return 'closet_peek1';
}

function sprintPose(step) {
  return ['sprint_01', 'sprint_02', 'sprint_03', 'sprint_04'][Math.max(0, Math.min(3, step ?? 0))];
}
