/goal Refactor and upgrade the existing browser game repository "ai-subscription-horror-prototype" into a much scarier, more faithful, more randomized CCTV survival horror game while keeping it fully playable and buildable.

This is a second-pass one-shot competition repair goal. The existing prototype works, but it has design problems. Fix them completely in this goal. Do not make a tiny partial patch. Do not leave TODOs for required gameplay. Keep working until the game is playable from title to game over or full 5-month clear, with final token score output.

Repository context:
- Existing repo title: "저는 결제하라고 나오면 닫아버립니다"
- Existing structure likely includes src/game/assets.js, audio.js, constants.js, enemies.js, render.js, rng.js, score.js, state.js.
- Preserve the simple browser game setup, local generated assets, procedural WebAudio, no external assets, no SVG.
- You may reorganize modules if needed, but keep npm run dev, npm run build, and npm test working.
- Existing gameplay must be replaced or upgraded where it conflicts with the requirements below.

==================================================
ABSOLUTE DESIGN CHANGES FROM CURRENT PROTOTYPE
==================================================

Fix these exact problems:

1. Enemy patterns must NOT be fixed.
   Current problem: on month 1, enemies appear to always approach the same side.
   New requirement: enemy behavior must use randomized AI action opportunities inspired by FNAF-style logic. Every run of the same month should feel different. Month 1 must still be easy, but it must not always send both active enemies left.

2. Enemies must NOT move while the player is watching their current CCTV room.
   If the player has CCTV open and the selected camera is the room containing an enemy, that enemy must freeze, stare at the camera, or twitch subtly, but must not advance to another room.
   Exception: the Claude/Foxy-type character, after it has already escaped the start closet and begun the sprint sequence, may be visibly running through the hallway camera.

3. Remove real-time score increase.
   Do not show a score that increases during gameplay.
   The HUD may show only:
   - current month
   - current month phase/progress
   - remaining token amount as percentage with one decimal place, e.g. "남은 토큰 98.7%"
   - door/light/CCTV states
   Final score is calculated only at game over or clear.

4. Remove red near-enemy markers.
   Do not color near rooms red.
   Do not flash a red enemy warning just because an enemy is near.
   Horror should come from uncertainty, sound, static, lighting, subtle silhouettes, and direct observation.

5. Remove enemy position dots from the CCTV map.
   The map must never reveal enemy positions as dots, icons, labels, or colored markers.
   The player must manually search CCTV feeds to find enemies.
   The mini-map can show only camera room boxes and the currently selected camera.

6. Make the dolls scarier and more distinct.
   Regenerate the character assets. Current dolls are too generic and not scary.
   Use original stylized parody toy dolls inspired by public AI figures, not real photos and not official company logos:
   - Grok Doll: Elon Musk-inspired creepy executive chicken/bird-like doll, behavioral role inspired by Chica/right-side pressure.
   - Gemini Doll: Demis Hassabis-inspired creepy rabbit/eared strategist doll, behavioral role inspired by Bonnie/left-side pressure.
   - ChatGPT Doll: Sam Altman-inspired creepy bear/ringleader doll, behavioral role inspired by Freddy/stage leader.
   - Claude Doll: Dario Amodei-inspired creepy fox/curtain-runner doll, behavioral role inspired by Foxy/sudden sprint.
   These are stylized caricature toy dolls, not photorealistic portraits. Do not use real photos. Do not use real company logos. Do not copy FNAF character designs, textures, screenshots, names, or copyrighted assets. Use the role archetypes only.

7. Replace "night/day" with "month".
   The game concept is now: the player tries to survive month by month without paying for AI subscriptions.
   Use "1개월차" through "5개월차" instead of "1일차" through "5일차".
   Replace "6 AM" clear with "월말 정산 완료" or "이번 달 종료".
   Stage clear message:
   "이번달도 무사히 넘겼다. 역시 무료가 최고야."
   Show button:
   "다음 스테이지"
   Show current stage remaining token percentage with one decimal place.

8. Game over must show a subscription invoice.
   When defeated, show:
   "결제해버렸다..."
   Then show the bill based on the defeating doll:
   - Grok Doll: "Grok Heavy $300"
   - ChatGPT Doll: "ChatGPT Pro $200"
   - Claude Doll: "Claude Max $200"
   - Gemini Doll: "Google AI Ultra $249.99"
   Also show:
   - defeated by which doll
   - reached month/stage
   - each cleared stage’s remaining token percentage
   - failed current stage remaining token percentage and progress ratio
   - final score / total token score
   This is an in-game parody invoice only. Do not add real purchase links or any sign-up flow.

9. Claude/Foxy-type sprint must be implemented properly.
   Claude Doll should not behave like a normal path enemy.
   It must have a closet/curtain/start-room state with multiple visual stages, then suddenly disappear, then sprint through left hallway cameras.
   It must have actual generated sprint frames or high-quality pose images that create a convincing "와바바박 뛰어오는" effect.
   If the left door is closed in time, it bangs the door, drains extra tokens, then resets to an earlier closet stage.
   If left door is open, it jumpscares.

10. Starting stage CCTV must be visually interesting.
    Do not show four boring dolls lined up.
    The start/stage camera should show close-up faces and shoulders in darkness, like a creepy group photo through CCTV.
    Faces should loom close to the lens, partially cropped, with glowing eyes, awkward toy smiles, dark shadows, CRT static, and foreground occlusion.
    When a doll leaves, its face should be missing from the composition or replaced by an empty dark gap.

11. Add Light functionality.
    Office must have left and right light buttons.
    When a nearby enemy is at the door, holding or clicking Light reveals that enemy peeking from the doorway, only while the light is on.
    Light costs tokens.
    Light does not reveal Claude/Foxy while it is sprinting; Claude is handled by CCTV + left door timing.
    If an enemy has already entered the office, door/light buttons should click/fail briefly, creating panic.

12. CCTV room selection must support mouse clicks.
    Every camera box on the CCTV mini-map must be clickable.
    Left/right camera arrows can remain, but clickable map boxes are required.
    Active gameplay uses on-screen buttons and CCTV map clicks, not keyboard shortcuts.

13. Jumpscares must be much scarier.
    Use the uploaded reference collage as composition guidance only:
    - face fills most of the screen
    - tilted close-up angle
    - huge glassy eyes
    - open toy mouth
    - hard flash, static, shake, zoom
    - no gore
    - no blood
    - no graphic injury
    Generate new jumpscare assets for each doll with more disturbing framing and lighting.
    Use procedural WebAudio: sudden metallic scream/sting, static blast, low thud, fast modulation.
    Jumpscare duration around 1.1–1.4 seconds, with first 0.2 sec hard flash and zoom.

14. Final clear screen must say:
    "쌀먹의 신"
    Also show:
    "5개월 동안 단 한 번도 결제하지 않았습니다."
    Show each stage’s remaining token percentage:
    1개월차: 82.3%
    2개월차: ...
    Final total:
    "총 잔여 토큰량: 412.7"
    or
    "최종 점수: 412.7"
    The score is the sum of the remaining token percentages from cleared months, rounded to one decimal.

15. Update README and tests.
    README must explain the month/token concept, controls, light, randomized AI, and scoring.
    Tests must cover randomized behavior, camera-freeze behavior, scoring, no realtime score, no enemy map dots, and build success.

==================================================
IMPORTANT ASSET POLICY
==================================================

All visual assets must be generated by Codex image generation using $imagegen or created procedurally in code.

Forbidden:
- SVG
- external images
- downloaded photos
- real company logos
- FNAF screenshots
- copied FNAF assets
- copied FNAF character designs
- real photos of Elon Musk, Demis Hassabis, Sam Altman, or Dario Amodei
- copyrighted restaurant branding
- enemy position icons/dots on CCTV map

Allowed:
- original generated PNG/WebP assets
- stylized public-figure-inspired parody doll designs
- procedural canvas effects
- procedural WebAudio

Use generated assets only. Save them under assets/generated/. Update assets/generated/asset_manifest.json.

Keep fixed-canvas sprite rules:
- Each character pose asset should be transparent PNG/WebP on a fixed canvas.
- Do not auto-crop character pose images.
- Keep a consistent bottom-center pivot.
- Store pivot metadata in asset_manifest.json.
- Render all poses from their pivot, not top-left.
- If generated assets are cropped inconsistently, pad them in code or regenerate.

==================================================
NEW GAME TERMINOLOGY
==================================================

Replace terms:
- Night -> Month
- Day/Night clear -> Month clear
- Power -> Tokens
- Battery -> Tokens
- 6 AM -> Month End / 월말 정산 완료
- 1일차 -> 1개월차
- 5일차 -> 5개월차

Game title remains:
"저는 결제하라고 나오면 닫아버립니다"

Core joke:
The player is avoiding AI subscription popups and trying to survive for five months as a free-tier user.

HUD text:
- "남은 토큰 98.7%"
- "1개월차"
- "월초", "1주차", "2주차", "3주차", "4주차", "월말"
- "CCTV"
- "왼쪽 문"
- "오른쪽 문"
- "왼쪽 라이트"
- "오른쪽 라이트"

Do not show live score during active play.

==================================================
MONTH LENGTH AND PROGRESS
==================================================

Use prototype pacing:
MONTH_LENGTH_SECONDS = 90

Divide each month into 6 phases for AI level lookup:
phase 0: 월초
phase 1: 1주차
phase 2: 2주차
phase 3: 3주차
phase 4: 4주차
phase 5: 월말 직전

At the end of 90 seconds:
- stop enemies
- close CCTV
- unlock doors
- play procedural clear chime
- save remaining token percentage to stageTokenResults[currentMonth - 1]
- show month clear screen unless month 5 is cleared
- after month 5, show final clear screen

==================================================
TOKEN SYSTEM
==================================================

Start each month with:
tokens = 100.0

Display tokens with one decimal place.

Drain:
- base office drain: small
- CCTV open: additional drain
- each closed door: additional drain
- each light on: additional drain, slightly less than door but still meaningful
- Claude/Foxy door bang after successful block: instant token penalty that increases each time it is blocked

Example values, tune for fairness:
BASE_TOKEN_DRAIN_PER_SEC = 0.12
CCTV_TOKEN_DRAIN_PER_SEC = 0.32
DOOR_TOKEN_DRAIN_PER_SEC = 0.38 per closed door
LIGHT_TOKEN_DRAIN_PER_SEC = 0.24 per active light
MONTH_4_MULTIPLIER = 1.10
MONTH_5_MULTIPLIER = 1.18

Power-out equivalent:
If tokens reach 0:
- CCTV unavailable
- doors open and cannot close
- lights fail
- office becomes dark
- after a random delay, trigger a subscription blackout jumpscare unless the month ends first
- Game over invoice can use ChatGPT Doll or the nearest active enemy, but label it as "토큰 소진"

Do not make tokens drain so fast that a skilled player cannot clear.
Do not make tokens so generous that closing both doors forever works.

==================================================
FINAL SCORING
==================================================

The competition requires score implementation. The score is now token-based.

Do not show a live score while playing.

On month clear:
monthTokenScore = round(tokens * 10) / 10
Save it in stageTokenResults.
Show:
"이번달도 무사히 넘겼다. 역시 무료가 최고야."
"이번 스테이지 잔여 토큰: 83.4%"
"다음 스테이지"

On game over:
partialFailedMonthScore = round(tokens * survivedRatio * 10) / 10
finalScore = round((sum(cleared stageTokenResults) + partialFailedMonthScore) * 10) / 10

Show:
"결제해버렸다..."
invoice plan based on defeatedBy
"도달 스테이지: 3개월차"
"진행률: 68.2%"
"실패한 달 잔여 토큰: 41.5%"
"실패한 달 반영 점수: 28.3"
Then list cleared months:
"1개월차 잔여 토큰: 76.8%"
"2개월차 잔여 토큰: 62.2%"
Final:
"최종 점수: 167.3"

On full clear:
finalScore = round(sum(stageTokenResults) * 10) / 10
Show:
"쌀먹의 신"
"5개월 동안 단 한 번도 결제하지 않았습니다."
List all five months with one decimal:
"1개월차: 82.3%"
...
"총 잔여 토큰량: 412.7"
"최종 점수: 412.7"

==================================================
RANDOMIZED AI SYSTEM
==================================================

Replace fixed route timers with an AI action opportunity system.

Every enemy has:
- id
- displayName
- billingPlan
- role
- currentRoom
- side
- aiLevelsByMonthPhase
- actionCooldown
- actionIntervalMin
- actionIntervalMax
- route memory
- visualState
- enteredOffice
- blockedCount
- lastWatchedAt
- freezeAfterCameraCloseTimer
- aggression modifiers

Core action rule:
Every 3–5 seconds for Gemini/Grok/Claude, roll:
randomInt = integer 1..20
if currentAILevel >= randomInt:
    enemy gets an action opportunity
else:
    enemy stays

For ChatGPT/Freddy-type:
- check every 3.0 seconds
- use AI level roll
- if successful, apply a short movement countdown except on higher months
- camera watching can freeze it

Use real runtime randomness:
- Do not use a fixed seed for normal gameplay.
- Use Date.now(), crypto random, or Math.random for normal runs.
- A debug seed can exist only for tests.
- Same month replay should not produce identical movement sequences.

AI level table adapted to the 5-month game:
Use 6 phase values per month.

ChatGPT Doll / Sam-inspired / Freddy-role:
month 1: [0,0,0,0,0,0]
month 2: [0,0,0,0,0,0]
month 3: [1,1,1,1,1,1]
month 4: [2,2,2,2,2,2]
month 5: [3,3,3,3,3,3]

Gemini Doll / Hassabis-inspired / Bonnie-role / left side:
month 1: [0,0,1,2,3,3]
month 2: [3,3,4,5,6,6]
month 3: [0,0,1,2,3,3]
month 4: [2,2,3,4,5,5]
month 5: [5,5,6,7,8,8]

Grok Doll / Musk-inspired / Chica-role / right side:
month 1: [0,0,0,1,2,2]
month 2: [1,1,1,2,3,3]
month 3: [5,5,5,6,7,7]
month 4: [4,4,4,5,6,6]
month 5: [7,7,7,8,9,9]

Claude Doll / Amodei-inspired / Foxy-role / curtain runner:
month 1: [0,0,0,1,2,2]
month 2: [1,1,1,2,3,3]
month 3: [2,2,2,3,4,4]
month 4: [6,6,6,7,8,8]
month 5: [5,5,5,6,7,7]

Difficulty meaning:
0-2 easy
3-6 medium
7-12 hard
13-20 extreme

Action roll must create varied behavior. Do not fake randomness with fixed timers.

==================================================
CAMERA WATCH FREEZE RULE
==================================================

This rule is mandatory.

For Gemini, Grok, and ChatGPT:
If CCTV is open and selectedCamera === enemy.currentRoom:
- do not decrement action cooldown
- do not perform action opportunity
- do not advance route
- do not start attack
- render the enemy staring into the camera or frozen in a creepy pose
- allow only tiny eye flicker/static/twitch animation, not position change

If CCTV is open but another camera is selected:
- enemy may move normally according to AI rules

For Claude:
- While Claude is in closet/curtain stages, any CCTV being open should slow or pause its stage advancement briefly.
- Specifically checking the Claude closet camera should strongly freeze or reduce advancement.
- Once Claude has escaped and is sprinting, camera watching does not stop the sprint. The player can see it running through left hallway camera, then must close left door.

After closing CCTV:
- some characters may have a random "freezeAfterCameraCloseTimer" of 0.2–1.2 seconds to avoid instant unfair movement.
- Later months can reduce this grace.

Add tests:
- Place Gemini in LEFT_HALL_FAR. Open CCTV on LEFT_HALL_FAR for 30 simulated seconds. Assert Gemini does not change room.
- Place Grok in RIGHT_HALL_FAR. Open CCTV on RIGHT_HALL_FAR for 30 simulated seconds. Assert Grok does not change room.
- Place Claude in sprint state. Open CCTV on left hall. Assert sprint can continue.

==================================================
ENEMY BEHAVIOR DETAILS
==================================================

1. Gemini Doll / Hassabis-inspired / Bonnie-role
Primary side: left.

Personality:
- quiet, patient, unnerving
- appears as a rabbit/eared strategist doll with a Demis Hassabis-inspired face shape, glasses-like toy eye rims, and cold analytical eyes
- not a real portrait, not a logo

Routes:
- STAGE -> LOBBY -> BACKSTAGE -> SUPPLY_CLOSET -> LEFT_HALL_FAR -> LEFT_HALL_NEAR -> LEFT_DOOR
- May occasionally skip from BACKSTAGE or SUPPLY_CLOSET to LEFT_HALL_NEAR on higher months
- May backtrack one step on failed action or random branch
- After blocked at left door, usually returns to LOBBY, not always STAGE
- On low AI, may stay at left door for a while, forcing token pressure

Counter:
- Use left light to check door.
- If visible at left door, close left door.
- If door is closed when it attacks, it is repelled.

2. Grok Doll / Musk-inspired / Chica-role
Primary side: right.

Personality:
- louder, sudden, aggressive
- appears as a chicken/bird-like executive doll with Elon Musk-inspired facial caricature, sharp toy beak-like mouth, suit fragments, overly intense eyes
- not a real portrait, not a logo

Routes:
- STAGE -> LOBBY -> RESTROOMS -> SERVER_KITCHEN -> RIGHT_HALL_FAR -> RIGHT_HALL_NEAR -> RIGHT_DOOR
- Can visit an audio-only server/kitchen room where only clanking/electrical sound is heard
- May pause in server room
- May burst forward on high months

Counter:
- Use right light to check door.
- If visible at right door, close right door.
- If door is closed when it attacks, it is repelled.

3. ChatGPT Doll / Sam-inspired / Freddy-role
Primary side: stage leader, later right-side pressure.

Personality:
- calm, smiling, too polite, more frightening because it is restrained
- appears as a bear/ringleader doll with Sam Altman-inspired face, neat executive toy suit, fixed smile, round eyes
- not a real portrait, not a logo

Behavior:
- Mostly inactive until month 3.
- Moves less often than others but becomes dangerous once advanced.
- Route is mostly one-way:
  STAGE -> LOBBY -> RESTROOMS -> SERVER -> RIGHT_HALL_FAR -> RIGHT_HALL_NEAR -> RIGHT_DOOR
- It should rarely move backward.
- It can be frozen by watching its current camera.
- If it reaches RIGHT_HALL_NEAR, the player should rely on right door/light.
- If it has effectively entered the office, doors/lights may click-fail, and the next CCTV drop or short timer triggers jumpscare.

Special:
- On months 4–5, if ChatGPT is at RIGHT_HALL_NEAR, watching only the wrong camera should not stop it.
- Watching its exact current camera should stop it.

4. Claude Doll / Dario-inspired / Foxy-role
Primary side: left sprint.

Personality:
- hidden, fast, anxious, unnerving
- appears as a fox/curtain-runner doll with Dario Amodei-inspired facial caricature, thin anxious eyes, torn subscription cape, long angular snout-like mask
- not a real portrait, not a logo

States:
- CLOSET_STAGE_0: curtain closed / barely visible
- CLOSET_STAGE_1: curtain cracked / one eye visible
- CLOSET_STAGE_2: leaning out / staring at camera
- CLOSET_STAGE_3: gone / empty curtain
- SPRINT_ARMED: escaped, waiting for sprint trigger
- SPRINTING_LEFT_HALL: visible running through left hallway camera
- AT_LEFT_DOOR: resolves by left door state
- RESETTING

Action:
- On action opportunity, if not sufficiently watched, advance one closet stage.
- If player checks Claude closet camera, pause stage advancement.
- If player never opens CCTV for too long, Claude advances faster.
- At final stage, Claude disappears.
- After disappearing, either 25 seconds pass or player views a left hallway camera, then Claude sprints.
- Sprint should show animated running frames or a zooming sequence through CAM 2A / CAM 2B equivalent.

Block:
- If left door is closed when Claude reaches door:
  - play fast pounding sound
  - screen shake
  - subtract tokenPenalty = 1.0 + blockedCount * 4.0
  - increment blockedCount
  - reset Claude to CLOSET_STAGE_0 or CLOSET_STAGE_1 randomly
- If left door is open:
  - immediate fakeout -> jumpscare -> invoice

Light:
- Light does not reveal Claude during sprint. The player must use CCTV and timing.

==================================================
ROOMS AND CAMERAS
==================================================

Use FNAF-like camera naming but original room names.

Rooms:
- CAM_1A_STAGE / "CAM 1A: 무료 체험 무대"
- CAM_1B_LOBBY / "CAM 1B: 결제 대기실"
- CAM_1C_CLAUDE_CLOSET / "CAM 1C: 무료 체험 커튼"
- CAM_2A_LEFT_HALL_FAR / "CAM 2A: 왼쪽 복도"
- CAM_2B_LEFT_HALL_NEAR / "CAM 2B: 왼쪽 문 앞"
- CAM_3_SUPPLY_CLOSET / "CAM 3: 부품 창고"
- CAM_4A_RIGHT_HALL_FAR / "CAM 4A: 오른쪽 복도"
- CAM_4B_RIGHT_HALL_NEAR / "CAM 4B: 오른쪽 문 앞"
- CAM_5_BACKSTAGE / "CAM 5: 백스테이지"
- CAM_6_SERVER_KITCHEN / "CAM 6: 서버실", optional visual-noisy/audio-heavy camera
- CAM_7_RESTROOMS / "CAM 7: 정산 화장실"

Office is not a camera.

CCTV screen:
- Big CCTV feed with static.
- Mini-map overlay in lower-right or right side.
- Camera boxes are clickable.
- Selected camera box can be highlighted.
- Player office location may be shown as a "YOU" marker.
- Enemy positions must NOT be shown on the map.
- The only way to know where enemies are is by looking at the actual camera feed or using door lights.

Remove any function that draws enemy map dots.
Remove any "near room turns red" logic.
Remove any UI text that says exactly where an enemy is unless it is part of the actual camera feed.

Camera feed visuals:
- Integrate enemies into the room, not pasted as flat icons.
- Stage camera should use close-up faces, not a row of full-body dolls.
- Hallway cameras should show partial bodies, silhouettes, eyes, or side-peeking figures.
- Door-near camera can be empty sometimes, forcing light checks.
- Server/kitchen may be mostly static/audio with occasional silhouette.

==================================================
LIGHT SYSTEM
==================================================

Add office left/right light controls.

Input mapping:
- Mouse: click all UI controls.
- Office screen: click CCTV, left/right door, and left/right light buttons.
- CCTV screen: click close, previous/next camera buttons, or a camera box on the map.
- Active gameplay has no keyboard shortcuts, no in-game mute button, and no in-game reduce-motion button.

Office UI:
- Left side has door button and light button.
- Right side has door button and light button.
- Light should be visible as a cone/flash in office view.
- If enemy is at door:
  - Gemini appears peeking at left door when left light is on.
  - Grok appears peeking at right door when right light is on.
  - ChatGPT appears at right door when right light is on, if it has reached that area.
- If no enemy:
  - light shows empty hallway/door gap.
- If an enemy has already entered:
  - light/door buttons may click but fail.
  - This creates tension before jumpscare.

Light cost:
- drain tokens while light is active.
- if using hold behavior, drain only while held.
- if using toggle behavior, make it obvious and allow turning off.

==================================================
JUMPSCARE AND GAME OVER FLOW
==================================================

When an enemy enters:
1. Close CCTV automatically.
2. Show silent fakeout for 0.7–1.1 sec.
   - empty office
   - maybe buttons fail
   - audio goes low
   - no immediate text
3. Jumpscare:
   - use defeating doll’s generated jumpscare image
   - face fills screen
   - shake, zoom, CRT distortion, white static flashes
   - procedural sting/scream
   - show "돈내!!!!" for a few frames
4. Game over invoice screen:
   - "결제해버렸다..."
   - invoice plan
   - defeated by
   - reached month
   - token results
   - final score
   - buttons: "다시하기", "나가기"

Do not use gore.
Do not use blood.
Do not use graphic injury.
Make it scary through framing, sound, speed, static, and expression.

==================================================
ASSET GENERATION LIST
==================================================

Regenerate or add these assets with $imagegen.

Style:
- dark CCTV survival horror
- Korean AI subscription parody
- generated toy dolls
- public-figure-inspired caricature dolls, stylized not photorealistic
- CRT static, low light, hard shadows
- unsettling toy faces
- non-gory

Office:
- office_main_month.png: first-person office, monitor, left/right doors, AI billing posters, dark server ambience
- office_left_light_empty.png
- office_right_light_empty.png
- office_left_light_gemini_peek.png
- office_right_light_grok_peek.png
- office_right_light_chatgpt_peek.png
- office_left_door_closed.png
- office_right_door_closed.png
- office_powerout_tokens_empty.png
- monitor_frame_crt.png

CCTV backgrounds:
- cam_1a_stage_missing_claude.png: creepy close-up ChatGPT/Gemini/Grok trio composition, not row of dolls
- cam_1a_stage_chatgpt_only.png
- cam_1a_stage_gemini_only.png
- cam_1a_stage_grok_only.png
- cam_1a_stage_chatgpt_gemini.png
- cam_1a_stage_chatgpt_grok.png
- cam_1a_stage_gemini_grok.png
- cam_1a_stage_empty.png
- cam_1b_lobby_paywall.png
- cam_1c_claude_closet_stage0.png
- cam_1c_claude_closet_stage1.png
- cam_1c_claude_closet_stage2.png
- cam_1c_claude_closet_empty.png
- cam_2a_left_hall_far.png
- cam_2b_left_hall_near.png
- cam_4a_right_hall_far.png
- cam_4b_right_hall_near.png
- cam_6_server_kitchen.png

Character transparent pose assets, fixed canvas:
For each Gemini/Grok/ChatGPT:
- idle_close
- hallway_far
- hallway_near
- door_peek
- camera_stare
- jumpscare

For Claude:
- closet_peek1
- closet_peek2
- closet_out
- sprint_01
- sprint_02
- sprint_03
- sprint_04
- door_bang
- jumpscare

Jumpscare assets:
- jumpscare_gemini.png
- jumpscare_grok.png
- jumpscare_chatgpt.png
- jumpscare_claude.png
Each should have a face-filling close-up, tilted camera angle, scary toy eyes/mouth, no gore.

UI/effects:
- title_screen_month.png
- invoice_bg.png
- clear_bg_ssalmeok_god.png
- static_overlay.png
- warning_vignette.png
- paywall_popup_generated.png

Asset quality requirement:
- Title, office, CCTV stage, jumpscares: high quality.
- No obviously flat placeholder drawings.
- If an asset is too cute or generic, regenerate it.
- If a character does not look distinct, regenerate it.
- If text inside generated image is unreadable, render the text with canvas instead of relying on image text.

==================================================
RENDERING REQUIREMENTS
==================================================

Do not draw enemies as colored circles or dots.
Do not draw enemies on the map.
Do not red-highlight near rooms.
Do not paste sprites flatly without scale/shadow.

Implement:
- room-specific anchors
- depth scaling
- alpha/silhouette blending
- static overlay
- camera distortion
- occasional frame jitter
- low visibility, but fair enough to see if carefully watched
- camera stare pose when watched

CCTV map:
- clickable camera rectangles
- selected camera highlight only
- no enemy dots
- no enemy labels on map
- optional "REC" red dot as recording indicator only, not enemy marker

HUD:
- active play: no score number
- show "남은 토큰 98.7%"
- show month and phase
- show controls compactly

==================================================
CODE CHANGES TO PRIORITIZE
==================================================

Likely files to update:
- src/game/constants.js
- src/game/enemies.js
- src/game/state.js
- src/game/render.js
- src/game/score.js
- src/game/assets.js
- src/game/audio.js
- tests

Remove or replace:
- getHudScore usage during gameplay
- live score drawing
- enemy map dot drawing
- red near-room display
- fixed seeded run behavior for normal play
- deterministic same route path for all month 1 enemies
- "day/night" text
- "power" text, replacing with token text

Add:
- month terminology
- stageTokenResults array
- token scoring functions
- invoice data map
- light state
- camera click hitboxes
- AI action opportunity scheduler
- watched-camera freeze rule
- Claude/Foxy special state machine
- more varied route branching for Gemini/Grok
- ChatGPT/Freddy-style one-way pressure
- tests

==================================================
TESTS / VALIDATION
==================================================

Add or update automated tests where possible.

Required tests:
1. Random distribution test:
   Simulate month 1 at least 50 times with different random seeds.
   Assert that not all runs produce the exact same first two enemy approaches.
   Assert at least one left-side and one right-side approach can occur across the set.

2. Watched camera freeze test:
   Put Gemini in CAM_2A_LEFT_HALL_FAR.
   Open CCTV on CAM_2A_LEFT_HALL_FAR.
   Simulate 30 seconds.
   Assert Gemini remains in that room.

3. Wrong camera no-freeze test:
   Put Grok in CAM_4A_RIGHT_HALL_FAR.
   Open CCTV on CAM_1A_STAGE.
   Simulate long enough for action opportunities.
   Assert Grok can move if AI roll succeeds.

4. Claude sprint exception test:
   Put Claude in SPRINTING_LEFT_HALL.
   Open CCTV on left hallway.
   Assert sprint state can advance.

5. No realtime score test:
   Render active office state.
   Assert no "점수" or numeric final score HUD is drawn during gameplay, except token percentage.

6. Token scoring test:
   Given cleared months [80.1, 70.2] and failed month tokens 50.0 with progress 0.5, final game over score is 175.3.
   Given cleared months [80.1,70.2,60.3,50.4,40.5], final clear score is 301.5.

7. Map no enemy dots test:
   Ensure CCTV map render function receives only selected camera and camera hitboxes, not enemy position markers.
   If hard to assert visually, assert there is no function or branch named drawEnemyDots/drawEnemyMapMarkers.

8. Build test:
   npm run build must pass.

Manual validation checklist in README:
- Month 1 is easy but not fixed.
- Watching a room freezes visible non-Claude enemies.
- Claude can sprint.
- Lights reveal door enemies.
- CCTV map has no enemy dots.
- No red near warning.
- No live score increase.
- Game over invoice appears.
- Month clear shows remaining tokens.
- Final clear says "쌀먹의 신".

==================================================
DONE WHEN
==================================================

You are done only when:
- npm install succeeds if needed.
- npm run test passes.
- npm run build passes.
- Game launches locally.
- Title screen works.
- Start begins 1개월차.
- CCTV opens/closes.
- CCTV camera boxes are clickable with mouse.
- Mouse/touch controls work.
- Enemies move with randomized action opportunities.
- Month 1 does not always play the same route.
- Non-Claude enemies freeze when the player watches their current camera.
- Claude has curtain stages and sprint behavior.
- Left/right lights exist and consume tokens.
- Lights reveal door enemies when appropriate.
- Token percentage displays with one decimal.
- No live score appears during gameplay.
- Red near-room markers are gone.
- Enemy map dots are gone.
- Game over shows fakeout -> scarier jumpscare -> invoice.
- Invoice uses the correct plan for the defeating doll.
- Month clear says "이번달도 무사히 넘겼다. 역시 무료가 최고야."
- 5-month clear says "쌀먹의 신".
- Final token score is calculated and shown.
- All required generated assets are local.
- No SVG exists.
- No external images/audio/fonts/CDNs are used.
- README documents controls, month/token concept, scoring, and tests.

Do not stop until all of the above are true.
