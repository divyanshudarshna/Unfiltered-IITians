// app/materials/page.tsx
import React from "react";
import MaterialsClient from "@/components/MaterialsClient";
import { prisma } from "@/lib/prisma";

export const revalidate = 60; // stale-while-revalidate (optional)

export default async function MaterialsPage() {
  // fetch categories with published materials
  const categories = await prisma.materialCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      materials: {
        where: { published: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  // convert Date -> string for safe serialization
  const payload = categories.map((c) => ({
    id: c.id,
    name: c.name,
    desc: c.desc,
    createdAt: c.createdAt?.toISOString(),
    updatedAt: c.updatedAt?.toISOString(),
    materials: c.materials.map((m) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      content: m.content,
      pdfUrl: m.pdfUrl,
      youtubeLink: m.youtubeLink,
      tags: m.tags || [],
      order: m.order ?? 0,
      published: m.published,
      subjectId: m.subjectId,
      createdAt: m.createdAt?.toISOString(),
      updatedAt: m.updatedAt?.toISOString(),
    })),
  }));

  return (
    <main className="px-4 md:px-12 py-10 max-w-7xl mx-auto">
      <MaterialsClient initialCategories={payload} />
    </main>
  );
}
