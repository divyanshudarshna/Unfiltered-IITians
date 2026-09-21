import assert from "node:assert/strict";
import {
  canPerformAdminAction,
  getApiErrorMessage,
} from "../lib/admin-client-access";
import { normalizeMsqAnswers } from "../lib/mock-question-utils";

const quizModuleEditor = {
  role: "CUSTOM_QUIZ_MODULE_EDITOR",
  permissions: ["courses", "mocks"] as const,
  readOnly: false,
  canDelete: false,
};

assert.equal(
  canPerformAdminAction(quizModuleEditor, "courses", "PUT"),
  true,
  "a writable quiz editor should be able to save module questions",
);
assert.equal(
  canPerformAdminAction(quizModuleEditor, "mocks", "POST"),
  true,
  "a writable quiz editor should be able to add mock questions",
);
assert.equal(
  canPerformAdminAction(quizModuleEditor, "mocks", "DELETE"),
  false,
  "a role without delete permission should not see destructive mock actions",
);
assert.equal(
  canPerformAdminAction({ ...quizModuleEditor, readOnly: true }, "mocks", "PUT"),
  false,
  "read-only roles should not see mock editing actions",
);
assert.equal(
  canPerformAdminAction(
    { role: "ADMIN", permissions: [], readOnly: true, canDelete: false },
    "mocks",
    "DELETE",
  ),
  true,
  "admins should retain unrestricted access",
);

assert.deepEqual(normalizeMsqAnswers("First; Second ;"), ["First", "Second"]);
assert.deepEqual(normalizeMsqAnswers(["First", " Second ", ""]), ["First", "Second"]);
assert.deepEqual(normalizeMsqAnswers(""), []);

async function testApiErrors() {
  assert.equal(
    await getApiErrorMessage(
      new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
      "Failed to save question",
    ),
    "Forbidden",
    "module saves should surface the API error message",
  );
  assert.equal(
    await getApiErrorMessage(new Response("not json", { status: 500 }), "Failed to save question"),
    "Failed to save question",
    "invalid API responses should use the safe fallback",
  );
}

void testApiErrors().then(() => {
  console.log("quiz management regression tests passed");
});
