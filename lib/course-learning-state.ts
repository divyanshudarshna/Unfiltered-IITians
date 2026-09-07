type LectureProgressLike = {
  lectureId: string | null;
  completed: boolean;
};

type LectureUpdateLike<TId extends string = string> = {
  id: TId;
  createdAt: Date | null;
};

export function getCompletedLectureIds(progressRows: LectureProgressLike[]) {
  return new Set(
    progressRows
      .filter((progress) => progress.completed && progress.lectureId)
      .map((progress) => progress.lectureId as string),
  );
}

export function getUnreadLectureUpdates<T extends LectureUpdateLike>(lectures: T[], lastSeenAt: Date) {
  return lectures.filter((lecture) => lecture.createdAt !== null && lecture.createdAt > lastSeenAt);
}
