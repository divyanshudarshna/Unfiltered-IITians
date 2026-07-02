import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { getCourseExpiryDate } from "../lib/course-expiry";

config({ path: ".env.local" });

const prisma = new PrismaClient();
const applyChanges = process.argv.includes("--apply");
const toleranceMs = 60 * 1000;

function datesDiffer(actual: Date | null, expected: Date) {
  return !actual || Math.abs(actual.getTime() - expected.getTime()) > toleranceMs;
}

async function main() {
  const paidCourseSubscriptions = await prisma.subscription.findMany({
    where: { paid: true, courseId: { not: null } },
    include: {
      course: { select: { id: true, title: true, durationMonths: true } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const latestSubscriptionByUserCourse = new Map<string, (typeof paidCourseSubscriptions)[number]>();

  for (const subscription of paidCourseSubscriptions) {
    if (!subscription.courseId) continue;

    const key = `${subscription.userId}:${subscription.courseId}`;
    const existing = latestSubscriptionByUserCourse.get(key);
    const subscriptionDate = subscription.paidAt ?? subscription.createdAt;
    const existingDate = existing ? existing.paidAt ?? existing.createdAt : null;

    if (!existingDate || subscriptionDate > existingDate) {
      latestSubscriptionByUserCourse.set(key, subscription);
    }
  }

  const subscriptionUpdates = [];

  for (const subscription of paidCourseSubscriptions) {
    if (!subscription.course) continue;

    const purchaseDate = subscription.paidAt ?? subscription.createdAt;
    const expectedExpiresAt = getCourseExpiryDate(purchaseDate, subscription.course.durationMonths);

    if (datesDiffer(subscription.expiresAt, expectedExpiresAt)) {
      subscriptionUpdates.push({ subscription, expectedExpiresAt });
    }
  }

  const enrollments = await prisma.enrollment.findMany({
    include: {
      course: { select: { id: true, title: true, durationMonths: true } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const enrollmentUpdates = [];

  for (const enrollment of enrollments) {
    const paidSubscription = latestSubscriptionByUserCourse.get(`${enrollment.userId}:${enrollment.courseId}`);
    const purchaseDate = paidSubscription
      ? paidSubscription.paidAt ?? paidSubscription.createdAt
      : enrollment.enrolledAt;
    const expectedExpiresAt = getCourseExpiryDate(purchaseDate, enrollment.course.durationMonths);

    if (datesDiffer(enrollment.expiresAt, expectedExpiresAt)) {
      enrollmentUpdates.push({ enrollment, expectedExpiresAt, source: paidSubscription ? "subscription" : "enrollment" });
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: applyChanges ? "apply" : "dry-run",
        scanned: {
          paidCourseSubscriptions: paidCourseSubscriptions.length,
          enrollments: enrollments.length,
        },
        mismatches: {
          subscriptions: subscriptionUpdates.length,
          enrollments: enrollmentUpdates.length,
        },
        samples: {
          subscriptions: subscriptionUpdates.slice(0, 10).map(({ subscription, expectedExpiresAt }) => ({
            id: subscription.id,
            email: subscription.user.email,
            name: subscription.user.name,
            course: subscription.course?.title,
            currentExpiresAt: subscription.expiresAt,
            expectedExpiresAt,
          })),
          enrollments: enrollmentUpdates.slice(0, 10).map(({ enrollment, expectedExpiresAt, source }) => ({
            id: enrollment.id,
            email: enrollment.user.email,
            name: enrollment.user.name,
            course: enrollment.course.title,
            source,
            currentExpiresAt: enrollment.expiresAt,
            expectedExpiresAt,
          })),
        },
      },
      null,
      2
    )
  );

  if (!applyChanges) return;

  await prisma.$transaction([
    ...subscriptionUpdates.map(({ subscription, expectedExpiresAt }) =>
      prisma.subscription.update({
        where: { id: subscription.id },
        data: { expiresAt: expectedExpiresAt },
      })
    ),
    ...enrollmentUpdates.map(({ enrollment, expectedExpiresAt }) =>
      prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { expiresAt: expectedExpiresAt },
      })
    ),
  ]);

  console.log(
    `Updated ${subscriptionUpdates.length} course subscriptions and ${enrollmentUpdates.length} enrollments.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
