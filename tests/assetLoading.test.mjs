import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { loadAssets } from '../src/game/assets.js';

test('loadAssets reports percent progress while generated images load', async () => {
  const originalWindow = globalThis.window;
  const originalImage = globalThis.Image;
  const originalFetch = globalThis.fetch;
  const progressEvents = [];

  globalThis.window = {
    __PACKED_GAME_MANIFEST__: {
      assetRoot: '',
      backgrounds: {
        title: 'title.png',
        office: 'office.png'
      },
      cameras: {
        stage: 'stage.png'
      },
      cameraOccupants: {
        CAM_1B_LOBBY: {
          gemini: 'occupied.png'
        }
      },
      effects: {
        staticNoise: 'static.png'
      },
      characters: {
        gemini: {
          displayName: 'Gemini Doll',
          pivotX: 256,
          pivotY: 450,
          poses: {
            idle_close: 'gemini.png',
            camera_stare: 'gemini.png'
          }
        }
      }
    }
  };
  globalThis.fetch = async () => {
    throw new Error('packed manifest should avoid fetch');
  };
  globalThis.Image = class FakeImage {
    set src(value) {
      this._src = value;
      queueMicrotask(() => this.onload?.());
    }
  };

  try {
    await loadAssets(undefined, {
      onProgress: (event) => progressEvents.push(event)
    });
  } finally {
    globalThis.window = originalWindow;
    globalThis.Image = originalImage;
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(
    progressEvents.map((event) => event.percent),
    [0, 17, 33, 50, 67, 83, 100]
  );
  assert.equal(progressEvents.at(-1).loaded, 6);
  assert.equal(progressEvents.at(-1).total, 6);
  assert.equal(progressEvents.at(-1).fileName, 'gemini.png');
});

test('CCTV renderer draws the opaque monitor frame behind the camera feed', async () => {
  const renderSource = await readFile('src/game/render.js', 'utf8');
  const drawStart = renderSource.indexOf('function drawCctv');
  const drawEnd = renderSource.indexOf('function drawCameraEnemies', drawStart);
  const drawCctvSource = renderSource.slice(drawStart, drawEnd);

  assert.notEqual(drawStart, -1);
  assert.notEqual(drawEnd, -1);
  assert.ok(
    drawCctvSource.indexOf('assets.images.backgrounds.monitorFrame') <
      drawCctvSource.indexOf('getCameraBackground(state, assets, camera)')
  );
  assert.match(drawCctvSource, /getOccupiedCameraPlate\(state, assets, camera\)/);
  assert.match(drawCctvSource, /if \(!occupiedPlate\) drawCameraEnemies/);
});

test('manifest defines room-specific occupied CCTV plates including multi-enemy rooms', async () => {
  const manifest = JSON.parse(await readFile('assets/generated/asset_manifest.json', 'utf8'));
  const requiredVariants = {
    CAM_1B_LOBBY: ['gemini', 'chatgpt', 'chatgpt+gemini'],
    CAM_2A_LEFT_HALL_FAR: ['gemini', 'claude', 'claude+gemini'],
    CAM_2B_LEFT_HALL_NEAR: ['gemini', 'claude', 'claude+gemini'],
    CAM_3_SUPPLY_CLOSET: ['gemini'],
    CAM_4A_RIGHT_HALL_FAR: ['grok', 'chatgpt', 'chatgpt+grok'],
    CAM_4B_RIGHT_HALL_NEAR: ['grok', 'chatgpt', 'chatgpt+grok'],
    CAM_5_BACKSTAGE: ['gemini', 'chatgpt', 'chatgpt+gemini'],
    CAM_6_SERVER_KITCHEN: ['grok', 'chatgpt', 'chatgpt+grok']
  };

  for (const [camera, variants] of Object.entries(requiredVariants)) {
    assert.ok(manifest.cameraOccupants?.[camera], `${camera} should have occupied plates`);
    for (const variant of variants) {
      const fileName = manifest.cameraOccupants[camera][variant];
      assert.ok(fileName, `${camera} missing ${variant}`);
      assert.ok(existsSync(`assets/generated/${fileName}`), `${fileName} should exist`);
    }
  }
});

test('CCTV renderer has a visible Claude sprint branch for left hall cameras', async () => {
  const renderSource = await readFile('src/game/render.js', 'utf8');
  const drawStart = renderSource.indexOf('function drawCameraEnemies');
  const drawEnd = renderSource.indexOf('function drawCctvUi', drawStart);
  const drawCameraEnemiesSource = renderSource.slice(drawStart, drawEnd);

  assert.notEqual(drawStart, -1);
  assert.notEqual(drawEnd, -1);
  assert.match(drawCameraEnemiesSource, /SPRINTING_LEFT_HALL/);
  assert.match(drawCameraEnemiesSource, /assets\.images\.characters\.claude\.poses\[claude\.pose\]/);
  assert.match(drawCameraEnemiesSource, /drawShadowedSprite\(ctx, sprite/);
});

test('index loading screen uses the CAM 1A stage art and a live percent target', async () => {
  const html = await readFile('index.html', 'utf8');

  assert.match(html, /id="loadingProgress"/);
  assert.match(html, /assets\/generated\/cam_1a_stage_close_faces\.png/);
  assert.ok(existsSync('assets/generated/cam_1a_stage_close_faces.png'));
});

test('manifest exposes the stare image for randomized title glitch flashes', async () => {
  const manifest = JSON.parse(await readFile('assets/generated/asset_manifest.json', 'utf8'));

  assert.equal(manifest.backgrounds.titleStare, 'loading_chatgpt_watch.png');
  assert.ok(existsSync('assets/generated/loading_chatgpt_watch.png'));
});
