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
  [ROOMS.CAM_4A_RIGHT_HALL_FAR]: {
    grok: [660, 620, 0.52],
    chatgpt: [520, 620, 0.5]
  },
  [ROOMS.CAM_4B_RIGHT_HALL_NEAR]: {
    grok: [680, 690, 0.9],
    chatgpt: [540, 690, 0.86]
  },
  [ROOMS.CAM_6_SERVER_KITCHEN]: {
    grok: [720, 620, 0.54],
    chatgpt: [520, 620, 0.5]
  }
});

const CCTV_MAP_LAYOUT = Object.freeze({
  [ROOMS.CAM_1A_STAGE]: [1012, 110, 98, 34],
  [ROOMS.CAM_1B_LOBBY]: [1012, 156, 98, 34],
  [ROOMS.CAM_1C_CLAUDE_CLOSET]: [1130, 156, 98, 34],
  [ROOMS.CAM_2A_LEFT_HALL_FAR]: [936, 220, 98, 34],
  [ROOMS.CAM_2B_LEFT_HALL_NEAR]: [936, 266, 98, 34],
  [ROOMS.CAM_4A_RIGHT_HALL_FAR]: [1114, 220, 98, 34],
  [ROOMS.CAM_4B_RIGHT_HALL_NEAR]: [1114, 266, 98, 34],
  [ROOMS.CAM_6_SERVER_KITCHEN]: [1050, 334, 98, 34]
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

  drawGlobalToggles(ctx, state);
  ctx.restore();
}

export function getCanvasSize() {
  return { width: W, height: H };
}

function drawTitle(ctx, state, assets, now) {
  drawCover(ctx, assets.images.backgrounds.title, 0, 0, W, H);
  darken(ctx, 0.12 + Math.sin(now / 400) * 0.03);
  text(ctx, GAME_TITLE, 640, 118, 46, '#f5fbff', 'center', '900');
  text(ctx, '무료 체험은 끝났고, 결제 인형들이 움직이기 시작했다.', 640, 170, 24, '#b6d5e4', 'center', '700');
  drawButton(ctx, state, 'start', UI_TEXT.start, 500, 500, 280, 58, true);
  drawButton(ctx, state, 'howTo', UI_TEXT.howToPlay, 500, 570, 280, 54);
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
    'A/D는 사무실에서 왼쪽/오른쪽 라이트 토글, CCTV에서는 카메라 전환입니다. 지도 박스를 클릭해도 카메라를 바꿀 수 있습니다.',
    '',
    'C: CCTV   Q/E: 왼쪽/오른쪽 문   A/D: 라이트 또는 카메라 전환   Esc: CCTV 닫기   M: 음소거   R: 모션 줄이기'
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
  }

  drawHud(ctx, state);
  drawDoorAndLightControls(ctx, state);
  drawButton(ctx, state, 'toggleCctv', 'CCTV', 516, 634, 248, 50, state.cameraOpen);

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
  drawButton(ctx, state, 'prevCamera', '<', 44, 620, 78, 58);
  drawButton(ctx, state, 'nextCamera', '>', 1158, 620, 78, 58);
  drawButton(ctx, state, 'toggleCctv', '닫기', 1084, 36, 136, 46);
  drawMiniMap(ctx, state, camera);
  drawHud(ctx, state, true);
}

function drawMiniMap(ctx, state, selectedCamera) {
  drawPanel(ctx, 910, 72, 302, 318, 0.72);
  text(ctx, 'CCTV MAP', 1060, 102, 20, '#eaf7ff', 'center', '800');
  for (const camera of CAMERAS) {
    const [x, y, w, h] = CCTV_MAP_LAYOUT[camera];
    const selected = camera === selectedCamera;
    ctx.fillStyle = selected ? 'rgba(60, 215, 255, 0.78)' : 'rgba(9, 21, 34, 0.86)';
    ctx.strokeStyle = selected ? '#f4fbff' : '#70a9be';
    ctx.lineWidth = selected ? 2.5 : 1.5;
    roundedRect(ctx, x, y, w, h, 5, true, true);
    text(ctx, shortCameraLabel(camera), x + w / 2, y + 23, 12, selected ? '#031018' : '#dbeef7', 'center', '800');
    state.ui.push({ id: `camera:${camera}`, label: CAMERA_LABELS[camera], x, y, w, h });
  }
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

function drawHud(ctx, state, compact = false) {
  const labels = getRuntimeLabels(state);
  drawPanel(ctx, 28, compact ? 116 : 28, compact ? 392 : 432, compact ? 92 : 112, 0.7);
  text(ctx, labels.month, 52, compact ? 150 : 62, 24, '#f4fbff', 'left', '800');
  text(ctx, labels.phase, 176, compact ? 150 : 62, 22, '#cfe9f7', 'left', '700');
  text(ctx, `남은 토큰 ${labels.tokens}`, 52, compact ? 184 : 100, 21, '#ffe089', 'left', '800');
  drawTokenGauge(ctx, compact ? 242 : 282, compact ? 168 : 84, state.tokens);
}

function drawTokenGauge(ctx, x, y, tokens) {
  const width = 154;
  const color = tokens < 18 ? '#f5e2e6' : tokens < 38 ? '#ffcc69' : '#75e3a1';
  ctx.strokeStyle = '#d8edf7';
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, width, 20, 4, false, true);
  ctx.fillStyle = color;
  roundedRect(ctx, x + 3, y + 3, Math.max(2, (width - 6) * (tokens / 100)), 14, 3, true, false);
}

function drawDoorAndLightControls(ctx, state) {
  drawButton(ctx, state, 'leftDoor', state.doors.leftClosed ? '왼쪽 문 닫힘' : UI_TEXT.leftDoor, 44, 616, 190, 44, state.doors.leftClosed);
  drawButton(ctx, state, 'leftLight', state.lights.leftOn ? '왼쪽 라이트 켜짐' : UI_TEXT.leftLight, 44, 664, 190, 44, state.lights.leftOn);
  drawButton(ctx, state, 'rightDoor', state.doors.rightClosed ? '오른쪽 문 닫힘' : UI_TEXT.rightDoor, 1046, 616, 190, 44, state.doors.rightClosed);
  drawButton(ctx, state, 'rightLight', state.lights.rightOn ? '오른쪽 라이트 켜짐' : UI_TEXT.rightLight, 1046, 664, 190, 44, state.lights.rightOn);
}

function drawGlobalToggles(ctx, state) {
  drawButton(ctx, state, 'mute', state.muted ? '음소거 ON' : '음소거', 1000, 590, 116, 38, state.muted);
  drawButton(ctx, state, 'motion', state.reduceMotion ? '모션 줄임' : '모션', 1124, 590, 96, 38, state.reduceMotion);
}

function selectOfficeBackground(state, assets) {
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

function drawDoorThreats(ctx, state, assets) {
  void ctx;
  void state;
  void assets;
}

function getCameraBackground(state, assets, camera) {
  if (camera === ROOMS.CAM_1A_STAGE) {
    const atStage = new Set(
      state.enemies
        .filter((enemy) => enemy.id !== 'claude' && enemy.currentRoom === ROOMS.CAM_1A_STAGE)
        .map((enemy) => enemy.id)
    );
    const claude = state.enemies.find((enemy) => enemy.id === 'claude');
    const claudeMissing = !['CLOSET_STAGE_0', 'CLOSET_STAGE_1'].includes(claude?.visualState);
    if (!atStage.size) return assets.images.cameras.stageEmpty;
    if (atStage.has('chatgpt') && !atStage.has('gemini') && !atStage.has('grok')) {
      return assets.images.cameras.stageChatgptOnly;
    }
    if (!atStage.has('gemini')) return assets.images.cameras.stageMissingGemini;
    if (!atStage.has('grok')) return assets.images.cameras.stageMissingGrok;
    if (claudeMissing) return assets.images.cameras.stageMissingClaude;
    return assets.images.cameras.CAM_1A_STAGE;
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
  const gradient = ctx.createRadialGradient(state.lights.leftOn ? 200 : 1080, 390, 20, state.lights.leftOn ? 270 : 1010, 420, 420);
  gradient.addColorStop(0, '#f8f0c8');
  gradient.addColorStop(1, 'rgba(248, 240, 200, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
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

function shortCameraLabel(camera) {
  return camera
    .replace('CAM_', '')
    .replace('_STAGE', 'A')
    .replace('_LOBBY', 'B')
    .replace('_CLAUDE_CLOSET', 'C')
    .replace('_LEFT_HALL_FAR', 'L FAR')
    .replace('_LEFT_HALL_NEAR', 'L DOOR')
    .replace('_RIGHT_HALL_FAR', 'R FAR')
    .replace('_RIGHT_HALL_NEAR', 'R DOOR')
    .replace('_SERVER_KITCHEN', 'SERVER');
}
