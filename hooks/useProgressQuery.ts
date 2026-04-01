import { useQuery } from "@tanstack/react-query";

// Query keys
export const progressKeys = {
  all: ["progress"] as const,
  courseProgress: (courseId: string) => ["progress", "course", courseId] as const,
  userProgress: (userId: string) => ["progress", "user", userId] as const,
};

export const mockTestKeys = {
  all: ["mock-tests"] as const,
  list: () => ["mock-tests", "list"] as const,
  detail: (id: string) => ["mock-tests", "detail", id] as const,
  attempts: (userId: string) => ["mock-tests", "attempts", userId] as const,
};

// Type definitions
interface CourseProgress {
  courseId: string;
  userId: string;
  completed: boolean;
  completedLectures: number;
  totalLectures: number;
  progressPercentage: number;
}

interface MockTest {
  id: string;
  title: string;
  description?: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
}

interface MockAttempt {
  id: string;
  mockTestId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  submittedAt: string;
}

// Fetch course progress
async function fetchCourseProgress(courseId: string): Promise<CourseProgress> {
  const response = await fetch(`/api/progress/course/${courseId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch course progress");
  }
  return response.json();
}

// Hook to fetch course progress
export function useCourseProgressQuery(courseId: string) {
  return useQuery({
    queryKey: progressKeys.courseProgress(courseId),
    queryFn: () => fetchCourseProgress(courseId),
    enabled: !!courseId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch mock tests
async function fetchMockTests(): Promise<MockTest[]> {
  const response = await fetch("/api/mock-tests");
  if (!response.ok) {
    throw new Error("Failed to fetch mock tests");
  }
  return response.json();
}

// Hook to fetch mock tests
export function useMockTestsQuery() {
  return useQuery({
    queryKey: mockTestKeys.list(),
    queryFn: fetchMockTests,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch mock test attempts
async function fetchMockAttempts(userId: string): Promise<MockAttempt[]> {
  const response = await fetch(`/api/mock-tests/attempts?userId=${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch mock attempts");
  }
  return response.json();
}

// Hook to fetch mock test attempts
export function useMockAttemptsQuery(userId: string) {
  return useQuery({
    queryKey: mockTestKeys.attempts(userId),
    queryFn: () => fetchMockAttempts(userId),
    enabled: !!userId,
    staleTime: 60 * 1000, // 60 seconds
  });
}
