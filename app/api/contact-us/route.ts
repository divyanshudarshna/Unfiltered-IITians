import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET all contact messages (⚠️ later protect for admin only)
export async function GET() {
  try {
    const contacts = await prisma.contactUs.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(contacts)
  } catch (error) {
    console.error("GET ContactUs error:", error)
    return new NextResponse("Failed to fetch contacts", { status: 500 })
  }
}


// POST new contact message
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_name, user_email, subject, message } = body;

    // Validate required fields
    if (!user_name || !user_email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user_email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Save to database
    const contact = await prisma.contactUs.create({
      data: { 
        name: user_name, 
        email: user_email, 
        subject, 
        message,
        status: "PENDING" // Default status
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Contact form submitted successfully",
      data: contact
    });
  } catch (error) {
    console.error("POST ContactUs error:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
