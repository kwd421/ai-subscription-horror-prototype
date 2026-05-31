export function calculateNightScore({
  currentNight,
  remainingPower,
  successfulDoorBlocks,
  cameraUseSeconds,
  doorClosedSeconds
}) {
  return (
    currentNight * 1000 +
    Math.floor(remainingPower * 35) +
    successfulDoorBlocks * 150 +
    Math.max(0, 500 - Math.floor(cameraUseSeconds * 3)) +
    Math.max(0, 500 - Math.floor(doorClosedSeconds * 2))
  );
}

export function calculatePartialScore({
  completedNights,
  survivedTimeRatio,
  remainingPower,
  successfulDoorBlocks
}) {
  return (
    completedNights * 1000 +
    Math.floor(survivedTimeRatio * 800) +
    Math.floor(remainingPower * 10) +
    successfulDoorBlocks * 75
  );
}

export function sumScores(scores) {
  return scores.reduce((total, score) => total + score, 0);
}
