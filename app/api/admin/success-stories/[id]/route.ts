import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminApiAccess, handleAuthError } from "@/lib/roleAuth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const story = await prisma.studentSuccessStory.findUnique({
      where: { id: params.id },
    });
    
    if (!story) {
      return NextResponse.json(
        { error: "Story not found" }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(story);
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch story", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    const data = await req.json();
    
    

    // Check if the story exists first
    const existingStory = await prisma.studentSuccessStory.findUnique({
      where: { id: params.id },
    });

    if (!existingStory) {
      return NextResponse.json(
        { error: "Story not found" }, 
        { status: 404 }
      );
    }

    // Update the story
    const story = await prisma.studentSuccessStory.update({
      where: { id: params.id },
      data: {
        name: data.name,
        role: data.role,
        content: data.content,
        image: data.image,
        rating: data.rating ? parseFloat(data.rating) : undefined,
        ...(data.approvalStatus !== undefined && { approvalStatus: data.approvalStatus }),
        ...(data.approvalNotes !== undefined && { approvalNotes: data.approvalNotes }),
        ...(data.isApproved !== undefined && { isApproved: data.isApproved }),
        ...(data.approvedAt !== undefined && { approvedAt: data.approvedAt }),
      },
    });
    
    return NextResponse.json(story);
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("PUT Error:", err);
    
    // More specific error handling
    if (err instanceof Error) {
      if (err.message.includes("RecordNotFound")) {
        return NextResponse.json(
          { error: "Story not found" },
          { status: 404 }
        );
      }
      
      if (err.message.includes("InvalidPrisma")) {
        return NextResponse.json(
          { error: "Invalid data format" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to update story",
        details: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await assertAdminApiAccess(req.url, req.method);

    // Check if the story exists first
    const existingStory = await prisma.studentSuccessStory.findUnique({
      where: { id: params.id },
    });

    if (!existingStory) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    await prisma.studentSuccessStory.delete({ 
      where: { id: params.id } 
    });
    
    return NextResponse.json({ success: true });
  } catch (err) {
    const authResponse = handleAuthError(err);
    if (authResponse) return authResponse;
    console.error("DELETE Error:", err);
    
    if (err instanceof Error && err.message.includes("RecordNotFound")) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to delete story",
        details: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
