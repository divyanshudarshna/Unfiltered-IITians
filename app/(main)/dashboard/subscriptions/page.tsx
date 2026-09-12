// app/(main)/dashboard/subscriptions/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SubscriptionsClient from "@/app/(main)/dashboard/subscriptions/SubscriptionsClient";

export default async function SubscriptionsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user from database
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: user.id },
    include: {
      enrollments: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              actualPrice: true,
              createdAt: true,
              status: true,
            }
          }
        },
        orderBy: { enrolledAt: "desc" }
      },
      subscriptions: {
        where: {
          paid: true,
        },
        select: {
          id: true,
          actualAmountPaid: true,
          originalPrice: true,
          discountApplied: true,
          createdAt: true,
          mockTest: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              createdAt: true,
            }
          },
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              createdAt: true,
            }
          },
          mockBundle: {
            select: {
              id: true,
              title: true,
              description: true,
              mockIds: true,
              basePrice: true,
              discountedPrice: true,
              createdAt: true,
            }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      sessionEnrollments: {
        where: {
          paymentStatus: "SUCCESS"
        },
        include: {
          session: {
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              discountedPrice: true,
              duration: true,
              expiryDate: true,
              createdAt: true,
            }
          }
        },
        orderBy: { enrolledAt: "desc" }
      }
    }
  });

  if (!dbUser) {
    redirect("/unauthorized");
  }

  const [courseBillingSubscriptions, commerceBillingSubscriptions] = await Promise.all([
    prisma.courseBillingSubscription.findMany({
      where: { userId: dbUser.id },
      include: { course: { select: { title: true } }, billingPlan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commerceBillingSubscription.findMany({
      where: { userId: dbUser.id },
      include: { billingPlan: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const productIds = commerceBillingSubscriptions.reduce<Record<string, string[]>>((ids, subscription) => {
    ids[subscription.productType] = [...(ids[subscription.productType] ?? []), subscription.productId];
    return ids;
  }, {});
  const [mocks, bundles, sessions] = await Promise.all([
    prisma.mockTest.findMany({ where: { id: { in: productIds.MOCK_TEST ?? [] } }, select: { id: true, title: true } }),
    prisma.mockBundle.findMany({ where: { id: { in: productIds.MOCK_BUNDLE ?? [] } }, select: { id: true, title: true } }),
    prisma.session.findMany({ where: { id: { in: productIds.GUIDANCE_SESSION ?? [] } }, select: { id: true, title: true } }),
  ]);
  const productTitles = new Map([...mocks, ...bundles, ...sessions].map((product) => [product.id, product.title]));
  const recurringSubscriptions = [
    ...courseBillingSubscriptions.map((subscription) => ({
      id: subscription.id,
      title: subscription.course.title,
      productType: "Course",
      status: subscription.providerStatus,
      amountPaise: subscription.billingPlan.amountPaise,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    })),
    ...commerceBillingSubscriptions.map((subscription) => ({
      id: subscription.id,
      title: productTitles.get(subscription.productId) ?? "Subscription",
      productType: subscription.productType.replaceAll("_", " "),
      status: subscription.providerStatus,
      amountPaise: subscription.billingPlan.amountPaise,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    })),
  ];

  return (
    <SubscriptionsClient
      dbUser={dbUser}
      recurringSubscriptions={recurringSubscriptions}
    />
  );
}
