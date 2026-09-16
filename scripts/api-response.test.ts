import assert from "node:assert/strict";
import { ApiResponseError, readApiResponse } from "../lib/api-response";

async function run() {
  const payload = await readApiResponse<{ id: string }>(
    new Response(JSON.stringify({ id: "course-1" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
    "Unable to save course",
  );
  assert.deepEqual(payload, { id: "course-1" });

  await assert.rejects(
  () => readApiResponse(
    new Response("<!DOCTYPE html><html><body>Not Found</body></html>", {
      status: 404,
      headers: { "Content-Type": "text/html" },
    }),
    "Unable to save course",
  ),
  (error: unknown) => {
    assert.ok(error instanceof ApiResponseError);
    assert.equal(error.status, 404);
    assert.equal(error.message, "Unable to save course (HTTP 404)");
    return true;
  },
);

  await assert.rejects(
  () => readApiResponse(
    new Response(JSON.stringify({ error: "Unauthorized", razorpayPlanId: "plan_123" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }),
    "Unable to save course",
  ),
  (error: unknown) => {
    assert.ok(error instanceof ApiResponseError);
    assert.equal(error.status, 401);
    assert.equal(error.message, "Unauthorized");
    assert.deepEqual(error.body, { error: "Unauthorized", razorpayPlanId: "plan_123" });
    return true;
  },
);

  await assert.rejects(
  () => readApiResponse(
    new Response("<!DOCTYPE html><html><body>Sign in</body></html>", {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }),
    "Unable to save course",
  ),
  (error: unknown) => {
    assert.ok(error instanceof ApiResponseError);
    assert.equal(error.status, 200);
    assert.equal(error.message, "Unable to save course: server returned an unexpected response");
    return true;
  },
);

  console.log("API response tests passed");
}

void run();
