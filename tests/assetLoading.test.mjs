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
  assert.ok(manifest.cameras?.CAM_7_RESTROOMS, 'CAM_7_RESTROOMS should have a camera background');
  assert.ok(existsSync(`assets/generated/${manifest.cameras.CAM_7_RESTROOMS}`), 'CAM 7 background should exist');

  const requiredVariants = {
    CAM_1B_LOBBY: ['gemini', 'chatgpt', 'chatgpt+gemini'],
    CAM_2A_LEFT_HALL_FAR: ['gemini', 'claude', 'claude+gemini'],
    CAM_2B_LEFT_HALL_NEAR: ['gemini', 'claude', 'claude+gemini'],
    CAM_3_SUPPLY_CLOSET: ['gemini'],
    CAM_4A_RIGHT_HALL_FAR: ['grok', 'chatgpt', 'chatgpt+grok'],
    CAM_4B_RIGHT_HALL_NEAR: ['grok', 'chatgpt', 'chatgpt+grok'],
    CAM_5_BACKSTAGE: ['gemini', 'chatgpt', 'chatgpt+gemini'],
    CAM_6_SERVER_KITCHEN: ['grok', 'chatgpt', 'chatgpt+grok'],
    CAM_7_RESTROOMS: ['grok', 'chatgpt', 'chatgpt+grok']
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

test('CAM 1A stage variants cover the trio, empty stage, and all non-Claude single and paired occupants', async () => {
  const manifest = JSON.parse(await readFile('assets/generated/asset_manifest.json', 'utf8'));
  const renderSource = await readFile('src/game/render.js', 'utf8');
  const stageStart = renderSource.indexOf('if (camera === ROOMS.CAM_1A_STAGE)');
  const stageEnd = renderSource.indexOf('if (camera === ROOMS.CAM_1C_CLAUDE_CLOSET)', stageStart);
  const stageSource = renderSource.slice(stageStart, stageEnd);
  const expectedStageVariants = {
    stageChatgptOnly: 'cam_1a_stage_chatgpt_only.png',
    stageGrokOnly: 'cam_1a_stage_grok_only.png',
    stageGeminiOnly: 'cam_1a_stage_gemini_only.png',
    stageChatgptGrok: 'cam_1a_stage_chatgpt_grok.png',
    stageChatgptGemini: 'cam_1a_stage_chatgpt_gemini.png',
    stageGeminiGrok: 'cam_1a_stage_gemini_grok.png'
  };

  assert.notEqual(stageStart, -1);
  assert.notEqual(stageEnd, -1);
  assert.equal(manifest.cameras?.CAM_1A_STAGE, 'cam_1a_stage_missing_claude.png');
  assert.notEqual(manifest.cameras?.CAM_1A_STAGE, 'cam_1a_stage_close_faces.png');
  assert.equal(manifest.cameras?.stageEmpty, 'cam_1a_stage_empty.png');
  assert.ok(existsSync(`assets/generated/${manifest.cameras.CAM_1A_STAGE}`), 'full stage trio should exist');
  assert.ok(existsSync(`assets/generated/${manifest.cameras.stageEmpty}`), 'empty stage should exist');
  for (const [manifestKey, fileName] of Object.entries(expectedStageVariants)) {
    assert.equal(manifest.cameras?.[manifestKey], fileName);
    assert.ok(existsSync(`assets/generated/${fileName}`), `${fileName} should exist`);
  }
  assert.match(renderSource, /const STAGE_CAMERA_VARIANTS = Object\.freeze/);
  assert.doesNotMatch(stageSource, /claudeMissing|stageMissingClaude|stageMissingGemini|stageMissingGrok/);
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

test('index loading screen uses the Claude-free CAM 1A stage art and a live percent target', async () => {
  const html = await readFile('index.html', 'utf8');

  assert.match(html, /id="loadingProgress"/);
  assert.match(html, /assets\/generated\/cam_1a_stage_missing_claude\.png/);
  assert.doesNotMatch(html, /assets\/generated\/cam_1a_stage_close_faces\.png/);
  assert.ok(existsSync('assets/generated/cam_1a_stage_missing_claude.png'));
});

test('loading screen says asset loading without the static kicker copy', async () => {
  const html = await readFile('index.html', 'utf8');
  const mainSource = await readFile('src/main.js', 'utf8');

  assert.match(html, />에셋 로딩중 0%</);
  assert.doesNotMatch(html, /치직|loading-kicker|자산 로딩 중/);
  assert.match(mainSource, /에셋 로딩중/);
  assert.doesNotMatch(mainSource, /자산 로딩 중/);
});

test('manifest exposes the stare image for randomized title glitch flashes', async () => {
  const manifest = JSON.parse(await readFile('assets/generated/asset_manifest.json', 'utf8'));

  assert.equal(manifest.backgrounds.titleStare, 'loading_chatgpt_watch.png');
  assert.ok(existsSync('assets/generated/loading_chatgpt_watch.png'));
});
