import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
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
    console.error("GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch story", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    console.log("Update data received:", data);
    console.log("Updating ID:", params.id);

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
        // Don't update createdAt, but update updatedAt automatically
      },
    });
    
    return NextResponse.json(story);
  } catch (err) {
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

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
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