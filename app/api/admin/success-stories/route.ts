import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

export async function GET(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const statusFilter = searchParams.get("status") || "all";

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { role: { contains: search, mode: "insensitive" as const } },
              { content: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(statusFilter === "pending"
        ? { approvalStatus: "pending" }
        : statusFilter === "approved"
          ? { approvalStatus: "approved" }
          : statusFilter === "rejected"
            ? { approvalStatus: "rejected" }
            : statusFilter === "attention"
              ? { approvalStatus: { in: ["pending", "rejected"] } }
              : {}),
    };

    const allowedSortFields = new Set(["name", "role", "rating", "createdAt", "updatedAt"]);
    const finalSortField = allowedSortFields.has(sortField) ? sortField : "createdAt";

    const [stories, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.studentSuccessStory.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [finalSortField]: sortOrder },
      }),
      prisma.studentSuccessStory.count({ where }),
      prisma.studentSuccessStory.count({ where: { submittedViaForm: true, approvalStatus: "pending" } }),
      prisma.studentSuccessStory.count({ where: { submittedViaForm: true, approvalStatus: "approved" } }),
      prisma.studentSuccessStory.count({ where: { submittedViaForm: true, approvalStatus: "rejected" } }),
    ]);

    return NextResponse.json({
      stories,
      total,
      statusCounts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        attention: pendingCount + rejectedCount,
      },
    });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch stories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const data = await req.json();
    const rating = Number(data.rating ?? 0);

    const story = await prisma.studentSuccessStory.create({
      data: {
        name: data.name?.trim(),
        role: data.role?.trim(),
        content: data.content?.trim(),
        image: data.image?.trim() || null,
        rating: Number.isNaN(rating) ? 0 : rating,
        submittedViaForm: false,
        approvalStatus: "approved",
        isApproved: true,
        approvedAt: new Date(),
        approvalNotes: null,
      },
    });

    return NextResponse.json(story);
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error(err);
    return NextResponse.json({ error: "Failed to create story" }, { status: 500 });
  }
}
