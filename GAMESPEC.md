/goal Build a complete playable browser horror-survival fan-game prototype titled "저는 결제하라고 나오면 닫아버립니다".

You must fully implement the game, generate all visual image assets with Codex image generation, and stop only when the game is playable from title screen to either game over or 5-night clear with final score shown.

This is a one-shot competition build. Do not make a minimal placeholder and stop. Do not split obvious work into tiny follow-up tasks. Keep working inside this goal until the game is complete, polished, tested, and runnable.

========================
HIGH-LEVEL GAME CONCEPT
========================

Create a first-person CCTV survival horror game inspired by classic office-camera-door-power horror gameplay, but with original parody characters and original generated art.

Game title:
"저는 결제하라고 나오면 닫아버립니다"

Premise:
The player is in a dark AI subscription support office at night. Four creepy AI mascot dolls try to enter the office and demand payment. The player survives by watching CCTV, tracking each doll’s movement, and closing the correct door at the correct time. CCTV and closed doors drain power. If the player survives until 6 AM, the night is cleared. Clear 5 nights to win. If a doll enters, briefly show an eerie empty-office fakeout, then a jumpscare, then show Retry / Exit and the score.

Tone:
Korean dark comedy + jump-scare horror. Creepy but not gory. No blood, gore, dismemberment, or graphic injury. The scare should come from sudden motion, sound, static, camera glitch, and the dolls yelling "돈내!!!!".

Important IP rule:
Do NOT use any Five Nights at Freddy’s copyrighted characters, images, names, logos, restaurant branding, or visual designs. Do NOT use real company logos for Gemini, Grok, ChatGPT, or Claude. The names may appear as plain text labels only. The characters must be original parody AI dolls with distinct silhouettes and colors, not replicas of any real logos, mascots, or copyrighted characters.

========================
TECH STACK
========================

If the repo is empty or unsuitable, create a self-contained browser game using:
- HTML5 Canvas
- TypeScript or modern JavaScript
- Vite if package setup is available; otherwise a static index.html + src/main.js is acceptable
- No heavy game engine unless already present
- No external image/audio/font assets
- No remote CDNs
- No SVG at all
- No external copyrighted assets
- All image assets must be generated with Codex image generation using $imagegen
- Audio should be procedural WebAudio only: static, thuds, warning beeps, jumpscare sting, 6AM chime. No downloaded audio files.

Required project files:
- index.html
- src/main.ts or src/main.js
- src/game/
- assets/generated/
- assets/generated/asset_manifest.json
- README.md with run instructions and controls
- package.json with dev/build/test scripts if using Vite or another package setup

The game must run locally with one simple command such as:
npm install
npm run dev

Also support production build:
npm run build

========================
VISUAL ASSET GENERATION
========================

Use Codex image generation directly. Use $imagegen for all non-code visual assets.

Absolutely forbidden:
- SVG
- external image files
- downloaded images
- copied FNAF screenshots
- copied logos
- copied mascot designs
- auto-cropped inconsistent sprite sheets

Generate original PNG or WebP assets only.

Use a consistent visual style:
- cinematic 16:9 dark office horror
- slightly cartoonish creepy AI dolls
- Korean UI horror-comedy
- CRT noise, CCTV static, dim fluorescent lighting, blue-gray shadows, red warning accents
- non-gory jumpscare images

Generate at least these assets:

1. Office and UI backgrounds
- office_main.png: 16:9 first-person view from inside the security office. Desk, CCTV monitor in front, left and right doors visible at screen edges, dark server-room vibe.
- office_left_door_closed.png: overlay or state image for left door closed.
- office_right_door_closed.png: overlay or state image for right door closed.
- office_powerout.png: dark emergency office view.
- monitor_frame.png: close-up CCTV monitor frame / bezel, original design.
- title_screen.png: title art with Korean title "저는 결제하라고 나오면 닫아버립니다", creepy office/paywall theme. Text must be readable.

2. CCTV room backgrounds, 16:9 each
- cam_stage.png: starting room with four empty chairs.
- cam_lobby.png: payment kiosk lobby.
- cam_server.png: server corridor.
- cam_left_hall_far.png
- cam_left_hall_near.png
- cam_right_hall_far.png
- cam_right_hall_near.png
- cam_storage.png

3. Four original AI doll characters
Create four original characters. They can be named in UI as plain text:
- Gemini Doll
- Grok Doll
- ChatGPT Doll
- Claude Doll

Do not use official logos. Do not use brand marks. Do not copy real product icons. Make original creepy toy designs.

For each doll, generate fixed-canvas transparent PNG pose assets:
- idle
- sneaking
- near_door
- running
- jumpscare

Critical sprite/pivot rule:
Every character pose image must be a 512x512 transparent PNG.
Never trim transparent pixels.
Never auto-crop.
The doll’s feet or lower body anchor must stay at the same pixel coordinate in every pose: pivotX = 256, pivotY = 450.
The character’s centerline must stay around x = 256.
Save exact pivot data in assets/generated/asset_manifest.json.
Render all character sprites by bottom-center pivot, never by top-left corner.
This is mandatory to prevent unnatural animation jumps.

Animation rule:
Do NOT rely on a chopped sprite sheet. Use individual fixed-canvas PNG pose images. For running and jumpscare, animate with scale, shake, blur, and alpha over the same pivot instead of moving cropped frames. If any sprite appears to teleport because of canvas cropping, fix the asset or rendering math before finishing.

4. Effects
- static_noise_tile.png or static_noise_overlay.png generated with image model, or procedural noise if easier
- warning_vignette.png
- paywall_popup.png: creepy Korean fake payment popup saying "결제하시겠습니까?" and "닫기"
- gameover_bg.png
- clear_bg.png

Quality:
Use high quality for title, office, jumpscare, and CCTV backgrounds.
Use medium/high quality for character poses.
Every generated asset must be saved into assets/generated/ and referenced through asset_manifest.json.

========================
CORE GAMEPLAY LOOP
========================

The player starts at title screen:
- Title: "저는 결제하라고 나오면 닫아버립니다"
- Buttons: Start, How to Play
- How to Play explains in Korean:
  "CCTV로 AI 인형의 위치를 확인하세요. 감시실 바로 옆 CCTV에서 인형이 '돈내!!!!' 하며 달려오면 해당 방향 문을 닫으세요. CCTV와 문은 전력을 소모합니다. 6AM까지 버티면 다음 날로 넘어갑니다. 5일차까지 버티면 클리어입니다."

Office screen:
- First-person office view
- CCTV monitor is clickable in front
- Left door button
- Right door button
- Power gauge
- Current night: 1일차 ~ 5일차
- Clock: 12 AM to 6 AM
- Current total score or current night score preview
- Visual door state indicators

Controls:
- Click CCTV monitor or press C: open/close CCTV
- Left/Right arrow or A/D while CCTV is open: switch cameras
- Q: toggle left door
- E: toggle right door
- Esc: close CCTV
- Mouse works for all UI buttons
- Retry and Exit buttons work after game over
- After a clear, Next Night button advances unless night 5 is cleared

CCTV screen:
- Show monitor frame and selected camera background
- Show actual current doll positions in that camera by compositing their character pose images
- Show camera name, map mini-layout, power usage indicator, left/right camera arrows
- Add static, occasional distortion, and Korean warning text
- CCTV drains power while open
- Camera feeds must reflect the real simulation state, not random fake images

Map/camera graph:
Rooms:
- STAGE
- LOBBY
- SERVER
- STORAGE
- LEFT_HALL_FAR
- LEFT_HALL_NEAR
- RIGHT_HALL_FAR
- RIGHT_HALL_NEAR
- OFFICE_LEFT_ATTACK
- OFFICE_RIGHT_ATTACK

Office is not a camera, but attack states correspond to the doors.

Character routes:
1. Gemini Doll:
   Route: STAGE -> LOBBY -> LEFT_HALL_FAR -> LEFT_HALL_NEAR -> OFFICE_LEFT_ATTACK
   Behavior: steady, medium speed, sometimes pauses when watched.
   Counter: close left door when it reaches LEFT_HALL_NEAR and starts running.

2. Grok Doll:
   Route: STAGE -> SERVER -> RIGHT_HALL_FAR -> RIGHT_HALL_NEAR -> OFFICE_RIGHT_ATTACK
   Behavior: burst movement, faster on later nights, causes extra camera static.
   Counter: close right door quickly when it reaches RIGHT_HALL_NEAR.

3. ChatGPT Doll:
   Route: STAGE -> LOBBY -> either LEFT_HALL_FAR or RIGHT_HALL_FAR -> matching NEAR -> matching ATTACK
   Behavior: more readable, sometimes displays fake helpful text, can switch side once per night.
   Counter: track its side and close the correct door.

4. Claude Doll:
   Route: STAGE -> STORAGE -> SERVER -> randomly LEFT_HALL_NEAR or RIGHT_HALL_NEAR -> matching ATTACK
   Behavior: stealthy, less visible, shows subtle silhouette and fake payment popup.
   Counter: pay attention to camera glitches and warning popup; close correct door.

Attack warning:
When a doll reaches LEFT_HALL_NEAR or RIGHT_HALL_NEAR, the CCTV for that room must visibly show the doll near the office and/or running toward camera with the Korean text:
"돈내!!!!"

After it starts attack:
- Give player a short reaction window.
- Night 1: 2.4 seconds
- Night 2: 2.1 seconds
- Night 3: 1.8 seconds
- Night 4: 1.5 seconds
- Night 5: 1.25 seconds

If correct door is closed before the attack timer expires:
- Play thud/static
- Repel the doll back to a previous room
- Award a small defense bonus
- Door can be reopened manually

If correct door is open when timer expires:
- Doll enters office
- Do not instantly game over
- First show a fakeout: office looks empty and silent for about 1 second
- Then jumpscare: the corresponding doll’s jumpscare image fills the screen with shake, zoom, static, and procedural scare sound
- Then show Game Over screen with Retry / Exit and final score

Power system:
- Power starts at 100% each night
- Base power drains slowly over time
- CCTV open drains additional power
- Each closed door drains additional power
- Night 4 and Night 5 drain slightly faster
- If power reaches 0:
  - CCTV becomes unavailable
  - doors open and cannot close
  - lights dim
  - after a short random delay, if not already 6AM, trigger a powerout jumpscare/game over
- Player should be able to survive if they use CCTV and doors efficiently
- Player should lose if they keep CCTV open constantly or close both doors for too long

Use tunable constants:
NIGHT_LENGTH_SECONDS = 90 for prototype pacing
HOURS_PER_NIGHT = 6
Power drain values should be balanced so a skilled player can clear all five nights, but wasteful play loses.

Clock:
- Starts at 12 AM
- Progresses to 6 AM
- At 6 AM:
  - Stop all enemies
  - Show "6 AM"
  - Play procedural chime
  - Calculate night score
  - Show day score screen
  - Proceed to next night or final clear screen after 5일차

========================
SCORING
========================

Score must be implemented and visible at game over or clear.

Track:
- completedNights
- currentNight
- remainingPower
- survivedTimeRatio
- successfulDoorBlocks
- cameraUseSeconds
- doorClosedSeconds
- powerOut
- nightScores array

Night clear score formula:
nightScore =
  currentNight * 1000
  + floor(remainingPower * 35)
  + successfulDoorBlocks * 150
  + max(0, 500 - floor(cameraUseSeconds * 3))
  + max(0, 500 - floor(doorClosedSeconds * 2))

Game over partial score:
partialScore =
  completedNights * 1000
  + floor(survivedTimeRatio * 800)
  + floor(remainingPower * 10)
  + successfulDoorBlocks * 75

On game over:
- Show "GAME OVER"
- Show defeated by which doll
- Show current night
- Show final score = sum(previous nightScores) + partialScore
- Buttons: Retry, Exit

On 5-night clear:
- Show "CLEAR"
- Show "5일차까지 결제창을 모두 닫았습니다"
- Show each day’s score:
  1일차: X
  2일차: X
  3일차: X
  4일차: X
  5일차: X
- Show final total score = sum(nightScores)
- Buttons: Retry, Exit

========================
LEVEL DESIGN / NIGHT DESIGN
========================

Avoid monotonous level design. Each night must feel different.

Night 1:
- Tutorial-like
- Gemini and ChatGPT active slowly
- Grok and Claude mostly idle until later

Night 2:
- Grok becomes active
- Right hall pressure increases
- Introduce burst movement and stronger static

Night 3:
- Claude becomes active
- Introduce fake paywall popup that briefly obscures CCTV
- ChatGPT may switch sides once

Night 4:
- All four are active
- Random camera blackout event for 1.5 seconds at most twice
- Faster attack windows
- More power pressure

Night 5:
- Final night
- All dolls aggressive
- At 3 AM trigger "Subscription Surge": static increases, power drains slightly faster for 15 seconds, and paywall popup appears once
- Still fair and beatable with good play

Important:
Do not make levels by only increasing a single speed number. Add unique events, route differences, visibility differences, and warning differences.

========================
STATE MACHINE REQUIREMENTS
========================

Implement a clear game state machine:
- TITLE
- HOW_TO_PLAY
- OFFICE
- CCTV
- NIGHT_CLEAR
- GAME_OVER_FAKEOUT
- JUMPSCARE
- GAME_OVER
- FINAL_CLEAR

Enemy state:
- id
- displayName
- currentRoom
- route
- side
- aggression
- nextMoveTimer
- attackTimer
- visible
- pose
- repelledCooldown
- hasSideSwitched if needed

Door state:
- leftClosed
- rightClosed
- lockedByPowerOut

Power state:
- currentPower
- cameraOpen
- leftDoorClosed
- rightDoorClosed
- drainRate

Use deterministic-ish randomness with a seed per night so behavior is varied but debuggable.

========================
UI / UX POLISH
========================

Use Korean UI text:
- 시작
- 조작법
- 다시하기
- 나가기
- 다음 날
- 전력
- 점수
- 1일차, 2일차, 3일차, 4일차, 5일차
- CCTV
- 왼쪽 문
- 오른쪽 문
- 돈내!!!!

Office polish:
- Subtle camera sway
- Door close/open animation
- Power gauge changes color or warning at low power
- CCTV monitor glows
- Static appears when switching camera

CCTV polish:
- Camera label
- Mini-map with highlighted selected camera
- Doll names as plain text labels when visible
- Distortion and noise
- Left/right arrows
- "SIGNAL LOST" during blackout

Jumpscare polish:
- No gore
- Sudden zoom-in
- screen shake
- static flash
- procedural sound sting
- Korean text flash "돈내!!!!"

Accessibility:
- Add a mute button
- Add a reduce motion toggle if easy
- Do not make UI unreadable
- Use large clickable buttons

========================
CRITICAL SPRITE / ANIMATION FIX
========================

This is extremely important.

The game must not have the common bug where the idle sprite is centered but other poses appear far away from the correct position.

To prevent that:
1. Do not use auto-cropped sprite sheets.
2. Do not trim transparent pixels.
3. Every character pose must be 512x512 transparent PNG.
4. Use bottom-center pivot: pivotX 256, pivotY 450.
5. Store pivot metadata in asset_manifest.json.
6. Render via drawSpriteAtPivot(image, worldX, worldY, pivotX, pivotY, scale).
7. Use the same world anchor for all poses of the same character.
8. Test each character by switching idle -> sneaking -> near_door -> running -> jumpscare at the same anchor and confirm it does not jump sideways.
9. If a generated pose violates the anchor, regenerate or pad it in code onto a 512x512 canvas before using it.
10. Do not finish until all poses are visually stable.

For running toward the camera:
Use scale/zoom/shake on the same fixed-canvas image instead of moving between cropped frames.

========================
VALIDATION / DONE WHEN
========================

Do not stop after writing code. Validate the game.

Done only when:
- The app launches without errors.
- Title screen works.
- Start begins Night 1.
- CCTV opens and closes.
- Camera arrows switch feeds.
- Enemies visibly move across actual camera rooms.
- "돈내!!!!" warning appears when an enemy is at a near-office camera.
- Left and right doors can close/open and drain power.
- Closing the correct door repels the correct enemy.
- Failing to close the correct door triggers fakeout -> jumpscare -> Game Over.
- Game Over screen shows Retry / Exit and final score.
- Surviving to 6 AM calculates a night score and proceeds.
- Clearing 5일차 shows final clear screen with all daily scores and total score.
- Power can run out and causes the intended powerout behavior.
- All generated visual assets are local files in assets/generated/.
- No SVG files exist in the project.
- No external image/audio/font assets are used.
- No FNAF original characters, logos, screenshots, or copied visual designs are used.
- npm run build succeeds if package scripts exist.
- Add a simple automated or manual test checklist in README.md.
- If possible, create a small simulation test for enemy movement/scoring logic and run it.

If something breaks, fix it before completing the goal. No TODO placeholders for core gameplay. No "future work" for required systems.

========================
README REQUIREMENTS
========================

README.md must include:
- Game title
- How to run
- Controls
- Rules
- Scoring formula
- Asset policy: all visual assets generated through Codex image generation; no SVG; no external copyrighted assets
- Known limitations only for non-core polish, not for missing gameplay