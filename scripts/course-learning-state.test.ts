import assert from "node:assert/strict";
import {
  getCompletedLectureIds,
  getUnreadLectureUpdates,
} from "../lib/course-learning-state";

assert.deepEqual(
  getCompletedLectureIds([
    { lectureId: "lecture-1", completed: true },
    { lectureId: "lecture-2", completed: false },
    { lectureId: null, completed: true },
  ]),
  new Set(["lecture-1"]),
);

const lastSeenAt = new Date("2026-09-01T10:00:00.000Z");
const updates = getUnreadLectureUpdates(
  [
    { id: "old", title: "Existing lecture", createdAt: new Date("2026-09-01T09:59:59.000Z") },
    { id: "new", title: "New lecture", createdAt: new Date("2026-09-01T10:00:01.000Z") },
    { id: "legacy", title: "Legacy lecture", createdAt: null },
  ],
  lastSeenAt,
);

assert.deepEqual(updates.map((lecture) => lecture.id), ["new"]);
assert.equal(getUnreadLectureUpdates(updates, new Date("2026-09-01T10:00:01.000Z")).length, 0);

console.log("course learning state tests passed");
