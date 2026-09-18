import { ObjectId } from "mongodb";
import { prisma } from "@/lib/prisma";
import { AuthError, getDbUserFromClerk } from "@/lib/roleAuth";
import { canManageCourseQuiz } from "@/lib/quiz-role-access";
import { getRoleAccess } from "@/lib/rolePermissions";

export async function assertQuizManagementAccess(contentId: string, method: string) {
  const user = await getDbUserFromClerk();
  if (!user) throw new AuthError("Unauthorized", 401);

  const access = await getRoleAccess(user.role);
  if (!canManageCourseQuiz({ access, method })) {
    throw new AuthError("Forbidden", 403);
  }

  if (!ObjectId.isValid(contentId)) {
    throw new AuthError("Invalid content ID", 400);
  }

  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: { courseId: true },
  });

  if (!content) throw new AuthError("Content not found", 404);

  return { user, courseId: content.courseId };
}
