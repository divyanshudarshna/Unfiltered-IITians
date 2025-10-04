// components/materials/MaterialCard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Video, ExternalLink, Play, FileDown, Calendar } from "lucide-react";

function getYouTubeEmbed(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);

    // handle youtu.be short links
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}`;
    }

    // handle ?v=VIDEO
    if (u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }

    // already embed
    if (url.includes("/embed/")) return url;

    return url;
  } catch {
    // fallback for raw watch?v
    if (url.includes("watch?v=")) return url.replace("watch?v=", "embed/");
    return url;
  }
}

function stripHtml(html?: string | null, max = 140) {
  if (!html) return "";
  const txt = html.replace(/<\/?[^>]+(>|$)/g, "");
  return txt.length > max ? txt.slice(0, max).trim() + "…" : txt;
}

function formatDate(dateString?: string) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

interface Material {
  id: string;
  title: string;
  youtubeLink?: string;
  pdfLink?: string;
  pdfUrl?: string;
  driveLink?: string;
  createdAt?: string | Date;
  content?: string;
  slug?: string;
  tags?: string[];
  [key: string]: unknown;
}

export default function MaterialCard({ material }: { readonly material: Material }) {
  const embed = getYouTubeEmbed(material.youtubeLink);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Generate YouTube thumbnail if available
  const getYouTubeThumbnail = (url: string | null) => {
    if (!url) return null;
    try {
      let videoId = '';
      const u = new URL(url);
      
      if (u.hostname.includes("youtu.be")) {
        videoId = u.pathname.slice(1);
      } else if (u.searchParams.get("v")) {
        videoId = u.searchParams.get("v") || '';
      }
      
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } catch {
      return null;
    }
    return null;
  };

  const youtubeThumbnail = getYouTubeThumbnail(material.youtubeLink || null);

  // 🔑 Always prefer slug for clean URL
  const linkTarget = material.slug
    ? `/resources/${String(material.slug)}`
    : `/resources/${material.id}`;

  return (
    <Card className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-2xl border border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-0">
        {/* Media Preview with Overlay */}
        <div className="relative aspect-video overflow-hidden">
          {embed || youtubeThumbnail ? (
            <>
              <div 
                className={`w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 transition-all duration-500 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}
              />
              <Image
                src={youtubeThumbnail || `/api/placeholder/400/225`}
                alt={material.title}
                width={400}
                height={225}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-primary/90 p-3 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300">
                  <Play className="h-6 w-6 text-white fill-current" />
                </div>
              </div>
            </>
          ) : null}
          
          {!embed && !youtubeThumbnail && material.pdfUrl && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">
              <FileText className="h-12 w-12 text-primary mb-2" />
              <span className="text-sm text-muted-foreground">PDF Document</span>
            </div>
          )}
          
          {!embed && !youtubeThumbnail && !material.pdfUrl && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/20 to-muted/10 p-6">
              <Video className="h-12 w-12 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Video Content</span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4">
          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors duration-300">
              {material.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {stripHtml(material.content, 120)}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {material.createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(typeof material.createdAt === 'string' ? material.createdAt : material.createdAt?.toString())}
              </div>
            )}
            <div className="flex items-center gap-1">
              {material.pdfUrl && (
                <FileDown className="h-3 w-3" />
              )}
              {embed && (
                <Play className="h-3 w-3" />
              )}
            </div>
          </div>

          {/* Tags */}
          {material.tags && material.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {material.tags.slice(0, 3).map((tag: string) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors duration-200 px-2 py-1 text-xs"
                >
                  {tag}
                </Badge>
              ))}
              {material.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{material.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {/* PDF link if exists */}
            {material.pdfUrl ? (
              <a
                href={String(material.pdfUrl)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group/download"
                download
              >
                <FileDown className="h-4 w-4 transition-transform group-hover/download:translate-y-0.5" />
                <span>Download PDF</span>
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">No PDF available</span>
            )}

            {/* Open button */}
            <Link href={linkTarget}>
              <Button
                size="sm"
                className="flex items-center gap-2 rounded-full bg-primary/90 hover:bg-primary transition-all duration-300 group/button hover:shadow-lg hover:shadow-primary/25"
                variant="default"
              >
                <span>View Resource</span>
                <ExternalLink className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}