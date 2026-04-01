import { useQuery } from "@tanstack/react-query";

// Query keys
export const adminKeys = {
  all: ["admin"] as const,
  dashboardStats: () => ["admin", "dashboard-stats"] as const,
  enrollments: (page: number, limit: number, search?: string) =>
    ["admin", "enrollments", page, limit, search] as const,
};

// Type definitions
interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  recentEnrollments?: unknown[];
  topCourses?: unknown[];
  userGrowth?: unknown[];
}

interface EnrollmentsResponse {
  enrollments: unknown[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

// Fetch dashboard stats
async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch("/api/admin/dashboard-stats");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }
  return response.json();
}

// Hook to fetch dashboard stats
export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: adminKeys.dashboardStats(),
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes (matches cache TTL)
    // Refetch less frequently since this is expensive
    refetchOnWindowFocus: false,
  });
}

// Fetch enrollments with pagination
async function fetchEnrollments(
  page: number,
  limit: number,
  search?: string
): Promise<EnrollmentsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });

  const response = await fetch(`/api/admin/enrollments?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch enrollments");
  }
  return response.json();
}

// Hook to fetch enrollments
export function useEnrollmentsQuery(page = 1, limit = 50, search?: string) {
  return useQuery({
    queryKey: adminKeys.enrollments(page, limit, search),
    queryFn: () => fetchEnrollments(page, limit, search),
    staleTime: 30 * 1000, // 30 seconds
    // Keep previous data while fetching new page
    placeholderData: (previousData) => previousData,
  });
}
