export async function loadAssets(manifestUrl = 'assets/generated/asset_manifest.json', options = {}) {
  const manifest = globalThis.window?.__PACKED_GAME_MANIFEST__
    ? JSON.parse(JSON.stringify(globalThis.window.__PACKED_GAME_MANIFEST__))
    : await fetchManifest(manifestUrl);
  const root = manifest.assetRoot ?? 'assets/generated/';
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;
  const totalImages = new Set(getManifestImageFiles(manifest)).size;
  let loadedImages = 0;

  reportProgress(onProgress, loadedImages, totalImages, null);

  const imageCache = new Map();
  async function image(fileName) {
    if (imageCache.has(fileName)) return imageCache.get(fileName);
    const img = new Image();
    img.decoding = 'async';
    img.src = `${root}${fileName}`;
    const promise = new Promise((resolve, reject) => {
      img.onload = () => {
        loadedImages += 1;
        reportProgress(onProgress, loadedImages, totalImages, fileName);
        resolve(img);
      };
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

  const cameraOccupants = {};
  for (const [camera, variants] of Object.entries(manifest.cameraOccupants ?? {})) {
    cameraOccupants[camera] = {};
    for (const [variant, fileName] of Object.entries(variants)) {
      cameraOccupants[camera][variant] = await image(fileName);
    }
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
      cameraOccupants,
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

function getManifestImageFiles(manifest) {
  const files = [
    ...Object.values(manifest.backgrounds ?? {}),
    ...Object.values(manifest.cameras ?? {}),
    ...Object.values(manifest.effects ?? {})
  ];
  for (const variants of Object.values(manifest.cameraOccupants ?? {})) {
    files.push(...Object.values(variants ?? {}));
  }
  for (const character of Object.values(manifest.characters ?? {})) {
    files.push(...Object.values(character.poses ?? {}));
  }
  return files;
}

function reportProgress(onProgress, loaded, total, fileName) {
  if (!onProgress) return;
  const percent = total === 0 ? 100 : Math.round((loaded / total) * 100);
  onProgress({ loaded, total, percent, fileName });
}
