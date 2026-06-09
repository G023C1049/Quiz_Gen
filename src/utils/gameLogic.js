export const calculateScore = (isCorrect, pointsPerCorrect = GAME_CONSTANTS.POINTS_PER_CORRECT) => {
  return isCorrect ? pointsPerCorrect : 0;
};

export const GAME_CONSTANTS = {
  POINTS_PER_CORRECT: 3,
  EXCELLENT_THRESHOLD: 0.8,
  GOOD_THRESHOLD: 0.5,
  GEMINI_API_KEY: 'AIzaSyBnI0ka0-96Jcr8vfUv5fzEbNZWY_b3ksw'
};

export const validateAnswer = (userAnswer, correctAnswer) => {
  // 文字列の場合は大文字小文字を無視して比較
  if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
    return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  }
  
  // その他の場合は厳密等価で比較
  return userAnswer === correctAnswer;
};

export const calculateAccuracy = (score, totalQuestions, pointsPerCorrect = GAME_CONSTANTS.POINTS_PER_CORRECT) => {
  return Math.round((score / (totalQuestions * pointsPerCorrect)) * 100);
};

export const generateOpponentScore = (maxScore = 15) => {
  return Math.floor(Math.random() * maxScore);
};

export const shuffleQuestions = (questions, count) => {
  return [...questions].sort(() => Math.random() - 0.5).slice(0, count);
};

export const determineResult = (playerScore, opponentScore, playMode, totalQuestions) => {
  if (playMode === 'solo') {
    if (playerScore >= (totalQuestions * GAME_CONSTANTS.EXCELLENT_THRESHOLD)) return 'excellent';
    if (playerScore >= (totalQuestions * GAME_CONSTANTS.GOOD_THRESHOLD)) return 'good';
    return 'tryagain';
  } else {
    if (playerScore > opponentScore) return 'win';
    if (playerScore < opponentScore) return 'lose';
    return 'draw';
  }

};
