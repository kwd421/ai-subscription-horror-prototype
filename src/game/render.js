import { CAMERA_LABELS, CAMERAS, GAME_TITLE, UI_TEXT } from './constants.js';
import { STATES, getHudScore, getRuntimeLabels, getSelectedCamera } from './state.js';

const W = 1280;
const H = 720;

const ROOM_ANCHORS = {
  STAGE: [
    [430, 615, 0.42],
    [560, 616, 0.42],
    [700, 616, 0.42],
    [840, 616, 0.42]
  ],
  LOBBY: [
    [560, 610, 0.46],
    [730, 612, 0.5]
  ],
  SERVER: [
    [530, 610, 0.44],
    [725, 612, 0.48]
  ],
  STORAGE: [
    [570, 620, 0.42],
    [760, 624, 0.44]
  ],
  LEFT_HALL_FAR: [
    [610, 610, 0.42],
    [760, 612, 0.44]
  ],
  LEFT_HALL_NEAR: [
    [640, 660, 0.76],
    [780, 662, 0.72]
  ],
  RIGHT_HALL_FAR: [
    [670, 610, 0.42],
    [520, 612, 0.44]
  ],
  RIGHT_HALL_NEAR: [
    [640, 660, 0.76],
    [500, 662, 0.72]
  ]
};

export function renderGame(ctx, state, assets, now = performance.now()) {
  state.ui = [];
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  const shake = state.reduceMotion ? 0 : state.screenShake * 18;
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  switch (state.screen) {
    case STATES.TITLE:
      drawTitle(ctx, state, assets);
      break;
    case STATES.HOW_TO_PLAY:
      drawHowTo(ctx, state, assets);
      break;
    case STATES.CCTV:
      drawCctv(ctx, state, assets, now);
      break;
    case STATES.NIGHT_CLEAR:
      drawNightClear(ctx, state, assets);
      break;
    case STATES.GAME_OVER_FAKEOUT:
      drawFakeout(ctx, state, assets);
      break;
    case STATES.JUMPSCARE:
      drawJumpscare(ctx, state, assets, now);
      break;
    case STATES.GAME_OVER:
      drawGameOver(ctx, state, assets);
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

function drawTitle(ctx, state, assets) {
  drawCover(ctx, assets.images.backgrounds.title, 0, 0, W, H);
  drawButton(ctx, state, 'start', UI_TEXT.start, 500, 500, 280, 56, true);
  drawButton(ctx, state, 'howTo', UI_TEXT.howToPlay, 500, 570, 280, 56);
}

function drawHowTo(ctx, state, assets) {
  drawCover(ctx, assets.images.backgrounds.office, 0, 0, W, H);
  darken(ctx, 0.68);
  drawPanel(ctx, 150, 82, 980, 540, 0.82);
  text(ctx, UI_TEXT.howToPlay, 640, 135, 42, '#f8fbff', 'center', '700');
  const lines = [
    'CCTV로 AI 인형의 위치를 확인하세요.',
    '감시 중 바로 CCTV에서 인형이 "내놔!!!!" 하고 달려오면 해당 방향 문을 닫으세요.',
    'CCTV와 문은 전력을 소모합니다. 계속 켜두면 정전이 나고 문을 닫을 수 없습니다.',
    '6AM까지 버티면 다음 밤으로 넘어갑니다. 5일차까지 버티면 클리어입니다.',
    '',
    'C: CCTV 열기/닫기    A/D 또는 ←/→: 카메라 전환',
    'Q: 왼쪽 문    E: 오른쪽 문    Esc: CCTV 닫기',
    'M: 음소거    R: 움직임 줄이기'
  ];
  wrapLines(ctx, lines, 210, 205, 860, 29, '#dbe8f7');
  drawButton(ctx, state, 'exitToTitle', '돌아가기', 500, 642, 280, 52);
}

function drawOffice(ctx, state, assets, now) {
  const bg = state.stats.powerOut ? assets.images.backgrounds.powerout : assets.images.backgrounds.office;
  const sway = state.reduceMotion ? 0 : Math.sin(now / 1800) * 4;
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

  if (!state.stats.powerOut) {
    glow(ctx, 433, 385, 150, '#65d6ff', 0.2 + Math.sin(now / 240) * 0.04);
    state.ui.push({ id: 'toggleCctv', label: 'CCTV', x: 314, y: 245, w: 310, h: 205 });
  }

  drawHud(ctx, state);
  drawDoorControls(ctx, state);
  drawButton(ctx, state, 'toggleCctv', state.screen === STATES.CCTV ? 'CCTV 닫기' : 'CCTV', 520, 640, 240, 48, !state.stats.powerOut);
  if (state.stats.powerOut) {
    text(ctx, '정전', 640, 360, 72, '#ff5260', 'center', '900');
    text(ctx, '전력이 없습니다. 문과 CCTV가 잠겼습니다.', 640, 415, 28, '#f5d9df', 'center');
  }
  drawWarnings(ctx, state, assets);
}

function drawCctv(ctx, state, assets, now) {
  const camera = getSelectedCamera(state);
  drawCover(ctx, assets.images.cameras[camera], 0, 0, W, H);
  const blackout = state.blackoutTimer > 0;
  if (blackout) {
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, W, H);
    text(ctx, 'SIGNAL LOST', 640, 344, 60, '#e7edf5', 'center', '900');
  } else {
    drawCameraEnemies(ctx, state, assets, camera, now);
  }
  ctx.globalAlpha = 0.55;
  drawCover(ctx, assets.images.backgrounds.monitorFrame, 0, 0, W, H);
  ctx.globalAlpha = 1;
  drawStatic(ctx, assets, Math.max(0.06, state.staticBurst * 0.18 + (state.surgeTimer > 0 ? 0.09 : 0)));
  drawCctvUi(ctx, state);
  drawWarnings(ctx, state, assets);
  if (state.paywallTimer > 0) drawPaywall(ctx, assets, state.paywallTimer);
}

function drawCameraEnemies(ctx, state, assets, camera, now) {
  const enemies = state.enemies.filter((enemy) => enemy.currentRoom === camera && enemy.visible);
  enemies.forEach((enemy, index) => {
    const anchors = ROOM_ANCHORS[camera] ?? [[640, 620, 0.5]];
    const anchor = anchors[index % anchors.length];
    const pose = enemy.warningText ? 'near_door' : enemy.pose;
    const sprite = assets.images.characters[enemy.id]?.poses[pose] ?? assets.images.characters[enemy.id]?.poses.idle;
    const alpha = enemy.id === 'claude' && !enemy.warningText ? 0.62 + Math.sin(now / 180) * 0.08 : 1;
    const pulse = enemy.warningText && !state.reduceMotion ? 1 + Math.sin(now / 90) * 0.04 : 1;
    drawSpriteAtPivot(ctx, sprite, anchor[0], anchor[1], 256, 450, anchor[2] * pulse, alpha);
    if (enemy.warningText) {
      text(ctx, UI_TEXT.warning, anchor[0], Math.max(84, anchor[1] - 360 * anchor[2]), 40, '#ff3545', 'center', '900');
    } else {
      label(ctx, enemy.displayName, anchor[0], anchor[1] - 270 * anchor[2], enemy.color);
    }
  });
}

function drawCctvUi(ctx, state) {
  const camera = getSelectedCamera(state);
  drawPanel(ctx, 30, 26, 342, 74, 0.72);
  text(ctx, CAMERA_LABELS[camera], 52, 61, 25, '#eaf7ff', 'left', '700');
  text(ctx, `전력 사용: ${state.surgeTimer > 0 ? '과부하' : '감시중'}`, 52, 89, 18, '#ff8f9a', 'left');

  drawButton(ctx, state, 'prevCamera', '◀', 44, 620, 78, 58);
  drawButton(ctx, state, 'nextCamera', '▶', 1158, 620, 78, 58);
  drawButton(ctx, state, 'toggleCctv', '닫기', 1080, 36, 140, 46);
  drawDoorControls(ctx, state);
  drawMiniMap(ctx, state, camera);
  drawHud(ctx, state, true);
}

function drawMiniMap(ctx, state, selectedCamera) {
  const x = 922;
  const y = 90;
  drawPanel(ctx, x, y, 300, 246, 0.7);
  text(ctx, 'MAP', x + 150, y + 32, 22, '#eaf7ff', 'center', '800');
  const positions = {
    STAGE: [x + 122, y + 58],
    LOBBY: [x + 122, y + 102],
    SERVER: [x + 205, y + 102],
    STORAGE: [x + 40, y + 102],
    LEFT_HALL_FAR: [x + 64, y + 154],
    LEFT_HALL_NEAR: [x + 64, y + 198],
    RIGHT_HALL_FAR: [x + 190, y + 154],
    RIGHT_HALL_NEAR: [x + 190, y + 198]
  };
  for (const camera of CAMERAS) {
    const [cx, cy] = positions[camera];
    ctx.fillStyle = camera === selectedCamera ? '#f74658' : '#162637';
    ctx.strokeStyle = '#7ab7d3';
    ctx.lineWidth = 2;
    roundedRect(ctx, cx, cy, 78, 28, 5, true, true);
    text(ctx, cameraLabelShort(camera), cx + 39, cy + 19, 11, '#eaf7ff', 'center', '700');
  }
  state.enemies.forEach((enemy) => {
    const pos = positions[enemy.currentRoom];
    if (!pos) return;
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(pos[0] + 68, pos[1] + 8, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawNightClear(ctx, state, assets) {
  drawCover(ctx, assets.images.backgrounds.clear, 0, 0, W, H);
  darken(ctx, 0.38);
  drawPanel(ctx, 320, 140, 640, 390, 0.78);
  text(ctx, '6 AM', 640, 230, 90, '#f8fbff', 'center', '900');
  text(ctx, `${state.currentNight}일차 생존`, 640, 292, 34, '#ccecff', 'center', '700');
  text(ctx, `획득 점수: ${state.lastNightScore.toLocaleString()}`, 640, 352, 30, '#ffdd86', 'center', '700');
  drawButton(ctx, state, 'nextNight', UI_TEXT.nextNight, 500, 428, 280, 56, true);
}

function drawFakeout(ctx, state, assets) {
  drawCover(ctx, assets.images.backgrounds.powerout, 0, 0, W, H);
  darken(ctx, 0.42);
}

function drawJumpscare(ctx, state, assets, now) {
  ctx.fillStyle = '#05070b';
  ctx.fillRect(0, 0, W, H);
  const id = state.defeatedId && assets.images.characters[state.defeatedId] ? state.defeatedId : 'claude';
  const sprite = assets.images.characters[id].poses.jumpscare;
  const zoom = 1.72 + (state.reduceMotion ? 0 : Math.sin(now / 38) * 0.08);
  drawSpriteAtPivot(ctx, sprite, 640, 710, 256, 450, zoom, 1);
  drawStatic(ctx, assets, 0.28);
  text(ctx, UI_TEXT.warning, 640, 112, 78, '#ff1f32', 'center', '900');
}

function drawGameOver(ctx, state, assets) {
  drawCover(ctx, assets.images.backgrounds.gameOver, 0, 0, W, H);
  darken(ctx, 0.56);
  drawPanel(ctx, 325, 128, 630, 460, 0.82);
  text(ctx, 'GAME OVER', 640, 210, 64, '#ff4454', 'center', '900');
  text(ctx, `패배: ${state.defeatedBy || 'Unknown'}`, 640, 278, 27, '#f2eef3', 'center', '700');
  text(ctx, `현재 밤: ${state.currentNight}일차`, 640, 320, 25, '#dcecff', 'center');
  text(ctx, `최종 점수: ${state.gameOverScore.toLocaleString()}`, 640, 370, 32, '#ffdd86', 'center', '700');
  drawButton(ctx, state, 'retry', UI_TEXT.retry, 455, 468, 170, 54, true);
  drawButton(ctx, state, 'exitToTitle', UI_TEXT.exit, 655, 468, 170, 54);
}

function drawFinalClear(ctx, state, assets) {
  drawCover(ctx, assets.images.backgrounds.clear, 0, 0, W, H);
  darken(ctx, 0.48);
  drawPanel(ctx, 278, 82, 724, 568, 0.78);
  text(ctx, 'CLEAR', 640, 152, 72, '#eaffff', 'center', '900');
  text(ctx, '5일차까지 결제창을 모두 닫았습니다', 640, 205, 27, '#d8f8ff', 'center', '700');
  state.nightScores.forEach((score, index) => {
    text(ctx, `${index + 1}일차: ${score.toLocaleString()}`, 640, 268 + index * 42, 25, '#f4f8ff', 'center');
  });
  text(ctx, `최종 점수: ${state.nightScores.reduce((sum, score) => sum + score, 0).toLocaleString()}`, 640, 505, 34, '#ffdd86', 'center', '800');
  drawButton(ctx, state, 'retry', UI_TEXT.retry, 455, 570, 170, 54, true);
  drawButton(ctx, state, 'exitToTitle', UI_TEXT.exit, 655, 570, 170, 54);
}

function drawHud(ctx, state, compact = false) {
  const labels = getRuntimeLabels(state);
  drawPanel(ctx, 28, compact ? 108 : 28, compact ? 360 : 430, compact ? 88 : 106, 0.66);
  text(ctx, labels.night, 52, compact ? 140 : 62, 24, '#f4fbff', 'left', '700');
  text(ctx, labels.clock, 190, compact ? 140 : 62, 26, '#f9ffff', 'left', '900');
  text(ctx, `${UI_TEXT.score}: ${getHudScore(state).toLocaleString()}`, 52, compact ? 174 : 98, 20, '#ffdd86', 'left');
  drawPower(ctx, compact ? 242 : 282, compact ? 155 : 83, state.power);
}

function drawPower(ctx, x, y, power) {
  const width = 142;
  const color = power < 18 ? '#ff334a' : power < 38 ? '#ffb03b' : '#7ce19a';
  ctx.strokeStyle = '#d8edf7';
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, width, 20, 4, false, true);
  ctx.fillStyle = color;
  roundedRect(ctx, x + 3, y + 3, Math.max(2, (width - 6) * (power / 100)), 14, 3, true, false);
  text(ctx, `${UI_TEXT.power} ${Math.ceil(power)}%`, x + width / 2, y - 8, 15, '#eaf7ff', 'center', '700');
}

function drawDoorControls(ctx, state) {
  const leftText = state.doors.leftClosed ? '왼쪽 문 닫힘' : UI_TEXT.leftDoor;
  const rightText = state.doors.rightClosed ? '오른쪽 문 닫힘' : UI_TEXT.rightDoor;
  drawButton(ctx, state, 'leftDoor', leftText, 48, 640, 190, 48, state.doors.leftClosed);
  drawButton(ctx, state, 'rightDoor', rightText, 1042, 640, 190, 48, state.doors.rightClosed);
}

function drawWarnings(ctx, state, assets) {
  const near = state.enemies.some((enemy) => enemy.warningText);
  if (near || state.power < 15) {
    ctx.globalAlpha = near ? 0.42 : 0.24;
    drawCover(ctx, assets.images.effects.warningVignette, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

function drawPaywall(ctx, assets, timer) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, timer / 0.4);
  drawCover(ctx, assets.images.effects.paywallPopup, 330, 150, 620, 350);
  drawPanel(ctx, 408, 244, 464, 190, 0.82);
  text(ctx, '결제하시겠습니까?', 640, 312, 38, '#f8fbff', 'center', '900');
  text(ctx, '닫기', 640, 374, 28, '#ff5868', 'center', '800');
  ctx.restore();
}

function drawGlobalToggles(ctx, state) {
  drawButton(ctx, state, 'mute', state.muted ? '음소거 ON' : '음소거', 1000, 590, 116, 38, state.muted);
  drawButton(ctx, state, 'motion', state.reduceMotion ? '동작 줄임' : '모션', 1124, 590, 96, 38, state.reduceMotion);
}

function drawButton(ctx, state, id, labelText, x, y, w, h, active = false) {
  state.ui.push({ id, label: labelText, x, y, w, h });
  ctx.save();
  ctx.fillStyle = active ? 'rgba(164, 32, 44, 0.84)' : 'rgba(10, 19, 31, 0.78)';
  ctx.strokeStyle = active ? '#ff7b87' : '#7aaec4';
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, w, h, 7, true, true);
  text(ctx, labelText, x + w / 2, y + h / 2 + 8, Math.min(24, Math.max(15, h * 0.42)), '#f4fbff', 'center', '800');
  ctx.restore();
}

function drawPanel(ctx, x, y, w, h, alpha = 0.72) {
  ctx.save();
  ctx.fillStyle = `rgba(3, 8, 15, ${alpha})`;
  ctx.strokeStyle = 'rgba(132, 196, 220, 0.5)';
  ctx.lineWidth = 1.5;
  roundedRect(ctx, x, y, w, h, 8, true, true);
  ctx.restore();
}

function label(ctx, value, x, y, color) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  roundedRect(ctx, x - 72, y - 18, 144, 28, 5, true, false);
  text(ctx, value, x, y + 2, 15, color, 'center', '800');
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
  ctx.globalAlpha = Math.min(0.36, intensity);
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

function cameraLabelShort(camera) {
  return camera
    .replace('LEFT_', 'L ')
    .replace('RIGHT_', 'R ')
    .replace('_HALL_', ' ')
    .replace('STAGE', 'STAGE')
    .replace('LOBBY', 'LOBBY')
    .replace('SERVER', 'SERVER')
    .replace('STORAGE', 'STORE');
}
