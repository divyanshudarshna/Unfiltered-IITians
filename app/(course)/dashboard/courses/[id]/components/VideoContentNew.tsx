"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipBack,
  SkipForward,
  Shield,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoContentProps {
  videoUrl: string;
  title: string;
  onPlaybackChange?: (playing: boolean) => void;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
}

export default function VideoContent({
  videoUrl,
  title,
  onPlaybackChange,
  onProgress,
  onEnded,
}: VideoContentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const securityCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [buffered, setBuffered] = useState(0);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isScreenProtected, setIsScreenProtected] = useState(false);

  // Settings state
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState("auto");

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Watermark
  const sessionId = useRef(`${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Security functions
  const detectScreenRecording = useCallback(() => {
    if (document.visibilityState === 'hidden' && !document.fullscreenElement) {
      handleSecurityViolation();
      return true;
    }
    return false;
  }, []);

  const handleSecurityViolation = useCallback(() => {
    setIsScreenProtected(true);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    setTimeout(() => {
      setIsScreenProtected(false);
    }, 3000);
  }, []);

  const startSecurityMonitoring = useCallback(() => {
    if (securityCheckRef.current) {
      clearInterval(securityCheckRef.current);
    }
    
    securityCheckRef.current = setInterval(() => {
      detectScreenRecording();
    }, 2000);
  }, [detectScreenRecording]);

  // Video event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      
      setCurrentTime(current);
      onProgress?.(total > 0 ? current / total : 0);
      
      // Update buffered
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBuffered(total > 0 ? bufferedEnd / total : 0);
      }
    }
  }, [onProgress]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    onPlaybackChange?.(true);
    startSecurityMonitoring();
  }, [onPlaybackChange, startSecurityMonitoring]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    onPlaybackChange?.(false);
  }, [onPlaybackChange]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onPlaybackChange?.(false);
    onEnded?.();
  }, [onPlaybackChange, onEnded]);

  const handleVolumeChange = useCallback(() => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const handleWaiting = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Control functions
  const togglePlay = useCallback(() => {
    if (!videoRef.current || isScreenProtected) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
  }, [isPlaying, isScreenProtected]);

  const handleVolumeSliderChange = useCallback((newVolume: number) => {
    if (!videoRef.current) return;
    
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    videoRef.current.volume = clampedVolume;
    videoRef.current.muted = clampedVolume === 0;
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || isScreenProtected) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * duration;
    
    videoRef.current.currentTime = seekTime;
  }, [duration, isScreenProtected]);

  const skip = useCallback((seconds: number) => {
    if (!videoRef.current || isScreenProtected) return;
    
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
    videoRef.current.currentTime = newTime;
  }, [currentTime, duration, isScreenProtected]);

  const changePlaybackRate = useCallback((rate: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  }, []);

  const changeQuality = useCallback((quality: string) => {
    setSelectedQuality(quality);
    setShowSettings(false);
    // Note: In a real implementation, you would switch video sources here
    console.log(`Quality changed to: ${quality}`);
  }, []);

  // Fullscreen functions
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  // Controls visibility
  const showControlsTemporarily = useCallback(() => {
    if (isScreenProtected) return;
    
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, [isScreenProtected]);

  const handleMouseMove = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  const handleMouseLeave = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(false);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current || isScreenProtected) return;
      
      // Prevent default for video control keys
      const videoKeys = [' ', 'k', 'f', 'm', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '.', ','];
      if (videoKeys.includes(e.key)) {
        e.preventDefault();
      }
      
      switch (e.key) {
        case ' ':
        case 'k':
          togglePlay();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'ArrowLeft':
          skip(-5);
          break;
        case 'ArrowRight':
          skip(5);
          break;
        case 'ArrowUp':
          handleVolumeSliderChange(Math.min(volume + 0.1, 1));
          break;
        case 'ArrowDown':
          handleVolumeSliderChange(Math.max(volume - 0.1, 0));
          break;
        case '.':
          changePlaybackRate(Math.min(playbackRate + 0.25, 2));
          break;
        case ',':
          changePlaybackRate(Math.max(playbackRate - 0.25, 0.25));
          break;
      }
      
      showControlsTemporarily();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isScreenProtected,
    togglePlay,
    toggleFullscreen,
    toggleMute,
    skip,
    volume,
    handleVolumeSliderChange,
    playbackRate,
    changePlaybackRate,
    showControlsTemporarily,
  ]);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (securityCheckRef.current) {
        clearInterval(securityCheckRef.current);
      }
    };
  }, []);

  // Video setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set initial volume
    video.volume = volume;
    video.muted = isMuted;

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [
    volume,
    isMuted,
    handleLoadedMetadata,
    handleTimeUpdate,
    handlePlay,
    handlePause,
    handleEnded,
    handleVolumeChange,
    handleWaiting,
    handleCanPlay,
  ]);

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const qualityOptions = ['auto', '1080p', '720p', '480p', '360p'];

  return (
    <Card className={cn(
      "bg-black border-slate-700 overflow-hidden shadow-lg relative transition-all duration-300",
      isFullscreen && "fixed inset-0 z-[9999] rounded-none border-none"
    )}>
      {/* Security indicator */}
      <div className="absolute top-2 right-2 z-40 bg-black/70 rounded-full p-2">
        <Shield className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
      </div>

      <CardContent className="p-0">
        <div
          ref={containerRef}
          className={cn(
            "relative bg-black group cursor-none",
            isFullscreen ? "h-screen" : "aspect-video"
          )}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={showControlsTemporarily}
        >
          {/* Video element */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            preload="metadata"
            playsInline
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Loading spinner */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <Loader2 className="h-8 w-8 md:h-12 md:w-12 text-purple-400 animate-spin" />
            </div>
          )}

          {/* Security protection overlay */}
          {isScreenProtected && (
            <div className="absolute inset-0 bg-black z-30 flex items-center justify-center">
              <div className="text-center text-white p-4 max-w-md">
                <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Content Protected</h3>
                <p className="text-gray-300 mb-2">
                  Suspicious activity detected. Video playback paused for security.
                </p>
                <p className="text-gray-400 text-sm">
                  Will resume automatically in a few seconds.
                </p>
              </div>
            </div>
          )}

          {/* Video title overlay */}
          {!isScreenProtected && (
            <div className={cn(
              "absolute top-4 left-4 transition-opacity duration-300 z-20",
              showControls ? "opacity-100" : "opacity-0"
            )}>
              <h3 className="text-white text-sm md:text-base font-medium bg-black/60 px-3 py-1.5 rounded-md backdrop-blur-sm">
                {title}
              </h3>
            </div>
          )}

          {/* Center play button */}
          {!isPlaying && !isLoading && !isScreenProtected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
              <button
                onClick={togglePlay}
                className="bg-purple-600 hover:bg-purple-700 text-white p-4 md:p-6 rounded-full transition-all transform hover:scale-110 shadow-2xl"
              >
                <Play className="h-8 w-8 md:h-12 md:w-12 ml-1" />
              </button>
            </div>
          )}

          {/* Controls overlay */}
          {!isScreenProtected && (
            <div
              className={cn(
                "absolute inset-0 flex flex-col justify-end transition-all duration-300 z-30",
                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            >
              {/* Progress bar */}
              <div className="px-4 pb-2">
                <div 
                  className="h-1 md:h-1.5 bg-white/20 rounded-full cursor-pointer group/progress"
                  onClick={handleSeek}
                >
                  {/* Buffered progress */}
                  <div 
                    className="h-full bg-white/40 rounded-full"
                    style={{ width: `${buffered * 100}%` }}
                  />
                  {/* Current progress */}
                  <div 
                    className="h-full bg-purple-500 rounded-full relative -mt-1 md:-mt-1.5 group-hover/progress:h-1.5 md:group-hover/progress:h-2 transition-all"
                    style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                  >
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-purple-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>

              {/* Controls bar */}
              <div className="bg-gradient-to-t from-black/80 via-black/60 to-transparent px-3 md:px-4 py-3 md:py-4">
                <div className="flex items-center justify-between">
                  {/* Left controls */}
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <button
                      onClick={() => skip(-10)}
                      className="text-white p-1.5 md:p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <SkipBack className="h-4 w-4 md:h-5 md:w-5" />
                    </button>
                    
                    <button
                      onClick={togglePlay}
                      className="text-white p-2 md:p-3 hover:bg-white/20 rounded-full transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5 md:h-6 md:w-6" />
                      ) : (
                        <Play className="h-5 w-5 md:h-6 md:w-6 ml-0.5" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => skip(10)}
                      className="text-white p-1.5 md:p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <SkipForward className="h-4 w-4 md:h-5 md:w-5" />
                    </button>

                    {/* Volume controls */}
                    <div className="flex items-center space-x-2 ml-2 md:ml-4">
                      <button
                        onClick={toggleMute}
                        className="text-white p-1.5 md:p-2 hover:bg-white/20 rounded-full transition-colors"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-4 w-4 md:h-5 md:w-5" />
                        ) : (
                          <Volume2 className="h-4 w-4 md:h-5 md:w-5" />
                        )}
                      </button>
                      
                      {!isMobile && (
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => handleVolumeSliderChange(parseFloat(e.target.value))}
                          className="w-16 md:w-20 accent-purple-500 cursor-pointer"
                        />
                      )}
                    </div>

                    {/* Time display */}
                    <div className="text-white text-xs md:text-sm font-mono ml-2 md:ml-4">
                      <span>{formatTime(currentTime)}</span>
                      <span className="text-white/60 mx-1">/</span>
                      <span className="text-white/80">{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center space-x-1 md:space-x-2 relative">
                    {/* Settings */}
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-white p-1.5 md:p-2 hover:bg-white/20 rounded-full transition-colors relative"
                    >
                      <Settings className="h-4 w-4 md:h-5 md:w-5" />
                    </button>

                    {/* Settings menu */}
                    {showSettings && (
                      <div className="absolute bottom-12 md:bottom-14 right-0 bg-black/95 border border-white/20 rounded-lg p-3 text-white text-sm w-40 md:w-44 backdrop-blur-sm z-50">
                        <div className="space-y-3">
                          {/* Playback speed */}
                          <div>
                            <p className="text-white/80 text-xs font-medium mb-2">Playback Speed</p>
                            <div className="space-y-1">
                              {playbackRates.map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => changePlaybackRate(rate)}
                                  className={cn(
                                    "block w-full text-left px-2 py-1 rounded hover:bg-white/20 transition-colors",
                                    playbackRate === rate && "bg-purple-600/50 text-purple-200"
                                  )}
                                >
                                  {rate === 1 ? 'Normal' : `${rate}x`}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Quality */}
                          <div className="border-t border-white/20 pt-3">
                            <p className="text-white/80 text-xs font-medium mb-2">Quality</p>
                            <div className="space-y-1">
                              {qualityOptions.map((quality) => (
                                <button
                                  key={quality}
                                  onClick={() => changeQuality(quality)}
                                  className={cn(
                                    "block w-full text-left px-2 py-1 rounded hover:bg-white/20 transition-colors",
                                    selectedQuality === quality && "bg-purple-600/50 text-purple-200"
                                  )}
                                >
                                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fullscreen */}
                    <button
                      onClick={toggleFullscreen}
                      className="text-white p-1.5 md:p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      {isFullscreen ? (
                        <Minimize className="h-4 w-4 md:h-5 md:w-5" />
                      ) : (
                        <Maximize className="h-4 w-4 md:h-5 md:w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Watermark */}
          <div className="absolute bottom-16 md:bottom-20 right-4 pointer-events-none text-white/10 text-xs font-mono z-20">
            Unfiltered-IITians • {sessionId.current}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}