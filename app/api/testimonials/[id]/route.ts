import { NextResponse } from "next/server"
// import { auth } from "@clerk/nextjs"
import prisma from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
//   const { userId } = auth()
//   if (!userId) return new NextResponse("Unauthorized", { status: 401 })

//   const user = await prisma.user.findUnique({ where: { clerkUserId: userId } })
//   if (user?.role !== "ADMIN") {
//     return new NextResponse("Forbidden", { status: 403 })
//   }

  const body = await req.json()
  const { name, role, content, image, rating } = body

  const updated = await prisma.testimonial.update({
    where: { id: params.id },
    data: { name, role, content, image, rating },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
//   const { userId } = auth()
//   if (!userId) return new NextResponse("Unauthorized", { status: 401 })

//   const user = await prisma.user.findUnique({ where: { clerkUserId: userId } })
//   if (user?.role !== "ADMIN") {
//     return new NextResponse("Forbidden", { status: 403 })
//   }

  await prisma.testimonial.delete({ where: { id: params.id } })
  return new NextResponse("Deleted", { status: 200 })
}
