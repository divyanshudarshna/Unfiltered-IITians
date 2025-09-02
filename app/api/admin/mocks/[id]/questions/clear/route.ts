import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Find the mock
    const mock = await prisma.mockTest.findUnique({ 
      where: { id } 
    });
    
    if (!mock) {
      return NextResponse.json(
        { error: "Mock not found" }, 
        { status: 404 }
      );
    }

    // Update mock with empty questions array
    const updatedMock = await prisma.mockTest.update({
      where: { id },
      data: { 
        questions: [],
        updatedAt: new Date()
      },
    });

    return NextResponse.json({
      success: true,
      message: `All questions have been cleared`,
      mock: updatedMock
    });

  } catch (err: any) {
    console.error("Clear questions error:", err);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}