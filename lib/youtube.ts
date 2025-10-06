// lib/youtube.ts
/**
 * Utility functions for handling YouTube URLs and embeds
 */

/**
 * Converts various YouTube URL formats to embed URL
 * @param url - YouTube URL (watch, share, embed)
 * @returns Embed URL or null if invalid
 */
export function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Handle youtu.be short links
    if (urlObj.hostname.includes("youtu.be")) {
      const videoId = urlObj.pathname.slice(1);
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Handle youtube.com/watch?v=
    if (urlObj.hostname.includes("youtube.com") && urlObj.searchParams.get("v")) {
      const videoId = urlObj.searchParams.get("v");
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Already an embed URL
    if (url.includes("/embed/")) {
      return url;
    }
    
    return null;
  } catch {
    // Fallback for malformed URLs
    if (url.includes("watch?v=")) {
      return url.replace("watch?v=", "embed/").replace("youtube.com", "youtube.com");
    }
    return null;
  }
}

/**
 * Extracts video ID from YouTube URL
 * @param url - YouTube URL
 * @returns Video ID or null
 */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Handle youtu.be short links
    if (urlObj.hostname.includes("youtu.be")) {
      return urlObj.pathname.slice(1);
    }
    
    // Handle youtube.com/watch?v=
    if (urlObj.hostname.includes("youtube.com") && urlObj.searchParams.get("v")) {
      return urlObj.searchParams.get("v");
    }
    
    // Handle embed URLs
    if (url.includes("/embed/")) {
      const match = url.match(/\/embed\/([^?&]+)/);
      return match ? match[1] : null;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Gets YouTube thumbnail URL
 * @param url - YouTube URL
 * @param quality - Thumbnail quality (default, hqdefault, maxresdefault)
 * @returns Thumbnail URL or null
 */
export function getYouTubeThumbnail(url?: string | null, quality: 'default' | 'hqdefault' | 'maxresdefault' = 'hqdefault'): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Validates if a URL is a valid YouTube URL
 * @param url - URL to validate
 * @returns boolean
 */
export function isValidYouTubeUrl(url?: string | null): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname.includes("youtube.com") || 
      urlObj.hostname.includes("youtu.be")
    );
  } catch {
    return false;
  }
}