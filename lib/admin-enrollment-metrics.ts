type ProgressWithQuiz = {
  quizScore: number | null;
  totalQuizQuestions: number | null;
  content?: {
    quiz?: {
      questions?: unknown;
    } | null;
  } | null;
};

function getQuizQuestionCount(questions: unknown): number | null {
  return Array.isArray(questions) && questions.length > 0 ? questions.length : null;
}

export function calculateAverageModuleQuizScore(progressRows: ProgressWithQuiz[]): number | null {
  const quizScores = progressRows
    .map((progress) => {
      if (progress.quizScore === null) return null;

      const totalQuestions = progress.totalQuizQuestions ?? getQuizQuestionCount(progress.content?.quiz?.questions);
      if (!totalQuestions || totalQuestions <= 0) return null;

      return (progress.quizScore / totalQuestions) * 100;
    })
    .filter((score): score is number => score !== null);

  return quizScores.length > 0
    ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length)
    : null;
}
