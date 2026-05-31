export const GAME_TITLE = '저는 결제하라고 나오면 닫아버립니다';
export const NIGHT_LENGTH_SECONDS = 90;
export const HOURS_PER_NIGHT = 6;
export const ATTACK_WINDOWS = Object.freeze({
  1: 2.4,
  2: 2.1,
  3: 1.8,
  4: 1.5,
  5: 1.25
});

export const ROOMS = Object.freeze({
  STAGE: 'STAGE',
  LOBBY: 'LOBBY',
  SERVER: 'SERVER',
  STORAGE: 'STORAGE',
  LEFT_HALL_FAR: 'LEFT_HALL_FAR',
  LEFT_HALL_NEAR: 'LEFT_HALL_NEAR',
  RIGHT_HALL_FAR: 'RIGHT_HALL_FAR',
  RIGHT_HALL_NEAR: 'RIGHT_HALL_NEAR',
  OFFICE_LEFT_ATTACK: 'OFFICE_LEFT_ATTACK',
  OFFICE_RIGHT_ATTACK: 'OFFICE_RIGHT_ATTACK'
});

export const CAMERAS = Object.freeze([
  'STAGE',
  'LOBBY',
  'SERVER',
  'STORAGE',
  'LEFT_HALL_FAR',
  'LEFT_HALL_NEAR',
  'RIGHT_HALL_FAR',
  'RIGHT_HALL_NEAR'
]);

export const CAMERA_LABELS = Object.freeze({
  STAGE: 'CAM 01 / 시작실',
  LOBBY: 'CAM 02 / 결제 키오스크',
  SERVER: 'CAM 03 / 서버 복도',
  STORAGE: 'CAM 04 / 보관실',
  LEFT_HALL_FAR: 'CAM 05 / 왼쪽 먼 복도',
  LEFT_HALL_NEAR: 'CAM 06 / 왼쪽 문 앞',
  RIGHT_HALL_FAR: 'CAM 07 / 오른쪽 먼 복도',
  RIGHT_HALL_NEAR: 'CAM 08 / 오른쪽 문 앞'
});

export const UI_TEXT = Object.freeze({
  start: '시작',
  howToPlay: '조작법',
  retry: '다시하기',
  exit: '나가기',
  nextNight: '다음 밤',
  power: '전력',
  score: '점수',
  leftDoor: '왼쪽 문',
  rightDoor: '오른쪽 문',
  warning: '내놔!!!!',
  cctv: 'CCTV'
});

export function getClockLabel(elapsedSeconds) {
  if (elapsedSeconds >= NIGHT_LENGTH_SECONDS) return '6 AM';
  const hourIndex = Math.max(
    0,
    Math.min(HOURS_PER_NIGHT - 1, Math.floor(elapsedSeconds / (NIGHT_LENGTH_SECONDS / HOURS_PER_NIGHT)))
  );
  return hourIndex === 0 ? '12 AM' : `${hourIndex} AM`;
}

export function getNightLabel(night) {
  return `${night}일차`;
}

export function getAttackWindow(night) {
  return ATTACK_WINDOWS[Math.max(1, Math.min(5, night))];
}
