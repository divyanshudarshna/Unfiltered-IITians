import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Query keys for cache invalidation
export const courseKeys = {
  all: ["courses"] as const,
  list: (filters?: Record<string, unknown>) => ["courses", "list", filters] as const,
  detail: (id: string) => ["courses", "detail", id] as const,
  myCourses: () => ["courses", "my-courses"] as const,
  batchStatus: (courseIds: string[]) => ["courses", "batch-status", courseIds] as const,
};

// Type definitions
interface Course {
  id: string;
  title: string;
  description?: string;
  status: string;
  price?: number;
  actualPrice?: number;
  durationMonths?: number;
  enrolledStudents?: number;
  courseType?: string;
  thumbnail?: string;
  order?: number;
  createdAt?: string;
}

interface CourseDetails extends Course {
  lectures?: unknown[];
  enrollmentCount?: number;
  instructor?: unknown;
}

interface BatchStatusResponse {
  courseId: string;
  isEnrolled: boolean;
  hasAccess: boolean;
  expiresAt?: string;
}

// Fetch all courses
async function fetchCourses(): Promise<Course[]> {
  const response = await fetch("/api/courses");
  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }
  return response.json();
}

// Hook to fetch all courses
export function useCoursesQuery() {
  return useQuery({
    queryKey: courseKeys.list(),
    queryFn: fetchCourses,
    staleTime: 60 * 1000, // 60 seconds
  });
}

// Fetch course details by ID
async function fetchCourseDetails(id: string): Promise<CourseDetails> {
  const response = await fetch(`/api/course-details/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch course details");
  }
  return response.json();
}

// Hook to fetch course details
export function useCourseDetailsQuery(id: string) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => fetchCourseDetails(id),
    enabled: !!id, // Only run if ID is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch my enrolled courses
async function fetchMyCourses(): Promise<Course[]> {
  const response = await fetch("/api/my-courses");
  if (!response.ok) {
    throw new Error("Failed to fetch my courses");
  }
  return response.json();
}

// Hook to fetch my courses
export function useMyCoursesQuery() {
  return useQuery({
    queryKey: courseKeys.myCourses(),
    queryFn: fetchMyCourses,
    staleTime: 60 * 1000, // 60 seconds
  });
}

// Batch fetch enrollment status for multiple courses
async function fetchBatchStatus(courseIds: string[]): Promise<Record<string, BatchStatusResponse>> {
  const response = await fetch("/api/courses/batch-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseIds }),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch batch status");
  }
  return response.json();
}

// Hook to batch fetch enrollment status
export function useBatchStatusQuery(courseIds: string[]) {
  return useQuery({
    queryKey: courseKeys.batchStatus(courseIds),
    queryFn: () => fetchBatchStatus(courseIds),
    enabled: courseIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to invalidate courses cache (useful after enrollments, etc.)
export function useInvalidateCourses() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: courseKeys.all }),
    invalidateList: () => queryClient.invalidateQueries({ queryKey: courseKeys.list() }),
    invalidateMyCourses: () => queryClient.invalidateQueries({ queryKey: courseKeys.myCourses() }),
    invalidateCourse: (id: string) => queryClient.invalidateQueries({ queryKey: courseKeys.detail(id) }),
  };
}
