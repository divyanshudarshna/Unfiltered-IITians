import assert from "node:assert/strict";
import { calculateAverageModuleQuizScore } from "../lib/admin-enrollment-metrics";

assert.equal(
  calculateAverageModuleQuizScore([
    { quizScore: 8, totalQuizQuestions: 10 },
    { quizScore: 3, totalQuizQuestions: 5 },
  ]),
  70,
  "averages module quiz percentages"
);

assert.equal(
  calculateAverageModuleQuizScore([
    { quizScore: 4, totalQuizQuestions: null, content: { quiz: { questions: [{}, {}, {}, {}] } } },
  ]),
  100,
  "falls back to the module quiz question count when stored total is missing"
);

assert.equal(
  calculateAverageModuleQuizScore([{ quizScore: null, totalQuizQuestions: 10 }]),
  null,
  "returns null when no quiz score exists"
);

console.log("admin-enrollment-metrics tests passed");
