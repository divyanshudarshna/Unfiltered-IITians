// hooks/useCourseAccess.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CourseAccessResult {
  hasAccess: boolean;
  loading: boolean;
  isAdmin?: boolean;
  reason?: string;
  enrollmentExpiresAt?: Date | string | null;
  subscriptionExpiresAt?: Date | string | null;
}

export const useCourseAccess = (courseId: string): CourseAccessResult => {
  const [result, setResult] = useState<CourseAccessResult>({
    hasAccess: false,
    loading: true,
  });
  const router = useRouter();

  useEffect(() => {
    if (!courseId) return;

    const checkAccess = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/check-access`);
        const data = await response.json();

        if (!data.hasAccess) {
          // Redirect to appropriate page based on reason
          if (data.redirectTo) {
            router.push(data.redirectTo);
          }
          setResult({
            hasAccess: false,
            loading: false,
            reason: data.reason,
          });
        } else {
          setResult({
            hasAccess: true,
            loading: false,
            isAdmin: data.isAdmin || false,
            reason: data.reason,
            enrollmentExpiresAt: data.enrollmentExpiresAt,
            subscriptionExpiresAt: data.subscriptionExpiresAt,
          });
        }
      } catch (error) {
        console.error('Error checking course access:', error);
        setResult({
          hasAccess: false,
          loading: false,
          reason: 'Network error',
        });
        router.push('/courses');
      }
    };

    checkAccess();
  }, [courseId, router]);

  return result;
};