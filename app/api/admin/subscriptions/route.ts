import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// import { currentUser } from "@clerk/nextjs/server";

// async function adminAuth() {
//   const clerkUser = await currentUser();
//   if (!clerkUser || clerkUser.publicMetadata.role !== "ADMIN") {
//     throw new Error("Unauthorized");
//   }
//   return clerkUser;
// }

export async function GET() {
  try {
    // await adminAuth();

    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: true,
        mockTest: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
