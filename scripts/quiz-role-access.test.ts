import assert from "node:assert/strict";
import { canManageCourseQuiz } from "../lib/quiz-role-access";

assert.equal(
  canManageCourseQuiz({
    access: {
      role: "ADMIN",
      permissions: [],
      readOnly: true,
      canDelete: false,
    },
    method: "DELETE",
  }),
  true,
  "admins should always manage quizzes",
);

for (const method of ["GET", "POST", "PUT", "DELETE"]) {
  assert.equal(
    canManageCourseQuiz({
      access: {
        role: "CUSTOM_COURSE_EDITOR",
        permissions: ["courses"],
        readOnly: false,
        canDelete: true,
      },
      method,
    }),
    true,
    `writable course roles should be allowed to ${method} quizzes`,
  );
}

for (const method of ["POST", "PUT", "DELETE"]) {
  assert.equal(
    canManageCourseQuiz({
      access: {
        role: "COURSE_VIEWER",
        permissions: ["courses"],
        readOnly: true,
        canDelete: true,
      },
      method,
    }),
    false,
    `read-only course roles should not be allowed to ${method} quizzes`,
  );
}

assert.equal(
  canManageCourseQuiz({
    access: {
      role: "COURSE_VIEWER",
      permissions: ["courses"],
      readOnly: true,
      canDelete: false,
    },
    method: "GET",
  }),
  true,
  "read-only course roles should be able to read quizzes",
);

assert.equal(
  canManageCourseQuiz({
    access: {
      role: "COURSE_EDITOR",
      permissions: ["courses"],
      readOnly: false,
      canDelete: false,
    },
    method: "DELETE",
  }),
  false,
  "course roles without delete permission should not delete whole quizzes",
);

assert.equal(
  canManageCourseQuiz({
    access: {
      role: "OTHER_EDITOR",
      permissions: ["mocks"],
      readOnly: false,
      canDelete: true,
    },
    method: "GET",
  }),
  false,
  "roles without courses permission should not access quizzes",
);

console.log("quiz role access tests passed");
