// app/(main)/resources/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { FileDown, Youtube } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MaterialDetailPage({ params }: Props) {
  const { slug } = await params;

  const material = await prisma.material.findUnique({
    where: { slug: String(slug) },
    include: { subject: true },
  });

  if (!material) {
    return (
      <main className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-3xl font-bold mb-4">Material Not Found</h1>
        <p className="text-muted-foreground">Sorry, the material you’re looking for doesn’t exist.</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Title & Subject */}
      <div className="space-y-1">
        <h1 className="text-4xl font-bold">{material.title}</h1>
        <p className="text-muted-foreground">
          Subject: {material.subject?.name || "N/A"}
        </p>
      </div>

      {/* Tags */}
      {material.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {material.tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm hover:bg-gray-300 transition-colors cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: material.content || "<p>No content available.</p>" }} />

      {/* YouTube Embed */}
      {material.youtubeLink && (
        <div className="relative aspect-video w-full">
          <iframe
            src={material.youtubeLink.includes("embed") ? material.youtubeLink : material.youtubeLink.replace("watch?v=", "embed/")}
            title="YouTube video"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full rounded-md shadow"
          ></iframe>
        </div>
      )}

      {/* PDF Download */}
      {material.pdfUrl && (
        <a
          href={material.pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-semibold"
        >
          <FileDown className="h-5 w-5" />
          <span>Download PDF</span>
        </a>
      )}
    </main>
  );
}
