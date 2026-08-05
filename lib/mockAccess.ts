import { prisma } from "@/lib/prisma"
import { getRoleAccess } from "@/lib/rolePermissions"

export async function getMockEntitlement(clerkUserId: string | null, mockTestId: string) {
  if (!clerkUserId) return { allowed: false, reason: "authentication_required" }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, role: true },
  })
  if (!user) return { allowed: false, reason: "user_not_found" }

  const mock = await prisma.mockTest.findUnique({
    where: { id: mockTestId },
    select: { price: true, status: true },
  })
  if (!mock) return { allowed: false, reason: "mock_not_found" }

  const roleAccess = await getRoleAccess(user.role)
  if (user.role === "ADMIN" || roleAccess.permissions.includes("mocks")) {
    return { allowed: true, reason: "staff_access", subscriptionType: "staff", userId: user.id }
  }

  if (mock.status !== "PUBLISHED") return { allowed: false, reason: "mock_not_available", userId: user.id }
  if (mock.price === 0) return { allowed: true, reason: "free_mock", subscriptionType: "free", userId: user.id }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      mockTestId,
      paid: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { mockBundleId: true },
  })
  if (!subscription) return { allowed: false, reason: "no_subscription", userId: user.id }

  return {
    allowed: true,
    reason: "subscription_found",
    subscriptionType: subscription.mockBundleId ? "bundle" : "individual",
    userId: user.id,
  }
}
