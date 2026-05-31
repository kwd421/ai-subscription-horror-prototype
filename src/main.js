import { loadAssets } from './game/assets.js';
import { ProceduralAudio } from './game/audio.js';
import { renderGame, getCanvasSize } from './game/render.js';
import {
  STATES,
  advanceAfterClear,
  closeCamera,
  createInitialState,
  startRun,
  switchCamera,
  toggleCamera,
  toggleDoor,
  updateState
} from './game/state.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const loading = document.querySelector('#loading');
const uiLayer = document.querySelector('#uiLayer');
const { width, height } = getCanvasSize();
canvas.width = width;
canvas.height = height;

const audio = new ProceduralAudio();
const state = createInitialState();
const testMode = new URLSearchParams(window.location.search).has('test');
let assets = null;
let lastTime = performance.now();
let lastCanvasPointerAt = 0;
let lastUiSignature = '';

function resizeCanvas() {
  const scale = Math.min(window.innerWidth / width, window.innerHeight / height);
  canvas.style.width = `${Math.floor(width * scale)}px`;
  canvas.style.height = `${Math.floor(height * scale)}px`;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

loadAssets()
  .then((loadedAssets) => {
    assets = loadedAssets;
    loading.hidden = true;
    renderStaticFrame();
    if (!testMode) requestAnimationFrame(frame);
  })
  .catch((error) => {
    loading.textContent = `자산 로딩 실패: ${error.message}`;
    console.error(error);
  });

function frame(now) {
  try {
    const dt = Math.min(0.05, (now - lastTime) / 1000 || 0);
    lastTime = now;
    updateState(state, dt, audio);
    renderGame(ctx, state, assets, now);
    syncDomHitboxes();
  } catch (error) {
    console.error(error);
  }
  requestAnimationFrame(frame);
}

function renderStaticFrame() {
  renderGame(ctx, state, assets, performance.now());
  syncDomHitboxes();
}

canvas.addEventListener('pointerdown', (event) => {
  lastCanvasPointerAt = performance.now();
  handleCanvasInput(event);
});

canvas.addEventListener('click', (event) => {
  if (performance.now() - lastCanvasPointerAt < 250) return;
  handleCanvasInput(event);
});

function handleCanvasInput(event) {
  void safeAudioUnlock();
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * width;
  const y = ((event.clientY - rect.top) / rect.height) * height;
  const hit = [...state.ui].reverse().find((box) => x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h);
  if (hit) {
    event.preventDefault();
    performAction(hit.id);
  }
}

window.addEventListener('keydown', (event) => {
  void safeAudioUnlock();
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', ' ', 'enter', 'c', 'q', 'e', 'escape'].includes(key)) {
    event.preventDefault();
  }
  if (key === 'enter' || key === ' ') {
    if (state.screen === STATES.TITLE) performAction('start');
    else if (state.screen === STATES.HOW_TO_PLAY) performAction('exitToTitle');
    else if (state.screen === STATES.NIGHT_CLEAR) performAction('nextNight');
    else if (state.screen === STATES.GAME_OVER || state.screen === STATES.FINAL_CLEAR) performAction('retry');
  }
  if (key === 'c') performAction('toggleCctv');
  if (key === 'escape') {
    if (state.screen === STATES.CCTV) closeCamera(state);
    else if (state.screen === STATES.HOW_TO_PLAY) state.screen = STATES.TITLE;
  }
  if (key === 'arrowleft' || key === 'a') performAction('prevCamera');
  if (key === 'arrowright' || key === 'd') performAction('nextCamera');
  if (key === 'q') performAction('leftDoor');
  if (key === 'e') performAction('rightDoor');
  if (key === 'm') performAction('mute');
  if (key === 'r') performAction('motion');
});

uiLayer.addEventListener('click', (event) => {
  const action = event.target?.dataset?.action;
  if (!action) return;
  event.preventDefault();
  void safeAudioUnlock();
  performAction(action);
});

function performAction(action) {
  switch (action) {
    case 'start':
    case 'retry':
      audio.click();
      startRun(state);
      break;
    case 'howTo':
      audio.click();
      state.screen = STATES.HOW_TO_PLAY;
      break;
    case 'exitToTitle':
      audio.click();
      resetToTitle();
      break;
    case 'nextNight':
      audio.click();
      advanceAfterClear(state);
      break;
    case 'toggleCctv':
      if (toggleCamera(state)) audio.staticBurst(0.12, 0.04);
      break;
    case 'prevCamera':
      if (switchCamera(state, -1)) audio.staticBurst(0.08, 0.035);
      break;
    case 'nextCamera':
      if (switchCamera(state, 1)) audio.staticBurst(0.08, 0.035);
      break;
    case 'leftDoor':
      if (toggleDoor(state, 'left')) audio.thud();
      break;
    case 'rightDoor':
      if (toggleDoor(state, 'right')) audio.thud();
      break;
    case 'mute':
      state.muted = !state.muted;
      audio.setMuted(state.muted);
      break;
    case 'motion':
      state.reduceMotion = !state.reduceMotion;
      audio.click();
      break;
    default:
      break;
  }
  if (testMode) renderStaticFrame();
}

function resetToTitle() {
  const muted = state.muted;
  const reduceMotion = state.reduceMotion;
  Object.assign(state, createInitialState());
  state.muted = muted;
  state.reduceMotion = reduceMotion;
  audio.setMuted(muted);
}

async function safeAudioUnlock() {
  try {
    await audio.ensure();
  } catch {
    state.muted = true;
    audio.setMuted(true);
  }
}

function syncDomHitboxes() {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / width;
  const scaleY = rect.height / height;
  const signature = JSON.stringify({
    x: Math.round(rect.left),
    y: Math.round(rect.top),
    w: Math.round(rect.width),
    h: Math.round(rect.height),
    ui: state.ui.map((box) => [box.id, box.label, box.x, box.y, box.w, box.h])
  });
  if (signature === lastUiSignature) return;
  lastUiSignature = signature;
  uiLayer.textContent = '';
  state.ui.forEach((box, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = box.id;
    button.dataset.index = String(index);
    button.setAttribute('aria-label', `${box.label ?? box.id} ${index}`);
    button.style.left = `${rect.left + box.x * scaleX}px`;
    button.style.top = `${rect.top + box.y * scaleY}px`;
    button.style.width = `${box.w * scaleX}px`;
    button.style.height = `${box.h * scaleY}px`;
    uiLayer.appendChild(button);
  });
}
