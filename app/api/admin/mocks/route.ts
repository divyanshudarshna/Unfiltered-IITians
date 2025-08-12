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

    const mocks = await prisma.mockTest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ mocks });
  } catch (error: any) {
    console.error("Error fetching mocks:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // await adminAuth();

    const data = await req.json();

    const { title, description, price, questions, tags, difficulty } = data;

    // Validate required fields
    if (!title || !questions) {
      return NextResponse.json(
        { error: "Missing required fields: title or questions" },
        { status: 400 }
      );
    }

    const newMock = await prisma.mockTest.create({
      data: {
        title,
        description,
        price: price || 0,
        questions,
        tags: tags || [],
        difficulty: difficulty || "EASY",
      },
    });

    return NextResponse.json({ mock: newMock });
  } catch (error: any) {
    console.error("Error creating mock:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}
