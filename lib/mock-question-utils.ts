export function normalizeMsqAnswers(answer: string | string[]) {
  const answers = Array.isArray(answer) ? answer : answer.split(";");
  return answers.map((option) => option.trim()).filter(Boolean);
}
