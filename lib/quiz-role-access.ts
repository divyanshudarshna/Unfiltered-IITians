import { canAccessApiPath, type RoleAccess } from "@/lib/rolePermissions";

interface QuizRoleAccessInput {
  access: RoleAccess;
  method: string;
}

export function canManageCourseQuiz({ access, method }: QuizRoleAccessInput) {
  return canAccessApiPath(
    access,
    "/api/admin/contents/content-id/quiz",
    method,
    "courses",
  );
}
