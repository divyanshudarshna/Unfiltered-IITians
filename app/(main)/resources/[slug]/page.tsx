// app/(main)/resources/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { FileDown } from "lucide-react";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { Metadata } from "next";

interface Props {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  const material = await prisma.material.findUnique({
    where: { slug: String(slug) },
    include: { subject: true },
  });

  if (!material) {
    return {
      title: "Resource Not Found",
      description: "The requested study material could not be found.",
    };
  }

  const title = `${material.title} - Free Study Material`;
  const description = `Access free study material: ${material.title} for ${material.subject?.name || 'competitive exams'}. Download PDFs, watch videos, and boost your exam preparation.`;

  return {
    title,
    description,
    keywords: [
      material.title,
      material.subject?.name || 'competitive exams',
      'free study material',
      'exam preparation',
      ...(material.tags || [])
    ],
    openGraph: {
      title,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function MaterialDetailPage({ params }: Props) {
  const { slug } = await params;

  const material = await prisma.material.findUnique({
    where: { slug: String(slug) },
    include: { subject: true },
  });

  if (!material) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Material Not Found</h1>
        <p className="text-muted-foreground">
          Sorry, the material you’re looking for doesn’t exist.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <header className="space-y-4 text-center md:text-left">
        <h1 className="text-5xl font-extrabold text-purple-400 leading-tight">
          {material.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Subject: <span className="font-semibold text-white">{material.subject?.name || "N/A"}</span>
        </p>
      </header>

      {/* Tags */}
      {material.tags?.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {material.tags.map((tag) => (
            <span
              key={tag}
              className="px-4 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-800 dark:text-amber-200 dark:hover:bg-amber-700 transition-all cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Main Content & Sidebar */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Content */}
        <article className="md:col-span-2 prose max-w-none dark:prose-invert text-gray-800 dark:text-gray-200 shadow-lg p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-gray-200 dark:border-gray-700 transition-all">
          <div dangerouslySetInnerHTML={{ __html: material.content || "<p>No content available.</p>" }} />
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* YouTube Embed */}
          {material.youtubeLink && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <iframe
                src={getYouTubeEmbedUrl(material.youtubeLink) || material.youtubeLink}
                title="YouTube video"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
          )}

          {/* PDF Download */}
          {material.pdfUrl && (
            <a
              href={material.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-emerald-600 transition-all"
            >
              <FileDown className="w-5 h-5" />
              Download PDF
            </a>
          )}

          {/* Quick Info Card */}
          <div className="rounded-xl bg-cyan-50 dark:bg-slate-900 p-4 shadow-inner border border-cyan-200 dark:border-cyan-700 text-sm text-cyan-800 dark:text-cyan-200 space-y-2">
            <p><span className="font-semibold">Title:</span> {material.title}</p>
            <p><span className="font-semibold">Subject:</span> {material.subject?.name || "N/A"}</p>
            <p><span className="font-semibold">Tags:</span> {material.tags?.join(", ") || "None"}</p>
          </div>
        </aside>
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-12">
        <p className="text-muted-foreground">
          Explore more free resources and tutorials in the same subject to boost your learning.
        </p>
      </div>
    </main>
  );
}
