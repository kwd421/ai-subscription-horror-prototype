import { CAMERA_LABELS, CAMERAS, GAME_TITLE, ROOMS, UI_TEXT } from './constants.js';
import { STATES, getRuntimeLabels, getSelectedCamera } from './state.js';

const W = 1280;
const H = 720;

const CAMERA_ANCHORS = Object.freeze({
  [ROOMS.CAM_1A_STAGE]: {
    gemini: [360, 520, 0.82],
    grok: [870, 520, 0.82],
    chatgpt: [635, 535, 0.92]
  },
  [ROOMS.CAM_1C_CLAUDE_CLOSET]: {
    claude: [645, 640, 0.86]
  },
  [ROOMS.CAM_1B_LOBBY]: {
    gemini: [390, 610, 0.55],
    chatgpt: [690, 610, 0.55]
  },
  [ROOMS.CAM_2A_LEFT_HALL_FAR]: {
    gemini: [620, 620, 0.5],
    claude: [580, 620, 0.56]
  },
  [ROOMS.CAM_2B_LEFT_HALL_NEAR]: {
    gemini: [650, 690, 0.88],
    claude: [585, 690, 0.96]
  },
  [ROOMS.CAM_3_SUPPLY_CLOSET]: {
    gemini: [470, 650, 0.72]
  },
  [ROOMS.CAM_4A_RIGHT_HALL_FAR]: {
    grok: [660, 620, 0.52],
    chatgpt: [520, 620, 0.5]
  },
  [ROOMS.CAM_4B_RIGHT_HALL_NEAR]: {
    grok: [680, 690, 0.9],
    chatgpt: [540, 690, 0.86]
  },
  [ROOMS.CAM_5_BACKSTAGE]: {
    gemini: [370, 640, 0.65],
    chatgpt: [680, 640, 0.62]
  },
  [ROOMS.CAM_6_SERVER_KITCHEN]: {
    grok: [720, 620, 0.54],
    chatgpt: [520, 620, 0.5]
  },
  [ROOMS.CAM_7_RESTROOMS]: {
    grok: [720, 620, 0.54],
    chatgpt: [520, 620, 0.5]
  }
});

const STAGE_CAMERA_VARIANTS = Object.freeze({
  chatgpt: 'stageChatgptOnly',
  gemini: 'stageGeminiOnly',
  grok: 'stageGrokOnly',
  'chatgpt+gemini': 'stageChatgptGemini',
  'chatgpt+grok': 'stageChatgptGrok',
  'gemini+grok': 'stageGeminiGrok',
  'chatgpt+gemini+grok': 'CAM_1A_STAGE'
});

const CCTV_MAP_LAYOUT_ORIGIN = Object.freeze({ x: 870, y: 294 });
const CCTV_MAP_LABEL_SIZE = Object.freeze({ w: 56, h: 40 });
const CCTV_MAP_LAYOUT = Object.freeze({
  [ROOMS.CAM_1A_STAGE]: [CCTV_MAP_LAYOUT_ORIGIN.x + 130, CCTV_MAP_LAYOUT_ORIGIN.y + 0, CCTV_MAP_LABEL_SIZE.w, CCTV_MAP_LABEL_SIZE.h],
  [ROOMS.CAM_1B_LOBBY]: [CCTV_MAP_LAYOUT_ORIGIN.x + 108, CCTV_MAP_LAYOUT_ORIGIN.y + 62, CCTV_MAP_LABEL_SIZE.w, CCTV_MAP_LABEL_SIZE.h],
  [ROOMS.CAM_1C_CLAUDE_CLOSET]: [CCTV_MAP_LAYOUT_ORIGIN.x + 78, CCTV_MAP_LAYOUT_ORIGIN.y + 144, CCTV_MAP_LABEL_SIZE.w, CCTV_MAP_LABEL_SIZE.h],
  [ROOMS.CAM_2A_LEFT_HALL_FAR]: [CCTV_MAP_LAYOUT_ORIGIN.x + 130, CCTV_MAP_LAYOUT_ORIGIN.y + 241, CCTV_MAP_LABEL_SIZE.w, CCTV_MAP_LABEL_SIZE.h],
  [ROOMS.CAM_2B_LEFT_HALL_NEAR]: [CCTV_MAP_LAYOUT_ORIGIN.x + 130, CCTV_MAP_LAYOUT_ORIGIN.y + 292, CCTV_MAP_LABEL_SIZE.w, CCTV_MAP_LABEL_SIZE.h],
  [ROOMS.CAM_3_SUPPLY_CLOSET]: [CCTV_MAP_LAYOUT_ORIGIN.x + 47, CCTV_MAP_LAYOUT_ORIGIN.y + 246, CCTV_MAP_LABEL_SIZE.w, CCTV_MAP_LABEL_SIZE.h],
  [ROOMS.CAM_4A_RIGHT_HALL_FAR]: [CCTV_MAP_LAYOUT_ORIGIN.x + 240, CCTV_MAP_LAYOUT_ORIGIN.y + 241, CCTV_MAP_LABEL_SIZE.w, CCTV_MAP_LABEL_SIZE.h],
  [ROOMS.CAM_4B_RIGHT_HALL_NEAR]: [CCTV_MAP_LAYOUT_ORIGIN.x + 240, CCTV_MAP_LAYOUT_ORIGIN.y + 292, CCTV_MAP_LABEL_SIZE.w, CCTV_MAP_LABEL_SIZE.h],
  [ROOMS.CAM_5_BACKSTAGE]: [CCTV_MAP_LAYOUT_ORIGIN.x + 3, CCTV_MAP_LAYOUT_ORIGIN.y + 88, CCTV_MAP_LABEL_SIZE.w, CCTV_MAP_LABEL_SIZE.h],
  [ROOMS.CAM_6_SERVER_KITCHEN]: [CCTV_MAP_LAYOUT_ORIGIN.x + 316, CCTV_MAP_LAYOUT_ORIGIN.y + 241, CCTV_MAP_LABEL_SIZE.w, CCTV_MAP_LABEL_SIZE.h],
  [ROOMS.CAM_7_RESTROOMS]: [CCTV_MAP_LAYOUT_ORIGIN.x + 336, CCTV_MAP_LAYOUT_ORIGIN.y + 91, CCTV_MAP_LABEL_SIZE.w, CCTV_MAP_LABEL_SIZE.h]
});

const REFERENCE_CCTV_MAP_LINES = Object.freeze([
  [158, 39, 158, 61],
  [186, 23, 253, 23],
  [253, 23, 253, 61],
  [80, 61, 315, 61],
  [80, 61, 80, 203],
  [315, 61, 315, 203],
  [80, 203, 315, 203],
  [30, 61, 80, 61],
  [30, 61, 30, 203],
  [68, 61, 68, 203],
  [0, 203, 80, 203],
  [24, 229, 126, 229],
  [24, 229, 24, 346],
  [126, 203, 126, 346],
  [24, 346, 126, 346],
  [126, 229, 168, 229],
  [168, 203, 168, 346],
  [126, 346, 168, 346],
  [235, 203, 235, 346],
  [273, 203, 273, 346],
  [235, 229, 273, 229],
  [235, 346, 273, 346],
  [315, 88, 331, 88],
  [331, 88, 407, 88],
  [331, 88, 331, 203],
  [371, 88, 371, 156],
  [371, 126, 407, 126],
  [371, 156, 407, 156],
  [407, 126, 407, 156],
  [371, 175, 407, 175],
  [371, 175, 371, 218],
  [407, 175, 407, 218],
  [371, 218, 407, 218],
  [315, 203, 331, 203],
  [331, 203, 331, 229],
  [315, 229, 407, 229],
  [371, 229, 371, 282],
  [407, 229, 407, 282],
  [371, 282, 407, 282],
  [296, 282, 371, 282],
  [296, 282, 296, 318],
  [296, 318, 371, 318],
  [371, 282, 371, 318]
]);

const CAMERA_MAP_LABELS = Object.freeze({
  [ROOMS.CAM_1A_STAGE]: '1A',
  [ROOMS.CAM_1B_LOBBY]: '1B',
  [ROOMS.CAM_1C_CLAUDE_CLOSET]: '1C',
  [ROOMS.CAM_2A_LEFT_HALL_FAR]: '2A',
  [ROOMS.CAM_2B_LEFT_HALL_NEAR]: '2B',
  [ROOMS.CAM_3_SUPPLY_CLOSET]: '3',
  [ROOMS.CAM_4A_RIGHT_HALL_FAR]: '4A',
  [ROOMS.CAM_4B_RIGHT_HALL_NEAR]: '4B',
  [ROOMS.CAM_5_BACKSTAGE]: '5',
  [ROOMS.CAM_6_SERVER_KITCHEN]: '6',
  [ROOMS.CAM_7_RESTROOMS]: '7'
});

export function renderGame(ctx, state, assets, now = performance.now()) {
  state.ui = [];
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  const shake = state.reduceMotion ? 0 : state.screenShake * 20;
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  switch (state.screen) {
    case STATES.TITLE:
      drawTitle(ctx, state, assets, now);
      break;
    case STATES.HOW_TO_PLAY:
      drawHowTo(ctx, state, assets);
      break;
    case STATES.CCTV:
      drawCctv(ctx, state, assets, now);
      break;
    case STATES.NIGHT_CLEAR:
      drawMonthClear(ctx, state, assets);
      break;
    case STATES.GAME_OVER_FAKEOUT:
      drawFakeout(ctx, state, assets);
      break;
    case STATES.JUMPSCARE:
      drawJumpscare(ctx, state, assets, now);
      break;
    case STATES.GAME_OVER:
      drawInvoice(ctx, state, assets);
      break;
    case STATES.FINAL_CLEAR:
      drawFinalClear(ctx, state, assets);
      break;
    case STATES.OFFICE:
    default:
      drawOffice(ctx, state, assets, now);
      break;
  }

  drawScreenNoise(ctx, assets, state, now);
  ctx.restore();
}

export function getCanvasSize() {
  return { width: W, height: H };
}

function drawTitle(ctx, state, assets, now) {
  const glitchVisible = (state.titleGlitch?.flashTimer ?? 0) > 0;
  const titleImage = glitchVisible
    ? assets.images.backgrounds.titleStare ?? assets.images.backgrounds.title
    : assets.images.backgrounds.title;
  drawCover(ctx, titleImage, 0, 0, W, H);
  darken(ctx, glitchVisible ? 0.04 : 0.12 + Math.sin(now / 400) * 0.03);
  if (glitchVisible) drawTitleGlitch(ctx, assets, now);
  text(ctx, GAME_TITLE, 640, 118, 46, '#f5fbff', 'center', '900');
  text(ctx, '무료 체험은 끝났고, 결제 인형들이 움직이기 시작했다.', 640, 170, 24, '#b6d5e4', 'center', '700');
  drawButton(ctx, state, 'start', UI_TEXT.start, 500, 500, 280, 58, true);
  drawButton(ctx, state, 'howTo', UI_TEXT.howToPlay, 500, 570, 280, 54);
}

function drawTitleGlitch(ctx, assets, now) {
  drawStatic(ctx, assets, 0.32);
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#9feeff';
  for (let i = 0; i < 5; i += 1) {
    const y = (now / 5 + i * 113) % H;
    const h = 4 + (i % 3) * 3;
    const xOffset = Math.sin(now / 21 + i) * 30;
    ctx.fillRect(xOffset - 20, y, W + 40, h);
  }
  ctx.restore();
}

function drawHowTo(ctx, state, assets) {
  drawCover(ctx, assets.images.backgrounds.office, 0, 0, W, H);
  darken(ctx, 0.7);
  drawPanel(ctx, 142, 72, 996, 568, 0.86);
  text(ctx, '조작법', 640, 128, 42, '#f8fbff', 'center', '800');
  wrapLines(ctx, [
    '5개월 동안 결제하지 않고 버티세요. CCTV로 방을 직접 확인하고, 적이 보이는 카메라를 보고 있으면 Gemini, Grok, ChatGPT는 움직이지 못합니다.',
    'Claude는 커튼방에서 단계적으로 나온 뒤 왼쪽 복도를 질주합니다. 복도에서 보이면 CCTV를 내리고 왼쪽 문을 닫으세요.',
    '문과 라이트와 CCTV는 토큰을 소모합니다. 토큰이 0%가 되면 문, 라이트, CCTV가 모두 실패합니다.',
    '사무실에서는 화면의 문과 라이트 버튼을 누르고, CCTV에서는 지도 박스를 클릭해 카메라를 바꿀 수 있습니다.',
    '',
    '원작처럼 플레이는 화면 버튼과 CCTV 지도 클릭만 사용합니다.'
  ], 206, 190, 868, 32, '#dcecf7');
  drawButton(ctx, state, 'exitToTitle', '돌아가기', 500, 584, 280, 52);
}

function drawOffice(ctx, state, assets, now) {
  const bg = state.stats.tokenOut
    ? assets.images.backgrounds.powerout
    : selectOfficeBackground(state, assets);
  const sway = state.reduceMotion ? 0 : Math.sin(now / 1900) * 3.5;
  ctx.save();
  ctx.translate(sway, 0);
  drawCover(ctx, bg, -8, 0, W + 16, H);
  ctx.restore();

  if (!state.stats.tokenOut && state.lights.leftOn && state.lights.rightOn) {
    drawOfficeLightLayers(ctx, state, assets, sway);
  }

  if (state.doors.leftClosed) {
    ctx.globalAlpha = 0.72;
    drawCover(ctx, assets.images.backgrounds.leftDoorClosed, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (state.doors.rightClosed) {
    ctx.globalAlpha = 0.72;
    drawCover(ctx, assets.images.backgrounds.rightDoorClosed, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  if (state.lights.leftOn || state.lights.rightOn) drawLightCone(ctx, state);
  drawDoorThreats(ctx, state, assets);
  if (!state.stats.tokenOut) {
    glow(ctx, 432, 382, 148, '#6bdfff', 0.17 + Math.sin(now / 250) * 0.04);
    state.ui.push({ id: 'toggleCctv', label: 'CCTV', x: 314, y: 246, w: 310, h: 206 });
    drawButton(ctx, state, 'toggleCctv', 'CCTV', 500, 638, 280, 48);
  }

  drawHud(ctx, state, { boxed: false });
  drawDoorAndLightControls(ctx, state);

  if (state.stats.tokenOut) {
    text(ctx, '토큰 소진', 640, 342, 70, '#e6eff8', 'center', '900');
    text(ctx, '문과 라이트가 클릭만 하고 반응하지 않는다.', 640, 400, 27, '#d8e6ef', 'center', '700');
  }
  if (state.panicTimer > 0) {
    text(ctx, '딸깍... 실패', 640, 466, 42, '#f4fbff', 'center', '900');
  }
}

function drawCctv(ctx, state, assets, now) {
  const camera = getSelectedCamera(state);
  const occupiedPlate = getOccupiedCameraPlate(state, assets, camera);
  drawCover(ctx, assets.images.backgrounds.monitorFrame, 0, 0, W, H);
  drawCover(ctx, occupiedPlate ?? getCameraBackground(state, assets, camera), 0, 0, W, H);
  if (!occupiedPlate) drawCameraEnemies(ctx, state, assets, camera, now);
  drawStatic(ctx, assets, 0.08 + state.staticBurst * 0.2);
  drawCctvUi(ctx, state);
  if (state.paywallTimer > 0) drawPaywall(ctx, assets, state.paywallTimer);
}

function drawCameraEnemies(ctx, state, assets, camera, now) {
  if (camera === ROOMS.CAM_1A_STAGE) return;
  const enemies = state.enemies.filter((enemy) => enemy.currentRoom === camera && enemy.id !== 'claude');
  for (const enemy of enemies) {
    const anchor = CAMERA_ANCHORS[camera]?.[enemy.id] ?? [640, 620, 0.55];
    const watched = state.cameraOpen && camera === enemy.currentRoom;
    const pose = watched ? 'camera_stare' : enemy.pose;
    const sprite = assets.images.characters[enemy.id]?.poses[pose] ?? assets.images.characters[enemy.id]?.poses.idle_close;
    const twitch = watched && !state.reduceMotion ? 1 + Math.sin(now / 90) * 0.015 : 1;
    drawShadowedSprite(ctx, sprite, anchor[0], anchor[1], 256, 450, anchor[2] * twitch, 0.92);
  }

  const claude = state.enemies.find((enemy) => enemy.id === 'claude');
  if (claude && claude.currentRoom === camera && camera === ROOMS.CAM_1C_CLAUDE_CLOSET) {
    return;
  }

  if (claude && claude.currentRoom === camera && claude.visualState === 'SPRINTING_LEFT_HALL') {
    const anchor = CAMERA_ANCHORS[camera]?.claude ?? [610, 655, 0.74];
    const sprite = assets.images.characters.claude.poses[claude.pose] ?? assets.images.characters.claude.poses.sprint_01;
    const zoom = anchor[2] * (state.reduceMotion ? 1 : 1 + Math.sin(now / 45) * 0.06);
    drawShadowedSprite(ctx, sprite, anchor[0], anchor[1], 256, 450, zoom, 1);
  }
}

function drawCctvUi(ctx, state) {
  const camera = getSelectedCamera(state);
  drawPanel(ctx, 32, 26, 410, 86, 0.72);
  text(ctx, CAMERA_LABELS[camera], 54, 62, 24, '#eaf7ff', 'left', '800');
  text(ctx, `REC  ${state.tokens.toFixed(1)}%`, 54, 94, 17, '#ff6f7b', 'left', '800');
  drawButton(ctx, state, 'prevCamera', '<', 402, 638, 78, 48);
  drawButton(ctx, state, 'toggleCctv', '닫기', 516, 638, 248, 48);
  drawButton(ctx, state, 'nextCamera', '>', 800, 638, 78, 48);
  drawMiniMap(ctx, state, camera);
  drawHud(ctx, state);
}

function drawMiniMap(ctx, state, selectedCamera) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.strokeStyle = 'rgba(245, 250, 252, 0.86)';
  ctx.lineWidth = 2;
  ctx.fillRect(CCTV_MAP_LAYOUT_ORIGIN.x - 2, CCTV_MAP_LAYOUT_ORIGIN.y, 412, 348);
  drawCctvMapConnections(ctx);
  drawYouMarker(ctx);
  for (const camera of CAMERAS) {
    const [x, y, w, h] = CCTV_MAP_LAYOUT[camera];
    const selected = camera === selectedCamera;
    drawCctvMapLabel(ctx, camera, x, y, w, h, selected);
    state.ui.push({ id: `camera:${camera}`, label: CAMERA_LABELS[camera], x, y, w, h });
  }
  ctx.restore();
}

function drawCctvMapConnections(ctx) {
  const { x, y } = CCTV_MAP_LAYOUT_ORIGIN;
  ctx.save();
  ctx.strokeStyle = 'rgba(245, 250, 252, 0.9)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'square';
  drawReferenceMapLines(ctx, x, y);
  ctx.restore();
}

function drawReferenceMapLines(ctx, originX, originY) {
  for (const [x1, y1, x2, y2] of REFERENCE_CCTV_MAP_LINES) {
    ctx.beginPath();
    ctx.moveTo(originX + x1, originY + y1);
    ctx.lineTo(originX + x2, originY + y2);
    ctx.stroke();
  }
}

function drawCctvMapLabel(ctx, camera, x, y, w, h, selected) {
  ctx.save();
  ctx.fillStyle = selected ? 'rgba(238, 244, 246, 0.92)' : 'rgba(18, 18, 18, 0.82)';
  ctx.strokeStyle = '#f4fbff';
  ctx.lineWidth = selected ? 3 : 2;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  text(ctx, 'CAM', x + 5, y + 15, 12, selected ? '#111' : '#f8fbff', 'left', '900');
  text(ctx, CAMERA_MAP_LABELS[camera], x + 7, y + 32, 14, selected ? '#111' : '#f8fbff', 'left', '900');
  ctx.restore();
}

function drawYouMarker(ctx) {
  const { x, y } = CCTV_MAP_LAYOUT_ORIGIN;
  const markerX = x + 188;
  const markerY = y + 284;
  const markerW = 36;
  const markerH = 62;
  ctx.save();
  ctx.fillStyle = 'rgba(178, 197, 40, 0.92)';
  ctx.strokeStyle = '#f8fbff';
  ctx.lineWidth = 2;
  ctx.fillRect(markerX, markerY, markerW, markerH);
  ctx.strokeRect(markerX, markerY, markerW, markerH);
  text(ctx, 'YOU', markerX + markerW / 2, markerY + 18, 12, '#f8fbff', 'center', '900');
  ctx.fillStyle = '#f8fbff';
  ctx.fillRect(markerX + 14, markerY + 40, 8, 8);
  ctx.restore();
}

function drawMonthClear(ctx, state, assets) {
  drawCover(ctx, assets.images.backgrounds.clear, 0, 0, W, H);
  darken(ctx, 0.42);
  drawPanel(ctx, 284, 136, 712, 420, 0.82);
  text(ctx, UI_TEXT.monthEnd, 640, 220, 62, '#f7fbff', 'center', '900');
  text(ctx, UI_TEXT.monthClear, 640, 290, 31, '#d9f6ff', 'center', '800');
  text(ctx, `이번 스테이지 잔여 토큰: ${state.lastMonthTokenScore.toFixed(1)}%`, 640, 360, 30, '#ffe089', 'center', '800');
  drawButton(ctx, state, 'nextNight', UI_TEXT.nextStage, 500, 438, 280, 58, true);
}

function drawFakeout(ctx, state, assets) {
  drawCover(ctx, assets.images.backgrounds.powerout, 0, 0, W, H);
  darken(ctx, 0.5);
}

function drawJumpscare(ctx, state, assets, now) {
  ctx.fillStyle = '#05070b';
  ctx.fillRect(0, 0, W, H);
  const id = state.defeatedId && assets.images.characters[state.defeatedId] ? state.defeatedId : 'chatgpt';
  const image = assets.images.characters[id].poses.jumpscare;
  const flash = state.jumpscareTimer > 1.05 && !state.reduceMotion;
  const zoom = 1.08 + (state.reduceMotion ? 0 : Math.sin(now / 28) * 0.035);
  drawCover(ctx, image, (W - W * zoom) / 2, (H - H * zoom) / 2, W * zoom, H * zoom);
  if (flash) {
    ctx.save();
    ctx.globalAlpha = 0.52;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  drawStatic(ctx, assets, 0.34);
  if (Math.floor(now / 70) % 2 === 0) text(ctx, UI_TEXT.warning, 640, 110, 80, '#fff7f7', 'center', '900');
}

function drawInvoice(ctx, state, assets) {
  drawCover(ctx, assets.images.backgrounds.invoice, 0, 0, W, H);
  darken(ctx, 0.48);
  drawPanel(ctx, 262, 72, 756, 600, 0.9);
  const invoice = state.invoice ?? {};
  text(ctx, UI_TEXT.gameOver, 640, 134, 48, '#ff737f', 'center', '900');
  text(ctx, invoice.plan ?? 'Unknown Plan', 640, 188, 32, '#ffe089', 'center', '900');
  text(ctx, `패배 원인: ${invoice.defeatedBy ?? state.defeatedBy}`, 640, 236, 24, '#f1f7fb', 'center', '800');
  text(ctx, `도달 스테이지: ${invoice.reachedMonth ?? ''}`, 640, 274, 23, '#dfefff', 'center');
  text(ctx, `진행률: ${((invoice.progressRatio ?? 0) * 100).toFixed(1)}%`, 640, 310, 23, '#dfefff', 'center');
  text(ctx, `실패한 달 잔여 토큰: ${(invoice.failedMonthTokens ?? 0).toFixed(1)}%`, 640, 346, 23, '#dfefff', 'center');
  text(ctx, `실패한 달 반영 점수: ${(invoice.partialFailedMonthScore ?? 0).toFixed(1)}`, 640, 382, 23, '#dfefff', 'center');

  const results = invoice.clearedTokenResults ?? [];
  results.forEach((score, index) => {
    text(ctx, `${index + 1}개월차 잔여 토큰: ${score.toFixed(1)}%`, 640, 424 + index * 28, 20, '#f5fbff', 'center');
  });
  text(ctx, `최종 점수: ${(invoice.finalScore ?? state.finalScore).toFixed(1)}`, 640, 552, 32, '#ffe089', 'center', '900');
  drawButton(ctx, state, 'retry', UI_TEXT.retry, 455, 606, 170, 52, true);
  drawButton(ctx, state, 'exitToTitle', UI_TEXT.exit, 655, 606, 170, 52);
}

function drawFinalClear(ctx, state, assets) {
  drawCover(ctx, assets.images.backgrounds.clear, 0, 0, W, H);
  darken(ctx, 0.46);
  drawPanel(ctx, 270, 72, 740, 610, 0.84);
  text(ctx, UI_TEXT.finalClearTitle, 640, 142, 72, '#f7fbff', 'center', '900');
  text(ctx, UI_TEXT.finalClearBody, 640, 206, 27, '#d8f8ff', 'center', '800');
  state.stageTokenResults.forEach((score, index) => {
    text(ctx, `${index + 1}개월차: ${score.toFixed(1)}%`, 640, 274 + index * 42, 26, '#f4f8ff', 'center');
  });
  text(ctx, `총 잔여 토큰량: ${state.finalScore.toFixed(1)}`, 640, 520, 32, '#ffe089', 'center', '900');
  text(ctx, `최종 점수: ${state.finalScore.toFixed(1)}`, 640, 560, 32, '#ffe089', 'center', '900');
  drawButton(ctx, state, 'retry', UI_TEXT.retry, 455, 614, 170, 52, true);
  drawButton(ctx, state, 'exitToTitle', UI_TEXT.exit, 655, 614, 170, 52);
}

function drawHud(ctx, state, { boxed = true } = {}) {
  drawTopRightTime(ctx, state, boxed);
  drawBottomLeftTokenPanel(ctx, state, boxed);
}

function drawTopRightTime(ctx, state, boxed = true) {
  const labels = getRuntimeLabels(state);
  if (boxed) drawPanel(ctx, 1056, 24, 176, 82, 0.62);
  text(ctx, labels.phase, 1212, 60, 30, '#f4fbff', 'right', '900');
  text(ctx, labels.month, 1212, 90, 20, '#d3ecf7', 'right', '800');
}

function drawBottomLeftTokenPanel(ctx, state, boxed = true) {
  const labels = getRuntimeLabels(state);
  if (boxed) drawPanel(ctx, 32, 574, 302, 120, 0.66);
  text(ctx, '남은 전력', 54, 612, 21, '#d9edf7', 'left', '800');
  text(ctx, labels.tokens, 206, 612, 30, '#f6fbff', 'left', '900');
  drawTokenGauge(ctx, 54, 626, state.tokens);
  text(ctx, '사용량', 54, 672, 19, '#d9edf7', 'left', '800');
  drawUsageBars(ctx, getUsageBarsForRender(state));
}

function getUsageBarsForRender(state) {
  const activeDoors = Number(state.doors.leftClosed) + Number(state.doors.rightClosed);
  const activeLights = Number(state.lights.leftOn) + Number(state.lights.rightOn);
  const activeCctv = state.screen === STATES.CCTV || state.cameraOpen ? 1 : 0;
  return Math.min(5, 1 + activeDoors + activeLights + activeCctv);
}

function drawUsageBars(ctx, usage) {
  for (let index = 0; index < 5; index += 1) {
    const x = 132 + index * 28;
    const active = index < usage;
    ctx.fillStyle = active
      ? index < 2
        ? '#7ee6a2'
        : index < 4
          ? '#ffd35c'
          : '#ff7180'
      : 'rgba(72, 96, 108, 0.72)';
    ctx.strokeStyle = 'rgba(218, 237, 247, 0.62)';
    ctx.lineWidth = 1.5;
    roundedRect(ctx, x, 654, 18, 24, 3, true, true);
  }
}

function drawTokenGauge(ctx, x, y, tokens) {
  const width = 244;
  const color = tokens < 18 ? '#f5e2e6' : tokens < 38 ? '#ffcc69' : '#75e3a1';
  ctx.strokeStyle = '#d8edf7';
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, width, 18, 4, false, true);
  ctx.fillStyle = color;
  roundedRect(ctx, x + 3, y + 3, Math.max(2, (width - 6) * (tokens / 100)), 12, 3, true, false);
}

function drawDoorAndLightControls(ctx, state) {
  drawButton(ctx, state, 'leftDoor', state.doors.leftClosed ? '왼쪽 문 닫힘' : UI_TEXT.leftDoor, 44, 456, 190, 44, state.doors.leftClosed);
  drawButton(ctx, state, 'leftLight', state.lights.leftOn ? '왼쪽 라이트 켜짐' : UI_TEXT.leftLight, 44, 508, 190, 44, state.lights.leftOn);
  drawButton(ctx, state, 'rightDoor', state.doors.rightClosed ? '오른쪽 문 닫힘' : UI_TEXT.rightDoor, 1046, 456, 190, 44, state.doors.rightClosed);
  drawButton(ctx, state, 'rightLight', state.lights.rightOn ? '오른쪽 라이트 켜짐' : UI_TEXT.rightLight, 1046, 508, 190, 44, state.lights.rightOn);
}

function selectOfficeBackground(state, assets) {
  if (state.lights.leftOn && state.lights.rightOn) return assets.images.backgrounds.office;
  if (state.lights.leftOn) {
    return state.visibleDoorThreats.left.length
      ? assets.images.backgrounds.leftLightGemini
      : assets.images.backgrounds.leftLightEmpty;
  }
  if (state.lights.rightOn) {
    const threat = state.visibleDoorThreats.right[0];
    if (threat?.id === 'chatgpt') return assets.images.backgrounds.rightLightChatgpt;
    if (threat?.id === 'grok') return assets.images.backgrounds.rightLightGrok;
    return assets.images.backgrounds.rightLightEmpty;
  }
  return assets.images.backgrounds.office;
}

function drawOfficeLightLayers(ctx, state, assets, sway) {
  if (state.lights.leftOn) {
    drawClippedOfficeLayer(ctx, selectLeftLightLayer(state, assets), 'left', sway);
  }
  if (state.lights.rightOn) {
    drawClippedOfficeLayer(ctx, selectRightLightLayer(state, assets), 'right', sway);
  }
}

function selectLeftLightLayer(state, assets) {
  return state.visibleDoorThreats.left.length
    ? assets.images.backgrounds.leftLightGemini
    : assets.images.backgrounds.leftLightEmpty;
}

function selectRightLightLayer(state, assets) {
  const threat = state.visibleDoorThreats.right[0];
  if (threat?.id === 'chatgpt') return assets.images.backgrounds.rightLightChatgpt;
  if (threat?.id === 'grok') return assets.images.backgrounds.rightLightGrok;
  return assets.images.backgrounds.rightLightEmpty;
}

function drawClippedOfficeLayer(ctx, image, side, sway) {
  if (!image) return;
  const overlap = 76;
  const x = side === 'left' ? 0 : W / 2 - overlap;
  const width = W / 2 + overlap;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 0, width, H);
  ctx.clip();
  ctx.translate(sway, 0);
  drawCover(ctx, image, -8, 0, W + 16, H);
  ctx.restore();
}

function drawDoorThreats(ctx, state, assets) {
  void ctx;
  void state;
  void assets;
}

function getCameraBackground(state, assets, camera) {
  if (camera === ROOMS.CAM_1A_STAGE) {
    const atStage = state.enemies
      .filter((enemy) => enemy.id !== 'claude' && enemy.currentRoom === ROOMS.CAM_1A_STAGE)
      .map((enemy) => enemy.id)
      .sort();
    if (!atStage.length) return assets.images.cameras.stageEmpty;
    const stageVariant = STAGE_CAMERA_VARIANTS[atStage.join('+')];
    return assets.images.cameras[stageVariant] ?? assets.images.cameras.CAM_1A_STAGE;
  }
  if (camera === ROOMS.CAM_1C_CLAUDE_CLOSET) {
    const claude = state.enemies.find((enemy) => enemy.id === 'claude');
    if (claude?.visualState === 'CLOSET_STAGE_1') return assets.images.cameras.claudeClosetStage1;
    if (claude?.visualState === 'CLOSET_STAGE_2') return assets.images.cameras.claudeClosetStage2;
    if (['CLOSET_STAGE_3', 'SPRINT_ARMED', 'SPRINTING_LEFT_HALL', 'AT_LEFT_DOOR'].includes(claude?.visualState)) {
      return assets.images.cameras.claudeClosetEmpty;
    }
    return assets.images.cameras.claudeClosetStage0;
  }
  return assets.images.cameras[camera];
}

function getOccupiedCameraPlate(state, assets, camera) {
  if (camera === ROOMS.CAM_1A_STAGE || camera === ROOMS.CAM_1C_CLAUDE_CLOSET) return null;
  const visibleEnemyIds = [];
  for (const enemy of state.enemies) {
    if (enemy.currentRoom !== camera) continue;
    if (enemy.id === 'claude' && enemy.visualState !== 'SPRINTING_LEFT_HALL') continue;
    visibleEnemyIds.push(enemy.id);
  }
  if (!visibleEnemyIds.length) return null;
  const variant = visibleEnemyIds.sort().join('+');
  return assets.images.cameraOccupants?.[camera]?.[variant] ?? null;
}

function drawLightCone(ctx, state) {
  ctx.save();
  ctx.globalAlpha = 0.22;
  if (state.lights.leftOn) drawOfficeLightGradient(ctx, 'left');
  if (state.lights.rightOn) drawOfficeLightGradient(ctx, 'right');
  ctx.restore();
}

function drawOfficeLightGradient(ctx, side) {
  const left = side === 'left';
  const gradient = ctx.createRadialGradient(left ? 200 : 1080, 390, 20, left ? 270 : 1010, 420, 420);
  gradient.addColorStop(0, '#f8f0c8');
  gradient.addColorStop(1, 'rgba(248, 240, 200, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

function drawPaywall(ctx, assets, timer) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, timer / 0.4);
  drawCover(ctx, assets.images.effects.paywallPopup, 330, 150, 620, 350);
  drawPanel(ctx, 408, 244, 464, 190, 0.82);
  text(ctx, '결제하시겠습니까?', 640, 312, 38, '#f8fbff', 'center', '900');
  text(ctx, '닫기', 640, 374, 28, '#ffd5d9', 'center', '800');
  ctx.restore();
}

function drawButton(ctx, state, id, labelText, x, y, w, h, active = false) {
  state.ui.push({ id, label: labelText, x, y, w, h });
  ctx.save();
  ctx.fillStyle = active ? 'rgba(36, 151, 164, 0.86)' : 'rgba(8, 18, 30, 0.78)';
  ctx.strokeStyle = active ? '#c6fbff' : '#7aaec4';
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, w, h, 7, true, true);
  text(ctx, labelText, x + w / 2, y + h / 2 + 8, Math.min(23, Math.max(15, h * 0.42)), '#f4fbff', 'center', '800');
  ctx.restore();
}

function drawShadowedSprite(ctx, image, worldX, worldY, pivotX, pivotY, scale, alpha = 1) {
  if (!image) return;
  ctx.save();
  ctx.globalAlpha *= 0.36 * alpha;
  ctx.filter = 'blur(12px)';
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(worldX, worldY - 22, 120 * scale, 44 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.filter = 'none';
  ctx.globalAlpha = alpha;
  drawSpriteAtPivot(ctx, image, worldX, worldY, pivotX, pivotY, scale, alpha);
  ctx.restore();
}

export function drawSpriteAtPivot(ctx, image, worldX, worldY, pivotX, pivotY, scale, alpha = 1) {
  if (!image) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(worldX, worldY);
  ctx.scale(scale, scale);
  ctx.drawImage(image, -pivotX, -pivotY, 512, 512);
  ctx.restore();
}

function drawScreenNoise(ctx, assets, state, now) {
  const image = assets.images.effects.staticNoise;
  if (!image) return;
  const staticLevel = (state.screen === STATES.CCTV ? 0.035 : 0.018) + Math.min(0.16, state.staticBurst * 0.12);
  drawStatic(ctx, assets, staticLevel);

  ctx.save();
  const scanlineDrift = Math.floor(now / 24) % 4;
  ctx.fillStyle = '#d9f3ff';
  ctx.globalAlpha = (state.screen === STATES.TITLE ? 0.075 : 0.048) + (state.reduceMotion ? 0 : Math.sin(now / 90) * 0.008);
  for (let y = scanlineDrift; y < H; y += 4) {
    ctx.fillRect(0, y, W, 1);
  }
  ctx.fillStyle = '#000000';
  ctx.globalAlpha = state.screen === STATES.CCTV ? 0.08 : 0.045;
  for (let y = 2; y < H; y += 4) {
    ctx.fillRect(0, y, W, 1);
  }
  ctx.restore();
}

function drawStatic(ctx, assets, intensity) {
  if (intensity <= 0) return;
  const image = assets.images.effects.staticNoise;
  ctx.save();
  ctx.globalAlpha = Math.min(0.38, intensity);
  const offsetX = -Math.random() * 90;
  const offsetY = -Math.random() * 90;
  for (let x = offsetX; x < W; x += 300) {
    for (let y = offsetY; y < H; y += 300) {
      ctx.drawImage(image, x, y, 310, 310);
    }
  }
  ctx.restore();
}

function drawCover(ctx, image, x, y, w, h) {
  if (!image) return;
  const ratio = Math.max(w / image.width, h / image.height);
  const dw = image.width * ratio;
  const dh = image.height * ratio;
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawPanel(ctx, x, y, w, h, alpha = 0.72) {
  ctx.save();
  ctx.fillStyle = `rgba(3, 8, 15, ${alpha})`;
  ctx.strokeStyle = 'rgba(132, 196, 220, 0.5)';
  ctx.lineWidth = 1.5;
  roundedRect(ctx, x, y, w, h, 8, true, true);
  ctx.restore();
}

function darken(ctx, alpha) {
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, W, H);
}

function glow(ctx, x, y, radius, color, alpha) {
  const gradient = ctx.createRadialGradient(x, y, 10, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

function text(ctx, value, x, y, size, color, align = 'left', weight = '600') {
  ctx.font = `${weight} ${size}px "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function wrapLines(ctx, lines, x, y, maxWidth, lineHeight, color) {
  lines.forEach((line) => {
    if (!line) {
      y += lineHeight * 0.6;
      return;
    }
    ctx.font = '600 23px "Malgun Gothic", "Apple SD Gothic Neo", Arial, sans-serif';
    const words = line.split(' ');
    let current = '';
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && current) {
        text(ctx, current, x, y, 23, color, 'left');
        y += lineHeight;
        current = word;
      } else {
        current = next;
      }
    });
    text(ctx, current, x, y, 23, color, 'left');
    y += lineHeight;
  });
}

function roundedRect(ctx, x, y, w, h, r, fill, stroke) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
