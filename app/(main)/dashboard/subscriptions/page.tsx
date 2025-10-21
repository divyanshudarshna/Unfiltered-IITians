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

  return (
    <SubscriptionsClient
      dbUser={dbUser as any}
    />
  );
}