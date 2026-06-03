export const GAME_TITLE = '저는 결제하라고 나오면 닫아버립니다';
export const MONTH_LENGTH_SECONDS = 535;
export const MONTH_COUNT = 5;
export const MONTH_PHASE_START_SECONDS = Object.freeze([0, 90, 179, 268, 357, 446]);

export const MONTH_PHASES = Object.freeze([
  '월초',
  '1주차',
  '2주차',
  '3주차',
  '4주차',
  '월말 직전'
]);

export const ROOMS = Object.freeze({
  CAM_1A_STAGE: 'CAM_1A_STAGE',
  CAM_1B_LOBBY: 'CAM_1B_LOBBY',
  CAM_1C_CLAUDE_CLOSET: 'CAM_1C_CLAUDE_CLOSET',
  CAM_2A_LEFT_HALL_FAR: 'CAM_2A_LEFT_HALL_FAR',
  CAM_2B_LEFT_HALL_NEAR: 'CAM_2B_LEFT_HALL_NEAR',
  CAM_3_SUPPLY_CLOSET: 'CAM_3_SUPPLY_CLOSET',
  CAM_4A_RIGHT_HALL_FAR: 'CAM_4A_RIGHT_HALL_FAR',
  CAM_4B_RIGHT_HALL_NEAR: 'CAM_4B_RIGHT_HALL_NEAR',
  CAM_5_BACKSTAGE: 'CAM_5_BACKSTAGE',
  CAM_6_SERVER_KITCHEN: 'CAM_6_SERVER_KITCHEN',
  LEFT_DOOR: 'LEFT_DOOR',
  RIGHT_DOOR: 'RIGHT_DOOR'
});

export const CAMERAS = Object.freeze([
  ROOMS.CAM_1A_STAGE,
  ROOMS.CAM_1B_LOBBY,
  ROOMS.CAM_1C_CLAUDE_CLOSET,
  ROOMS.CAM_2A_LEFT_HALL_FAR,
  ROOMS.CAM_2B_LEFT_HALL_NEAR,
  ROOMS.CAM_3_SUPPLY_CLOSET,
  ROOMS.CAM_4A_RIGHT_HALL_FAR,
  ROOMS.CAM_4B_RIGHT_HALL_NEAR,
  ROOMS.CAM_5_BACKSTAGE,
  ROOMS.CAM_6_SERVER_KITCHEN
]);

export const CAMERA_LABELS = Object.freeze({
  [ROOMS.CAM_1A_STAGE]: 'CAM 1A: 무료 체험 무대',
  [ROOMS.CAM_1B_LOBBY]: 'CAM 1B: 결제 대기실',
  [ROOMS.CAM_1C_CLAUDE_CLOSET]: 'CAM 1C: 무료 체험 커튼',
  [ROOMS.CAM_2A_LEFT_HALL_FAR]: 'CAM 2A: 왼쪽 복도',
  [ROOMS.CAM_2B_LEFT_HALL_NEAR]: 'CAM 2B: 왼쪽 문 앞',
  [ROOMS.CAM_3_SUPPLY_CLOSET]: 'CAM 3: 부품 창고',
  [ROOMS.CAM_4A_RIGHT_HALL_FAR]: 'CAM 4A: 오른쪽 복도',
  [ROOMS.CAM_4B_RIGHT_HALL_NEAR]: 'CAM 4B: 오른쪽 문 앞',
  [ROOMS.CAM_5_BACKSTAGE]: 'CAM 5: 백스테이지',
  [ROOMS.CAM_6_SERVER_KITCHEN]: 'CAM 6: 서버실'
});

export const INVOICE_PLANS = Object.freeze({
  gemini: 'Google AI Ultra $249.99',
  grok: 'Grok Heavy $300',
  chatgpt: 'ChatGPT Pro $200',
  claude: 'Claude Max $200',
  tokenOut: '토큰 소진'
});

export const UI_TEXT = Object.freeze({
  start: '시작',
  howToPlay: '조작법',
  retry: '다시하기',
  exit: '나가기',
  nextStage: '다음 스테이지',
  monthClear: '이번달도 무사히 넘겼다. 역시 무료가 최고야.',
  monthEnd: '월말 정산 완료',
  token: '남은 토큰',
  leftDoor: '왼쪽 문',
  rightDoor: '오른쪽 문',
  leftLight: '왼쪽 라이트',
  rightLight: '오른쪽 라이트',
  cctv: 'CCTV',
  warning: '돈내!!!!',
  gameOver: '결제해버렸다...',
  finalClearTitle: '쌀먹의 신',
  finalClearBody: '5개월 동안 단 한 번도 결제하지 않았습니다.'
});

export function getMonthLabel(month) {
  return `${month}개월차`;
}

export function getPhaseIndex(elapsedSeconds) {
  if (elapsedSeconds >= MONTH_LENGTH_SECONDS) return MONTH_PHASES.length - 1;
  for (let index = MONTH_PHASE_START_SECONDS.length - 1; index >= 0; index -= 1) {
    if (elapsedSeconds >= MONTH_PHASE_START_SECONDS[index]) return index;
  }
  return 0;
}

export function getPhaseLabel(elapsedSecondsOrIndex) {
  const index = Number.isInteger(elapsedSecondsOrIndex) && elapsedSecondsOrIndex >= 0 && elapsedSecondsOrIndex < MONTH_PHASES.length
    ? elapsedSecondsOrIndex
    : getPhaseIndex(elapsedSecondsOrIndex);
  return MONTH_PHASES[Math.max(0, Math.min(MONTH_PHASES.length - 1, index))];
}

export function getProgressRatio(elapsedSeconds) {
  return Math.max(0, Math.min(1, elapsedSeconds / MONTH_LENGTH_SECONDS));
}
