export function simpleAnswerCheck(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
}
