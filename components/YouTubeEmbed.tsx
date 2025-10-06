// components/YouTubeEmbed.tsx
"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

interface YouTubeEmbedProps {
  url: string;
  title?: string;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export default function YouTubeEmbed({ 
  url, 
  title = "YouTube Video", 
  className,
  onPlay,
  onPause,
  onEnded 
}: YouTubeEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  
  const embedUrl = getYouTubeEmbedUrl(url);
  
  if (!embedUrl) {
    return (
      <div className={cn(
        "aspect-video bg-muted rounded-lg flex items-center justify-center",
        className
      )}>
        <p className="text-muted-foreground">Invalid YouTube URL</p>
      </div>
    );
  }

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handlePlay = () => {
    setHasStarted(true);
    onPlay?.();
  };

  // Add autoplay and other parameters to embed URL
  const finalEmbedUrl = `${embedUrl}?enablejsapi=1&rel=0&modestbranding=1&fs=1&cc_load_policy=1&iv_load_policy=3&autohide=1`;

  return (
    <div className={cn("relative aspect-video bg-black rounded-lg overflow-hidden", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {!hasStarted && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 cursor-pointer group"
             onClick={handlePlay}>
          <div className="bg-red-600 hover:bg-red-700 p-4 rounded-full transform transition-transform group-hover:scale-110">
            <Play className="h-8 w-8 text-white fill-current ml-1" />
          </div>
        </div>
      )}
      
      <iframe
        src={hasStarted ? finalEmbedUrl : embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full"
        onLoad={handleLoad}
        style={{ border: 0 }}
      />
    </div>
  );
}