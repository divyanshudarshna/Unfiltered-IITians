import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

// async function adminAuth() {
//   const clerkUser = await currentUser();
//   if (!clerkUser || clerkUser.publicMetadata.role !== "ADMIN") {
//     throw new Error("Unauthorized");
//   }
//   return clerkUser;
// }

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const { id: mockId } = await params;

    const mock = await prisma.mockTest.findUnique({
      where: { id: mockId },
    });

    if (!mock) {
      return NextResponse.json({ error: "Mock test not found" }, { status: 404 });
    }

    return NextResponse.json({ mock });
  } catch (error: unknown) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error fetching mock test:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const { id: mockId } = await params;
    const data = await req.json();

    const updateData: Parameters<typeof prisma.mockTest.update>[0]["data"] = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.questions !== undefined) updateData.questions = data.questions;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.status !== undefined) updateData.status = data.status;

    const updatedMock = await prisma.mockTest.update({
      where: { id: mockId },
      data: updateData,
    });

    return NextResponse.json({ mock: updatedMock });
  } catch (error: unknown) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error updating mock test:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const { id: mockId } = await params;

    // Optional: delete related attempts and subscriptions first if needed
    await prisma.mockAttempt.deleteMany({ where: { mockTestId: mockId } });
    await prisma.subscription.deleteMany({ where: { mockTestId: mockId } });

    await prisma.mockTest.delete({ where: { id: mockId } });

    return NextResponse.json({ message: "Mock test deleted" });
  } catch (error: unknown) {
    console.error("Error deleting mock test:", error);
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
