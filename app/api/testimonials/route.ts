import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { cloudinary } from "@/lib/cloudinary"

// GET all testimonials
export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(testimonials)
  } catch (error) {
    console.error("GET testimonials error:", error)
    return new NextResponse("Failed to fetch testimonials", { status: 500 })
  }
}

// POST new testimonial (with optional image upload)
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type")

    // ✅ Case 1: If user uploads a file via multipart/form-data
    if (contentType && contentType.includes("multipart/form-data")) {
      const formData = await req.formData()

      const name = formData.get("name") as string
      const role = formData.get("role") as string
      const content = formData.get("content") as string
      const rating = parseFloat(formData.get("rating") as string) || 0
      const file = formData.get("file") as File | null

      if (!name || !role || !content) {
        return new NextResponse("Missing required fields", { status: 400 })
      }

      let imageUrl: string | null = null

      if (file) {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const uploaded = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: "auto", folder: "testimonials" },
            (err, result) => {
              if (err) return reject(err)
              resolve(result)
            }
          ).end(buffer)
        })

        imageUrl = (uploaded as any).secure_url
      }

      const testimonial = await prisma.testimonial.create({
        data: { name, role, content, rating, image: imageUrl },
      })

      return NextResponse.json(testimonial)
    }

    // ✅ Case 2: JSON request with already existing image URL
    const body = await req.json()
    const { name, role, content, image, rating } = body

    if (!name || !role || !content) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const testimonial = await prisma.testimonial.create({
      data: { name, role, content, image: image ?? null, rating: rating ?? 0 },
    })

    return NextResponse.json(testimonial)
  } catch (error) {
    console.error("POST testimonial error:", error)
    return new NextResponse("Failed to create testimonial", { status: 500 })
  }
}
