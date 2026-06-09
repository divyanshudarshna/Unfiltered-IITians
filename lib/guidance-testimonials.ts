export type GuidanceTestimonialType = "YOUTUBE" | "TESTIMONIAL";
export type GuidanceTestimonialStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

export function normalizeGuidanceTestimonialType(value: unknown): GuidanceTestimonialType {
  return String(value || "").toUpperCase() === "TESTIMONIAL" ? "TESTIMONIAL" : "YOUTUBE";
}

export function normalizeGuidanceTestimonialStatus(value: unknown): GuidanceTestimonialStatus {
  const status = String(value || "").trim().toUpperCase();

  if (status === "DRAFT") return "DRAFT";
  if (status === "ARCHIVE" || status === "ARCHIVED") return "ARCHIVED";

  return "ACTIVE";
}

export function clampGuidanceTestimonialRating(value: unknown): number {
  const rating = Number(value);

  if (!Number.isFinite(rating)) return 5;

  return Math.min(5, Math.max(0, rating));
}

export function getYoutubeVideoId(value: unknown): string | null {
  const input = String(value || "").trim();

  if (!input) return null;

  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return cleanYoutubeVideoId(url.pathname.split("/").filter(Boolean)[0]);
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const directId = url.searchParams.get("v");
      if (directId) return cleanYoutubeVideoId(directId);

      const parts = url.pathname.split("/").filter(Boolean);
      const videoPathIndex = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part));

      if (videoPathIndex >= 0) {
        return cleanYoutubeVideoId(parts[videoPathIndex + 1]);
      }
    }
  } catch {
    return cleanYoutubeVideoId(input);
  }

  return null;
}

export function getYoutubeEmbedUrl(value: unknown): string | null {
  const videoId = getYoutubeVideoId(value);

  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

function cleanYoutubeVideoId(value: unknown): string | null {
  const videoId = String(value || "").trim().match(/^[a-zA-Z0-9_-]{6,}$/)?.[0] || null;

  return videoId;
}
