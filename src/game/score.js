export function roundTenth(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
}

export function calculateMonthTokenScore(tokens) {
  return roundTenth(Math.max(0, Math.min(100, tokens)));
}

export function calculateGameOverTokenScore({
  clearedTokenResults,
  failedMonthTokens,
  survivedRatio
}) {
  const safeCleared = clearedTokenResults.filter((score) => Number.isFinite(score));
  const partialFailedMonthScore = roundTenth(
    Math.max(0, Math.min(100, failedMonthTokens)) * Math.max(0, Math.min(1, survivedRatio))
  );
  const finalScore = roundTenth(sumScores(safeCleared) + partialFailedMonthScore);
  return { partialFailedMonthScore, finalScore };
}

export function calculateFinalTokenScore(stageTokenResults) {
  return roundTenth(sumScores(stageTokenResults.filter((score) => Number.isFinite(score))));
}

export function sumScores(scores) {
  return roundTenth(scores.reduce((total, score) => total + score, 0));
}
