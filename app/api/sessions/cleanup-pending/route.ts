// API to cleanup pending enrollments older than 1 hour
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // Delete enrollments that are PENDING for more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const deletedEnrollments = await prisma.sessionEnrollment.deleteMany({
      where: {
        paymentStatus: "PENDING",
        enrolledAt: {
          lt: oneHourAgo
        }
      }
    });

    return NextResponse.json({
      success: true,
      deletedCount: deletedEnrollments.count,
      message: `Cleaned up ${deletedEnrollments.count} pending enrollments`
    });
  } catch (error) {
    console.error("Error cleaning up pending enrollments:", error);
    return NextResponse.json(
      { error: "Failed to cleanup pending enrollments" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Just check how many pending enrollments exist
    const pendingCount = await prisma.sessionEnrollment.count({
      where: {
        paymentStatus: "PENDING"
      }
    });

    const oldPendingCount = await prisma.sessionEnrollment.count({
      where: {
        paymentStatus: "PENDING",
        enrolledAt: {
          lt: new Date(Date.now() - 60 * 60 * 1000)
        }
      }
    });

    return NextResponse.json({
      totalPending: pendingCount,
      oldPending: oldPendingCount
    });
  } catch (error) {
    console.error("Error checking pending enrollments:", error);
    return NextResponse.json(
      { error: "Failed to check pending enrollments" },
      { status: 500 }
    );
  }
}