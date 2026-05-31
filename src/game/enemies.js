import { getAttackWindow, ROOMS, UI_TEXT } from './constants.js';

export const ENEMY_DEFS = Object.freeze({
  gemini: {
    id: 'gemini',
    displayName: 'Gemini Doll',
    color: '#65d6ff',
    route: [ROOMS.STAGE, ROOMS.LOBBY, ROOMS.LEFT_HALL_FAR, ROOMS.LEFT_HALL_NEAR, ROOMS.OFFICE_LEFT_ATTACK],
    side: 'left',
    baseMoveSeconds: 14,
    description: 'Steady watcher-sensitive left-side pressure.'
  },
  grok: {
    id: 'grok',
    displayName: 'Grok Doll',
    color: '#f0645a',
    route: [ROOMS.STAGE, ROOMS.SERVER, ROOMS.RIGHT_HALL_FAR, ROOMS.RIGHT_HALL_NEAR, ROOMS.OFFICE_RIGHT_ATTACK],
    side: 'right',
    baseMoveSeconds: 12,
    description: 'Right-side burst movement and camera static.'
  },
  chatgpt: {
    id: 'chatgpt',
    displayName: 'ChatGPT Doll',
    color: '#62e6a1',
    route: [ROOMS.STAGE, ROOMS.LOBBY],
    side: 'variable',
    baseMoveSeconds: 15,
    description: 'Readable pressure that may switch sides once.'
  },
  claude: {
    id: 'claude',
    displayName: 'Claude Doll',
    color: '#d5a05d',
    route: [ROOMS.STAGE, ROOMS.STORAGE, ROOMS.SERVER],
    side: 'variable',
    baseMoveSeconds: 17,
    description: 'Stealth pressure with paywall interference.'
  }
});

export const NIGHT_RULES = Object.freeze({
  1: {
    active: ['gemini', 'chatgpt'],
    aggression: { gemini: 0.82, chatgpt: 0.68, grok: 0.18, claude: 0.1 },
    powerMultiplier: 1,
    blackouts: 0,
    surgeAt: null
  },
  2: {
    active: ['gemini', 'chatgpt', 'grok'],
    aggression: { gemini: 0.94, chatgpt: 0.78, grok: 0.8, claude: 0.18 },
    powerMultiplier: 1.04,
    blackouts: 0,
    surgeAt: null
  },
  3: {
    active: ['gemini', 'chatgpt', 'grok', 'claude'],
    aggression: { gemini: 1.06, chatgpt: 0.9, grok: 0.92, claude: 0.72 },
    powerMultiplier: 1.08,
    blackouts: 0,
    surgeAt: null
  },
  4: {
    active: ['gemini', 'chatgpt', 'grok', 'claude'],
    aggression: { gemini: 1.18, chatgpt: 1.02, grok: 1.12, claude: 0.96 },
    powerMultiplier: 1.16,
    blackouts: 2,
    surgeAt: null
  },
  5: {
    active: ['gemini', 'chatgpt', 'grok', 'claude'],
    aggression: { gemini: 1.32, chatgpt: 1.18, grok: 1.3, claude: 1.14 },
    powerMultiplier: 1.25,
    blackouts: 2,
    surgeAt: 45
  }
});

function branchRoute(base, side) {
  const sideRooms =
    side === 'left'
      ? [ROOMS.LEFT_HALL_FAR, ROOMS.LEFT_HALL_NEAR, ROOMS.OFFICE_LEFT_ATTACK]
      : [ROOMS.RIGHT_HALL_FAR, ROOMS.RIGHT_HALL_NEAR, ROOMS.OFFICE_RIGHT_ATTACK];
  return [...base, ...sideRooms];
}

function nearRoomForSide(side) {
  return side === 'left' ? ROOMS.LEFT_HALL_NEAR : ROOMS.RIGHT_HALL_NEAR;
}

function farRoomForSide(side) {
  return side === 'left' ? ROOMS.LEFT_HALL_FAR : ROOMS.RIGHT_HALL_FAR;
}

function attackRoomForSide(side) {
  return side === 'left' ? ROOMS.OFFICE_LEFT_ATTACK : ROOMS.OFFICE_RIGHT_ATTACK;
}

function sideFromRoom(room) {
  if (room.includes('LEFT')) return 'left';
  if (room.includes('RIGHT')) return 'right';
  return null;
}

export function createEnemy(id, night, rng) {
  const def = ENEMY_DEFS[id];
  if (!def) throw new Error(`Unknown enemy: ${id}`);
  const rules = NIGHT_RULES[night] ?? NIGHT_RULES[5];
  let side = def.side;
  let route = [...def.route];

  if (id === 'chatgpt') {
    side = rng.chance(0.5) ? 'left' : 'right';
    route = branchRoute(def.route, side);
  }

  if (id === 'claude') {
    side = rng.chance(0.5) ? 'left' : 'right';
    route = branchRoute(def.route, side).filter((room, index, all) => all.indexOf(room) === index);
  }

  const active = rules.active.includes(id);
  const aggression = rules.aggression[id] ?? 0.2;

  return {
    id,
    displayName: def.displayName,
    color: def.color,
    currentRoom: ROOMS.STAGE,
    route,
    routeIndex: 0,
    side,
    aggression,
    nextMoveTimer: active ? nextMoveDelay(def.baseMoveSeconds, aggression, rng) : 999,
    attackTimer: null,
    visible: active,
    pose: 'idle',
    repelledCooldown: 0,
    hasSideSwitched: false,
    warningText: '',
    active
  };
}

export function createNightEnemies(night, rng) {
  return Object.keys(ENEMY_DEFS).map((id) => createEnemy(id, night, rng));
}

export function nextMoveDelay(baseMoveSeconds, aggression, rng) {
  const jitter = rng.range(0.72, 1.18);
  return Math.max(2.2, (baseMoveSeconds / Math.max(0.1, aggression)) * jitter);
}

export function moveEnemyForward(enemy, night = 5) {
  if (!enemy.active) return { ...enemy };
  const nextIndex = Math.min(enemy.route.length - 1, enemy.routeIndex + 1);
  const currentRoom = enemy.route[nextIndex];
  const nextSide = sideFromRoom(currentRoom) ?? enemy.side;
  const atNearRoom = currentRoom === nearRoomForSide(nextSide);
  const atAttackRoom = currentRoom === attackRoomForSide(nextSide);

  return {
    ...enemy,
    currentRoom,
    routeIndex: nextIndex,
    side: nextSide,
    pose: atNearRoom || atAttackRoom ? 'running' : currentRoom === ROOMS.STAGE ? 'idle' : 'sneaking',
    warningText: atNearRoom ? UI_TEXT.warning : '',
    attackTimer: atNearRoom ? getAttackWindow(night) : atAttackRoom ? Math.max(0, enemy.attackTimer ?? 0) : null
  };
}

export function moveEnemyToRoom(enemy, room, night = 1) {
  const routeIndex = Math.max(0, enemy.route.indexOf(room));
  const side = sideFromRoom(room) ?? enemy.side;
  const atNearRoom = room === nearRoomForSide(side);
  const atAttackRoom = room === attackRoomForSide(side);
  return {
    ...enemy,
    currentRoom: room,
    routeIndex,
    side,
    pose: atNearRoom || atAttackRoom ? 'running' : room === ROOMS.STAGE ? 'idle' : 'sneaking',
    warningText: atNearRoom ? UI_TEXT.warning : '',
    attackTimer: atNearRoom ? getAttackWindow(night) : atAttackRoom ? Math.max(0, enemy.attackTimer ?? 0) : null
  };
}

export function tickEnemy(enemy, dt, context) {
  if (!enemy.active) return enemy;
  if (enemy.repelledCooldown > 0) {
    return { ...enemy, repelledCooldown: Math.max(0, enemy.repelledCooldown - dt) };
  }
  if (enemy.attackTimer !== null) {
    const attackTimer = Math.max(0, enemy.attackTimer - dt);
    if (attackTimer > 0) return { ...enemy, attackTimer };
    return moveEnemyToRoom(enemy, attackRoomForSide(enemy.side), context.night);
  }

  const watched = context.cameraOpen && context.selectedCamera === enemy.currentRoom;
  const watchPenalty = watched && enemy.id === 'gemini' ? 0.52 : 1;
  const grokBurst = enemy.id === 'grok' && context.rng.chance(0.12 + context.night * 0.025) ? 0.45 : 1;
  const nextMoveTimer = enemy.nextMoveTimer - dt * watchPenalty * grokBurst;

  if (nextMoveTimer > 0) return { ...enemy, nextMoveTimer };

  const moved = moveEnemyForward(maybeSwitchChatGptSide(enemy, context), context.night);
  return {
    ...moved,
    nextMoveTimer: nextMoveDelay(ENEMY_DEFS[enemy.id].baseMoveSeconds, enemy.aggression, context.rng)
  };
}

function maybeSwitchChatGptSide(enemy, context) {
  if (enemy.id !== 'chatgpt' || enemy.hasSideSwitched || context.night < 3) return enemy;
  if (![ROOMS.LEFT_HALL_FAR, ROOMS.RIGHT_HALL_FAR].includes(enemy.currentRoom)) return enemy;
  if (!context.rng.chance(0.22)) return enemy;
  const side = enemy.side === 'left' ? 'right' : 'left';
  return {
    ...enemy,
    side,
    hasSideSwitched: true,
    route: branchRoute([ROOMS.STAGE, ROOMS.LOBBY], side),
    routeIndex: 2,
    currentRoom: farRoomForSide(side),
    warningText: '',
    pose: 'sneaking'
  };
}

export function handleAttackResolution(enemy, doors) {
  const correctDoorClosed = enemy.side === 'left' ? doors.leftClosed : doors.rightClosed;
  if (!correctDoorClosed) {
    return {
      outcome: 'breach',
      defeatedBy: enemy.displayName,
      enemy: { ...enemy, pose: 'jumpscare' }
    };
  }

  const room = farRoomForSide(enemy.side);
  return {
    outcome: 'repelled',
    enemy: {
      ...enemy,
      currentRoom: room,
      routeIndex: Math.max(0, enemy.route.indexOf(room)),
      pose: 'sneaking',
      attackTimer: null,
      warningText: '',
      nextMoveTimer: 4.5,
      repelledCooldown: 2.5
    }
  };
}
