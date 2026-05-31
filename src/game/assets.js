export async function loadAssets(manifestUrl = 'assets/generated/asset_manifest.json') {
  const manifest = window.__PACKED_GAME_MANIFEST__
    ? JSON.parse(JSON.stringify(window.__PACKED_GAME_MANIFEST__))
    : await fetchManifest(manifestUrl);
  const root = manifest.assetRoot ?? 'assets/generated/';

  const imageCache = new Map();
  async function image(fileName) {
    if (imageCache.has(fileName)) return imageCache.get(fileName);
    const img = new Image();
    img.decoding = 'async';
    img.src = `${root}${fileName}`;
    const promise = new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${img.src}`));
    });
    imageCache.set(fileName, promise);
    return promise;
  }

  const backgrounds = {};
  for (const [key, fileName] of Object.entries(manifest.backgrounds)) {
    backgrounds[key] = await image(fileName);
  }

  const cameras = {};
  for (const [key, fileName] of Object.entries(manifest.cameras)) {
    cameras[key] = await image(fileName);
  }

  const effects = {};
  for (const [key, fileName] of Object.entries(manifest.effects)) {
    effects[key] = await image(fileName);
  }

  const characters = {};
  for (const [id, character] of Object.entries(manifest.characters)) {
    characters[id] = {
      ...character,
      poses: {}
    };
    for (const [pose, fileName] of Object.entries(character.poses)) {
      characters[id].poses[pose] = await image(fileName);
    }
  }

  return {
    manifest,
    images: {
      backgrounds,
      cameras,
      effects,
      characters
    }
  };
}

async function fetchManifest(manifestUrl) {
  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(`Failed to load asset manifest: ${response.status}`);
  }
  return response.json();
}
