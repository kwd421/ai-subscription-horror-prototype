# AI Subscription Horror Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete playable browser horror-survival prototype described in `GAMESPEC.md`.

**Architecture:** Use a self-contained HTML5 Canvas app with modular JavaScript game logic under `src/game/`. Keep simulation, scoring, RNG, rendering, input, and audio boundaries clear enough to test core behavior outside the browser.

**Tech Stack:** HTML5 Canvas, modern JavaScript modules, Node built-in test runner, Node static dev server and build verifier, generated local PNG assets.

---

### Task 1: Core Logic Tests

**Files:**
- Create: `tests/gameLogic.test.mjs`
- Create: `src/game/constants.js`
- Create: `src/game/score.js`
- Create: `src/game/rng.js`
- Create: `src/game/enemies.js`

- [ ] Write failing tests for clear score, partial score, deterministic RNG, enemy routing, attack windows, and door repel behavior.
- [ ] Run `npm test` and verify the tests fail because logic modules are missing.
- [ ] Implement the minimum logic modules to make the tests pass.
- [ ] Run `npm test` and verify all tests pass.

### Task 2: App Shell

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `scripts/dev-server.mjs`
- Create: `scripts/build.mjs`
- Create: `src/main.js`
- Create: `src/game/state.js`
- Create: `src/game/assets.js`
- Create: `src/game/audio.js`
- Create: `src/game/render.js`

- [ ] Add package scripts for `dev`, `build`, and `test`.
- [ ] Implement the Canvas app, screen state machine, keyboard/mouse input, procedural WebAudio, and render loop.
- [ ] Verify title, how-to, office, CCTV, night clear, fakeout, jumpscare, game over, and final clear states are reachable.

### Task 3: Generated Assets

**Files:**
- Create/update: `assets/generated/*.png`
- Create/update: `assets/generated/asset_manifest.json`

- [ ] Generate project-bound raster assets with Codex image generation.
- [ ] Save all final assets under `assets/generated/`.
- [ ] For character poses, ensure 512x512 fixed canvas metadata with `pivotX: 256` and `pivotY: 450`.
- [ ] Reference assets only through `asset_manifest.json`.

### Task 4: Gameplay Integration

**Files:**
- Modify: `src/main.js`
- Modify: `src/game/state.js`
- Modify: `src/game/render.js`
- Modify: `src/game/enemies.js`

- [ ] Integrate five nights with distinct enemy activation, events, camera blackouts, subscription surge, power pressure, and scoring.
- [ ] Render real enemy rooms on CCTV and show the near-room `내놔!!!!` warning.
- [ ] Implement door blocks, powerout behavior, fakeout, jumpscare, retry, exit, and final score flow.
- [ ] Run `npm test` after integration.

### Task 5: Verification And README

**Files:**
- Create: `README.md`

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run the dev server and verify the game in a browser.
- [ ] Confirm no SVG files exist and no external image, audio, font, or CDN references are used.
- [ ] Document run instructions, controls, rules, scoring formula, asset policy, and manual checklist.
