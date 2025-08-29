"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
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
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Optional: put your license server URL in an env var
const DRM_LICENSE_URL = (process && process.env && process.env.NEXT_PUBLIC_DRM_LICENSE_URL) || "";

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
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<videojs.Player | null>(null);
  const securityCheckRef = useRef<NodeJS.Timeout | null>(null);

  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsTimeout, setControlsTimeout] = useState<number | null>(null);
  const [securityAlert, setSecurityAlert] = useState(false);
  const [isScreenProtected, setIsScreenProtected] = useState(false);

  // settings state
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // session watermark id (simple randomized, useful for dynamic watermarking)
  const sessionWatermarkId = useRef(`WM-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`);

  // format time (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // detect type
  const getVideoType = (url: string) => {
    if (url.endsWith(".m3u8")) return "application/x-mpegURL";
    if (url.endsWith(".mpd")) return "application/dash+xml";
    return "video/mp4";
  };

  // Security: Screen recording detection
  const detectScreenRecording = () => {
    // Method 1: Check if document is hidden (common when screen recording)
    if (document.visibilityState === 'hidden') {
      // Additional check: if we're not in fullscreen, it might be screen recording
      if (!document.fullscreenElement) {
        handleScreenRecordingDetected();
        return true;
      }
    }
    
    // Method 2: Check for performance anomalies that might indicate recording
    const now = performance.now();
    setTimeout(() => {
      const delta = performance.now() - now;
      // If the timeout took significantly longer than expected, might be recording
      if (delta > 100) { // Threshold in milliseconds
        handleScreenRecordingDetected();
      }
    }, 50);
    
    return false;
  };

  // Handle screen recording detection
  const handleScreenRecordingDetected = () => {
    setSecurityAlert(true);
    setIsScreenProtected(true);
    
    if (playerRef.current) {
      playerRef.current.pause();
      const videoElement = playerRef.current.el();
      if (videoElement) {
        videoElement.style.display = 'none';
      }
    }
    
    // Auto-clear after 5 seconds
    setTimeout(() => {
      setSecurityAlert(false);
      setIsScreenProtected(false);
      if (playerRef.current) {
        const videoElement = playerRef.current.el();
        if (videoElement) {
          videoElement.style.display = 'block';
        }
      }
    }, 5000);
  };

  // Security: Prevent right-click and basic DevTools detection
  const preventUnauthorizedAccess = () => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setSecurityAlert(true);
      setTimeout(() => setSecurityAlert(false), 3000);
    };

    const preventDevTools = () => {
      const devToolsPattern = /./;
      devToolsPattern.toString = () => {
        setSecurityAlert(true);
        setTimeout(() => setSecurityAlert(false), 3000);
        return "SecurityViolation";
      };
    };

    document.addEventListener("contextmenu", handleContextMenu);
    preventDevTools();

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  };

  // Security: Encrypted token-based URL (simplified example)
  const getSecureVideoUrl = (url: string) => {
    const token = `token=${Date.now()}_${Math.random().toString(36).substr(2)}`;
    return url.includes("?") ? `${url}&${token}` : `${url}?${token}`;
  };

  // Security: Detect iframe embedding
  const detectIframeEmbedding = () => {
    if (window.self !== window.top) {
      setSecurityAlert(true);
      setIsScreenProtected(true);
      return true;
    }
    return false;
  };

  // Security: Periodic security checks
  const startSecurityMonitoring = () => {
    if (securityCheckRef.current) clearInterval(securityCheckRef.current);

    securityCheckRef.current = setInterval(() => {
      // Check for developer tools
      const widthThreshold = 200;
      if (
        window.outerWidth - window.innerWidth > widthThreshold ||
        window.outerHeight - window.innerHeight > widthThreshold
      ) {
        setSecurityAlert(true);
      }

      // Check for iframe embedding
      detectIframeEmbedding();
      
      // Check for screen recording
      detectScreenRecording();
    }, 5000) as unknown as NodeJS.Timeout;
  };

  // DRM: EME (Encrypted Media Extensions) handler
  const setupDRM = async (mediaEl: HTMLMediaElement) => {
    if (!DRM_LICENSE_URL) return;

    const keySystems: { [k: string]: any } = {
      'com.widevine.alpha': {
        serverURL: DRM_LICENSE_URL,
        headers: {},
      },
      'com.microsoft.playready': {
        serverURL: DRM_LICENSE_URL,
        headers: {},
      },
    };

    try {
      const onEncrypted = async (ev: any) => {
        try {
          const initDataType = ev.initDataType;
          const initData = ev.initData;

          for (const ks of Object.keys(keySystems)) {
            if (!(await (navigator as any).requestMediaKeySystemAccess)) break;
            try {
              const config = [{
                initDataTypes: [initDataType],
                audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
                videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
              }];

              // @ts-ignore
              const access = await (navigator as any).requestMediaKeySystemAccess(ks, config);
              const mediaKeys = await access.createMediaKeys();
              await mediaEl.setMediaKeys(mediaKeys);

              const session = mediaKeys.createSession();

              session.addEventListener('message', async (msgEv: any) => {
                try {
                  const licenseResponse = await fetch(keySystems[ks].serverURL, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/octet-stream',
                      ...keySystems[ks].headers,
                    },
                    body: msgEv.message,
                  });

                  if (!licenseResponse.ok) throw new Error('License server error');

                  const licenseArrayBuffer = await licenseResponse.arrayBuffer();
                  await session.update(new Uint8Array(licenseArrayBuffer));
                } catch (err) {
                  console.error('License request failed', err);
                  setSecurityAlert(true);
                }
              });

              await session.generateRequest(initDataType, initData);
              break;
            } catch (ksErr) {
              console.warn('Key system not available:', ks, ksErr);
              continue;
            }
          }
        } catch (err) {
          console.error('DRM onEncrypted handler error', err);
        }
      };

      mediaEl.addEventListener('encrypted', onEncrypted as EventListener);
    } catch (err) {
      console.error('DRM setup failed', err);
    }
  };

  // init player with security & DRM features
  useEffect(() => {
    if (!playerContainerRef.current || playerRef.current) return;

    if (detectIframeEmbedding()) return;

    const videoElement = document.createElement('video');
    videoElement.className = 'video-js vjs-big-play-centered';
    (videoElement as any).disablePictureInPicture = true;
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');

    playerContainerRef.current.appendChild(videoElement);

    const secureVideoUrl = getSecureVideoUrl(videoUrl);

    const player = videojs(videoElement, {
      sources: [{ src: secureVideoUrl, type: getVideoType(videoUrl) }],
      controls: false,
      autoplay: false,
      preload: 'metadata',
      fluid: true,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      html5: {
        vhs: { overrideNative: true },
        nativeAudioTracks: false,
      },
    });

    playerRef.current = player;

    videoElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      setSecurityAlert(true);
      setTimeout(() => setSecurityAlert(false), 3000);
    });

    // Set watermark overlay
    const watermarkEl = document.createElement('div');
    watermarkEl.style.position = 'absolute';
    watermarkEl.style.pointerEvents = 'none';
    watermarkEl.style.right = '12px';
    watermarkEl.style.bottom = '12px';
    watermarkEl.style.opacity = '0.16';
    watermarkEl.style.color = 'white';
    watermarkEl.style.fontSize = '12px';
    watermarkEl.style.zIndex = '40';
    watermarkEl.innerText = sessionWatermarkId.current;
    playerContainerRef.current!.appendChild(watermarkEl);

    const watermarkInterval = setInterval(() => {
      const x = 8 + Math.floor(Math.random() * 60);
      const y = 8 + Math.floor(Math.random() * 40);
      watermarkEl.style.right = `${x}px`;
      watermarkEl.style.bottom = `${y}px`;
    }, 10000);

    player.on('play', () => {
      setPlaying(true);
      onPlaybackChange?.(true);
      startSecurityMonitoring();
    });

    player.on('pause', () => {
      setPlaying(false);
      onPlaybackChange?.(false);
    });

    player.on('volumechange', () => {
      setVolume(player.volume());
      setMuted(player.muted());
    });

    player.on('timeupdate', () => {
      setCurrentTime(player.currentTime());
      if (player.duration()) onProgress?.(player.currentTime() / player.duration());
    });

    player.on('durationchange', () => setDuration(player.duration()));

    player.on('ended', () => {
      setPlaying(false);
      onEnded?.();
    });

    player.on('fullscreenchange', () => setIsFullscreen(player.isFullscreen()));

    preventUnauthorizedAccess();

    try {
      const mediaEl = player.tech?.().el ? (player.tech().el() as HTMLMediaElement) : (videoElement as HTMLMediaElement);
      if (mediaEl) setupDRM(mediaEl).catch(() => {});
    } catch (err) {
      console.warn('Unable to initialize DRM (non-fatal):', err);
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      if (securityCheckRef.current) clearInterval(securityCheckRef.current);
      clearInterval(watermarkInterval);
      watermarkEl.remove();
    };
  }, [videoUrl]);

  // toggle play/pause
  const togglePlay = () => {
    if (!playerRef.current || isScreenProtected) return;
    playing ? playerRef.current.pause() : playerRef.current.play();
  };

  // volume
  const handleVolumeChange = (newVolume: number) => {
    if (!playerRef.current || isScreenProtected) return;
    const v = Math.max(0, Math.min(1, newVolume));
    playerRef.current.volume(v);
    playerRef.current.muted(v === 0);
  };

  const toggleMute = () => {
    if (!playerRef.current || isScreenProtected) return;
    playerRef.current.muted(!playerRef.current.muted());
  };

  // seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || isScreenProtected) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTo = percent * duration;
    playerRef.current.currentTime(seekTo);
    setCurrentTime(seekTo);
  };

  // skip
  const skip = (seconds: number) => {
    if (!playerRef.current || isScreenProtected) return;
    let newTime = playerRef.current.currentTime() + seconds;
    newTime = Math.max(0, Math.min(newTime, duration));
    playerRef.current.currentTime(newTime);
  };

  // fullscreen
  const toggleFullscreen = () => {
    if (!playerRef.current || isScreenProtected) return;
    playerRef.current.isFullscreen() ? playerRef.current.exitFullscreen() : playerRef.current.requestFullscreen();
  };

  // show controls on mouse move
  const handleMouseMove = () => {
    if (isScreenProtected) return;
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeoutId = window.setTimeout(() => setShowControls(false), 2500);
    setControlsTimeout(timeoutId);
  };

  // change speed
  const changeSpeed = (rate: number) => {
    if (!playerRef.current || isScreenProtected) return;
    playerRef.current.playbackRate(rate);
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  return (
    <Card className="bg-black border-slate-700 overflow-hidden shadow-lg relative">
      {securityAlert && (
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>Security alert: Screen recording detected</span>
        </div>
      )}

      <div className="absolute top-2 right-2 z-40 bg-black/70 rounded-full p-2">
        <Shield className="h-5 w-5 text-green-400" />
      </div>

      <CardContent className="p-0">
        <div
          className="relative aspect-video bg-black"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(false)}
          onContextMenu={(e) => {
            e.preventDefault();
            setSecurityAlert(true);
            setTimeout(() => setSecurityAlert(false), 3000);
          }}
        >
          {isScreenProtected && (
            <div className="absolute inset-0 bg-black z-30 flex items-center justify-center">
              <div className="text-center text-white p-4">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Screen Recording Detected</h3>
                <p className="text-gray-300">
                  Screen recording or sharing has been detected. 
                  Video playback has been paused for security reasons.
                </p>
                <p className="text-gray-400 mt-2 text-sm">
                  This will automatically resolve in a few seconds.
                </p>
              </div>
            </div>
          )}

          <div ref={playerContainerRef} className="w-full h-full" />

          {!isScreenProtected && (
            <div
              className={cn(
                "absolute inset-0 flex flex-col justify-end transition-opacity duration-300",
                showControls ? "opacity-100" : "opacity-0"
              )}
            >
              <div className="h-1.5 bg-slate-700/60 cursor-pointer" onClick={handleSeek}>
                <div className="h-full bg-purple-500" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }} />
              </div>

              <div className="flex items-center justify-between bg-black/70 px-3 py-2">
                <div className="flex items-center space-x-2">
                  <button onClick={() => skip(-10)} className="text-purple-400 p-2 hover:bg-purple-600/20 rounded">
                    <SkipBack className="h-5 w-5" />
                  </button>
                  <button onClick={togglePlay} className="text-purple-400 p-2 hover:bg-purple-600/20 rounded">
                    {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </button>
                  <button onClick={() => skip(10)} className="text-purple-400 p-2 hover:bg-purple-600/20 rounded">
                    <SkipForward className="h-5 w-5" />
                  </button>

                  <div className="flex items-center text-xs text-white">
                    <span>{formatTime(currentTime)}</span>
                    <span className="mx-1">/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 relative">
                  <button onClick={toggleMute} className="text-purple-400 p-2 hover:bg-purple-600/20 rounded">
                    {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                  <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => handleVolumeChange(parseFloat(e.target.value))} className="w-20 accent-purple-500" />

                  <button onClick={() => setShowSettings(!showSettings)} className="text-purple-400 p-2 hover:bg-purple-600/20 rounded relative">
                    <Settings className="h-5 w-5" />
                  </button>

                  {showSettings && (
                    <div className="absolute bottom-10 right-0 bg-black/90 border border-purple-500 rounded-md p-2 text-white text-sm w-36">
                      <p className="mb-1 font-semibold text-purple-400">Speed</p>
                      {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                        <button key={rate} onClick={() => changeSpeed(rate)} className={cn("block w-full text-left px-2 py-1 rounded hover:bg-purple-600/30", playbackRate === rate && "bg-purple-600/50")}>
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}

                  <button onClick={toggleFullscreen} className="text-purple-400 p-2 hover:bg-purple-600/20 rounded">
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!playing && !isScreenProtected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <button onClick={togglePlay} className="bg-purple-600 hover:bg-purple-700 text-white p-5 rounded-full transition transform hover:scale-110">
                <Play className="h-10 w-10 ml-1" />
              </button>
            </div>
          )}

          {!isScreenProtected && (
            <div className="absolute top-3 left-3">
              <h3 className="text-white text-sm font-medium bg-black/60 px-2 py-1 rounded">{title}</h3>
            </div>
          )}

          {/* Watermark (text) - visible to user but above video so it gets captured if screen-recorded */}
          <div className="pointer-events-none absolute right-3 bottom-3 text-white opacity-10 text-xs z-40">Unfiltered-IITians</div>
        </div>
      </CardContent>
    </Card>
  );
}