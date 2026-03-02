"use client";

import { useEffect, useRef, useState, useCallback, MouseEvent } from "react";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    SkipBack,
    SkipForward,
    Settings,
    Download,
    Share2,
    AlertCircle,
} from "lucide-react";

interface VideoPlayerProps {
    videoUrl: string | null;
    lessonId: string;
    duration?: number;
    title?: string;
    onProgress?: (data: { currentTime: number; duration: number }) => void;
    onComplete?: () => void;
    autoSave?: boolean; // Auto-save progress every 10 seconds
}
/**
 * Convert YouTube URL to embed format
 */
function getYouTubeEmbedUrl(url: string): string {
    let videoId = "";

    if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else if (url.includes("watch?v=")) {
        videoId = url.split("v=")[1]?.split("&")[0];
    }

    if (!videoId) return "";
    return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Detect video URL type and validate it
 */
function getVideoType(
    url: string | null,
): "youtube" | "vimeo" | "file" | "mock" | "unknown" {
    if (!url) return "unknown";
    if (url.startsWith("MOCK_PLACEHOLDER:")) return "mock";
    if (url.includes("youtube.com") || url.includes("youtu.be"))
        return "youtube";
    if (url.includes("vimeo.com")) return "vimeo";
    if (url.startsWith("data:") || url.startsWith("blob:")) return "file";
    if (url.startsWith("http://") || url.startsWith("https://")) return "file";
    return "unknown";
}

/**
 * Generate mock video placeholder (SVG-based, no actual recording needed)
 * Used for FREE courses that don't have real videos yet
 */
function generateMockVideoDataUrl(title: string = "Bài học mẫu"): string {
    // Create SVG-based placeholder that can be used as video background
    const svg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#333333;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#grad)"/>
    <circle cx="960" cy="540" r="80" fill="#ff6b35" opacity="0.8"/>
    <polygon points="920,500 920,580 1000,540" fill="#ffffff"/>
    <text x="960" y="750" font-family="Arial" font-size="48" fill="#ffffff" text-anchor="middle" font-weight="bold">
      ${title}
    </text>
    <text x="960" y="820" font-family="Arial" font-size="24" fill="#ff6b35" text-anchor="middle">
      Placeholder Video
    </text>
  </svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export default function VideoPlayer({
    videoUrl,
    lessonId,
    duration,
    title,
    onProgress,
    onComplete,
    autoSave = true,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(duration || 0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [bufferedPercent, setBufferedPercent] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [showAutoHideControls, setShowAutoHideControls] = useState(false);
    const [isDraggingProgress, setIsDraggingProgress] = useState(false);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPosition, setHoverPosition] = useState<number>(0);
    const [videoError, setVideoError] = useState(false);
    const [isMockVideo, setIsMockVideo] = useState(false);
    const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(
        videoUrl,
    );
    const [isYouTubeVideo, setIsYouTubeVideo] = useState(false);
    const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string | null>(null);

    // Control hide timeout
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const progressBarRef = useRef<HTMLDivElement>(null);

    // Auto-save progress
    const lastSaveTimeRef = useRef(0);

    // ✅ Process video URL: Handle MOCK_PLACEHOLDER, YouTube, convert to playable format
    useEffect(() => {
        if (!videoUrl) {
            setProcessedVideoUrl(null);
            setIsMockVideo(false);
            setIsYouTubeVideo(false);
            setYoutubeEmbedUrl(null);
            setVideoError(false);
            return;
        }

        const videoType = getVideoType(videoUrl);
        setVideoError(false); // Reset error state when URL changes

        // Handle mock video placeholder
        if (videoType === "mock") {
            const title = videoUrl.replace("MOCK_PLACEHOLDER:", "");
            const mockDataUrl = generateMockVideoDataUrl(title);
            setProcessedVideoUrl(mockDataUrl);
            setIsMockVideo(true);
            setIsYouTubeVideo(false);
            setYoutubeEmbedUrl(null);
            console.log("📺 [VideoPlayer] Mock video:", title);
            return;
        }

        // Handle YouTube URLs - use iframe embed instead of video element
        if (videoType === "youtube") {
            const embedUrl = getYouTubeEmbedUrl(videoUrl);
            if (embedUrl) {
                setIsYouTubeVideo(true);
                setYoutubeEmbedUrl(embedUrl);
                setProcessedVideoUrl(null); // Don't use video element for YouTube
                setIsMockVideo(false);
                console.log(
                    "📺 [VideoPlayer] YouTube video (embed):",
                    embedUrl,
                );
                setIsLoading(false);
                return;
            } else {
                console.error(
                    "❌ [VideoPlayer] Invalid YouTube URL:",
                    videoUrl,
                );
                setVideoError(true);
                setIsYouTubeVideo(false);
                return;
            }
        }

        // Handle Vimeo URLs
        if (videoType === "vimeo") {
            setProcessedVideoUrl(videoUrl);
            setIsMockVideo(false);
            setIsYouTubeVideo(false);
            setYoutubeEmbedUrl(null);
            console.log("📺 [VideoPlayer] Vimeo video:", videoUrl);
            return;
        }

        // Handle file URLs or data URLs
        if (videoType === "file") {
            setProcessedVideoUrl(videoUrl);
            setIsMockVideo(false);
            setIsYouTubeVideo(false);
            setYoutubeEmbedUrl(null);
            console.log("📺 [VideoPlayer] File video:", videoUrl);
            return;
        }

        // Fallback: try to use as-is
        console.warn(
            "⚠️ [VideoPlayer] Unknown video type, attempting to play:",
            videoUrl,
        );
        setProcessedVideoUrl(videoUrl);
        setIsMockVideo(false);
        setIsYouTubeVideo(false);
        setYoutubeEmbedUrl(null);
    }, [videoUrl]);

    // Show error if no video URL is available at all
    if (!processedVideoUrl && !youtubeEmbedUrl && !videoUrl) {
        return (
            <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                    <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                        No video available for this lesson
                    </p>
                </div>
            </div>
        );
    }

    // Handle play/pause
    const handlePlayPause = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying]);

    // Handle time update
    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);

            // Auto-save progress
            if (autoSave && Date.now() - lastSaveTimeRef.current > 10000) {
                saveProgress(time);
                lastSaveTimeRef.current = Date.now();
            }

            onProgress?.({ currentTime: time, duration: videoDuration });
        }
    }, [videoDuration, autoSave, onProgress]);

    // Handle metadata loaded
    const handleLoadedMetadata = useCallback(() => {
        if (videoRef.current) {
            setVideoDuration(videoRef.current.duration);
        }
    }, []);

    // Handle video ended
    const handleEnded = useCallback(() => {
        setIsPlaying(false);
        saveProgress(videoDuration);
        onComplete?.();
    }, [videoDuration, onComplete]);

    // Handle progress bar seek
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    // ✅ NEW: Handle progress bar click/drag
    const seekToPosition = (event: MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const newTime = Math.max(
            0,
            Math.min(percent * videoDuration, videoDuration),
        );

        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    // ✅ NEW: Handle mouse down on progress bar (start drag)
    const handleProgressMouseDown = (event: MouseEvent<HTMLDivElement>) => {
        setIsDraggingProgress(true);
        seekToPosition(event);
    };

    // ✅ NEW: Handle mouse move while dragging
    useEffect(() => {
        const handleMouseMove = (event: globalThis.MouseEvent) => {
            if (!isDraggingProgress || !containerRef.current) return;

            const progressBar = containerRef.current.querySelector(
                "[data-progress-bar]",
            ) as HTMLDivElement;
            if (!progressBar) return;

            const rect = progressBar.getBoundingClientRect();
            const percent = (event.clientX - rect.left) / rect.width;
            const newTime = Math.max(
                0,
                Math.min(percent * videoDuration, videoDuration),
            );

            setCurrentTime(newTime);
            if (videoRef.current) {
                videoRef.current.currentTime = newTime;
            }
        };

        const handleMouseUp = () => {
            setIsDraggingProgress(false);
        };

        if (isDraggingProgress) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDraggingProgress, videoDuration]);

    // ✅ NEW: Handle hover preview on progress bar
    const handleProgressHover = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const percent = Math.max(
            0,
            Math.min((event.clientX - rect.left) / rect.width, 1),
        );
        const hoverTimeValue = percent * videoDuration;
        const positionPercent = percent * 100;

        setHoverTime(hoverTimeValue);
        setHoverPosition(positionPercent);
    };

    const handleProgressLeave = () => {
        setHoverTime(null);
    };

    // ✅ NEW: Better hover tracking with throttle
    useEffect(() => {
        const progressBar = progressBarRef.current;
        if (!progressBar) return;

        let throttleTimer: ReturnType<typeof setTimeout>;
        let isHovering = false;

        const handleMouseEnterBar = () => {
            isHovering = true;
        };

        const handleMouseMoveBar = (e: globalThis.MouseEvent) => {
            if (!isHovering) return;

            clearTimeout(throttleTimer);
            throttleTimer = setTimeout(() => {
                const rect = progressBar.getBoundingClientRect();
                const percent = Math.max(
                    0,
                    Math.min((e.clientX - rect.left) / rect.width, 1),
                );
                const hoverTimeValue = percent * videoDuration;
                const positionPercent = percent * 100;

                setHoverTime(hoverTimeValue);
                setHoverPosition(positionPercent);
            }, 10); // 10ms throttle
        };

        const handleMouseLeaveBar = () => {
            isHovering = false;
            clearTimeout(throttleTimer);
            setHoverTime(null);
        };

        progressBar.addEventListener("mouseenter", handleMouseEnterBar);
        progressBar.addEventListener(
            "mousemove",
            handleMouseMoveBar as EventListener,
        );
        progressBar.addEventListener("mouseleave", handleMouseLeaveBar);

        return () => {
            progressBar.removeEventListener("mouseenter", handleMouseEnterBar);
            progressBar.removeEventListener(
                "mousemove",
                handleMouseMoveBar as EventListener,
            );
            progressBar.removeEventListener("mouseleave", handleMouseLeaveBar);
            clearTimeout(throttleTimer);
        };
    }, [videoDuration]);

    // ✅ NEW: Handle video container click for play/pause
    const handleVideoContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Don't toggle if clicking on controls
        if ((e.target as HTMLElement).closest(".controls-bar")) {
            return;
        }
        handlePlayPause();
    };

    // Handle volume change
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        if (videoRef.current) {
            videoRef.current.volume = vol;
        }
        if (vol > 0 && isMuted) setIsMuted(false);
    };

    // Handle mute/unmute
    const handleMuteToggle = useCallback(() => {
        if (videoRef.current) {
            if (isMuted) {
                videoRef.current.volume = volume;
                setIsMuted(false);
            } else {
                videoRef.current.volume = 0;
                setIsMuted(true);
            }
        }
    }, [isMuted, volume]);

    // Handle fullscreen
    const handleFullscreen = useCallback(async () => {
        if (!document.fullscreenElement && containerRef.current) {
            try {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } catch (error) {
                console.error("Fullscreen request failed:", error);
            }
        } else if (document.fullscreenElement) {
            try {
                await document.exitFullscreen();
                setIsFullscreen(false);
            } catch (error) {
                console.error("Exit fullscreen failed:", error);
            }
        }
    }, []);

    // Handle playback rate
    const handlePlaybackRateChange = (rate: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
        setShowSettings(false);
    };

    // Handle buffered progress
    const handleProgress = useCallback(() => {
        if (videoRef.current) {
            const video = videoRef.current;
            if (video.buffered.length > 0) {
                const bufferedEnd = video.buffered.end(
                    video.buffered.length - 1,
                );
                const percent = (bufferedEnd / video.duration) * 100;
                setBufferedPercent(percent);
            }
        }
    }, []);

    // Handle skip forward/backward
    const handleSkip = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(
                0,
                Math.min(videoDuration, videoRef.current.currentTime + seconds),
            );
        }
    };

    // Save progress to backend
    const saveProgress = async (timestamp: number) => {
        try {
            await fetch(`/api/lessons/${lessonId}/video/progress`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    timestamp: Math.round(timestamp),
                    duration: Math.round(videoDuration),
                }),
            });
        } catch (error) {
            console.error("Failed to save progress:", error);
        }
    };

    // Hide controls after inactivity (only in fullscreen)
    const handleMouseMove = useCallback(() => {
        // Always show controls when not fullscreen
        if (!isFullscreen) {
            setShowControls(true);
            return;
        }

        // In fullscreen: show on mouse move, hide after 3 seconds
        setShowAutoHideControls(true);
        setShowControls(true);

        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }

        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                setShowAutoHideControls(false);
            }, 3000);
        }
    }, [isPlaying, isFullscreen]);

    // Format time display
    const formatTime = (time: number) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
                .toString()
                .padStart(2, "0")}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    // Calculate progress percentage
    const progressPercent =
        videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

    return (
        <div className="w-full space-y-1">
            {/* Video Title - Above Player */}
            {title && (
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200 px-1 truncate">
                    {title}
                </div>
            )}

            {/* Video Player Container */}
            <div
                ref={containerRef}
                className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden group cursor-pointer relative"
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => {
                    if (isFullscreen && isPlaying) {
                        setShowControls(false);
                    }
                }}
                onClick={handleVideoContainerClick}
            >
                {/* YouTube Embed (instead of video element) */}
                {isYouTubeVideo && youtubeEmbedUrl && (
                    <div className="relative w-full h-full">
                        <iframe
                            width="100%"
                            height="100%"
                            src={youtubeEmbedUrl}
                            title={title || "Video"}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            onMouseMove={(e: any) => e.stopPropagation()}
                        />
                        {/* YouTube Badge */}
                        <div className="absolute top-4 left-4 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 z-30 pointer-events-none">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            YouTube Video
                        </div>
                    </div>
                )}

                {/* Video Element (for file, vimeo, mock videos) */}
                {!isYouTubeVideo && processedVideoUrl && (
                    <video
                        ref={videoRef}
                        src={processedVideoUrl || undefined}
                        className="w-full h-full block"
                        onPlay={() => {
                            setIsPlaying(true);
                            console.log("▶️ [VideoPlayer] Video playing");
                        }}
                        onPause={() => {
                            setIsPlaying(false);
                            console.log("⏸️ [VideoPlayer] Video paused");
                        }}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={handleEnded}
                        onProgress={handleProgress}
                        onLoadStart={() => {
                            setIsLoading(true);
                            console.log("⏳ [VideoPlayer] Loading started");
                        }}
                        onCanPlay={() => {
                            setIsLoading(false);
                            console.log("✅ [VideoPlayer] Video ready to play");
                        }}
                        onError={(e: any) => {
                            setVideoError(true);
                            setIsLoading(false);
                            const error = videoRef.current?.error;
                            console.error(
                                "❌ [VideoPlayer] Error loading video:",
                                {
                                    code: error?.code,
                                    message: error?.message,
                                    url: processedVideoUrl,
                                    videoType: getVideoType(videoUrl),
                                },
                            );
                        }}
                        crossOrigin="anonymous"
                        onMouseMove={(e: any) => e.stopPropagation()}
                    />
                )}

                {/* Loading Indicator - only for non-YouTube videos */}
                {isLoading && !isYouTubeVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="w-8 h-8 border-4 border-gray-600 border-t-orange-500 rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Video Error Indicator */}
                {videoError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <div className="text-center">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <p className="text-white text-lg font-semibold">
                                Video failed to load
                            </p>
                            <p className="text-gray-400 text-sm mt-2 max-w-md">
                                {videoUrl ? (
                                    <>
                                        The video URL may be invalid or
                                        inaccessible.
                                        <br />
                                        <span className="text-xs text-gray-500 break-all mt-2 block">
                                            {videoUrl}
                                        </span>
                                    </>
                                ) : (
                                    "No video URL provided"
                                )}
                            </p>
                            <button
                                onClick={() => {
                                    setVideoError(false);
                                    setIsLoading(false);
                                }}
                                className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Mock Video Badge */}
                {isMockVideo && !isYouTubeVideo && (
                    <div className="absolute top-4 left-4 bg-yellow-500/80 text-black px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 z-30">
                        <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                        Demo Video
                    </div>
                )}

                {/* Play Button Overlay - visible when paused, clickable (only for non-YouTube videos) */}
                {!isPlaying && !isYouTubeVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none group-hover:bg-black/30 transition-colors">
                        <Play className="w-16 h-16 text-white fill-white opacity-80" />
                    </div>
                )}

                {/* Progress Bar (always visible, hidden for YouTube) */}
                {!isYouTubeVideo && (
                    <div
                        ref={progressBarRef}
                        data-progress-bar
                        className={`group/progress absolute bottom-16 left-0 right-0 h-1 bg-gray-600 cursor-pointer transition-all duration-100 hover:h-2 z-40 ${
                            showControls
                                ? "opacity-100"
                                : "opacity-0 pointer-events-none"
                        }`}
                        onMouseDown={handleProgressMouseDown}
                        onClick={seekToPosition}
                        role="slider"
                        aria-label="Video progress"
                        aria-valuemin={0}
                        aria-valuemax={Math.round(videoDuration)}
                        aria-valuenow={Math.round(currentTime)}
                    >
                        {/* Background track */}
                        <div className="absolute inset-0 bg-gray-600" />

                        {/* Buffered Progress */}
                        <div
                            className="absolute top-0 left-0 h-full bg-gray-500 transition-all"
                            style={{ width: `${bufferedPercent}%` }}
                        />

                        {/* Watched Progress */}
                        <div
                            className="absolute top-0 left-0 h-full bg-orange-500 transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />

                        {/* Progress Indicator (dot) - shows during drag or hover */}
                        <div
                            className={`absolute top-1/2 w-3 h-3 bg-orange-500 rounded-full shadow-lg transition-opacity z-50 ${
                                isDraggingProgress || hoverTime !== null
                                    ? "opacity-100 scale-100"
                                    : "opacity-0 group-hover/progress:opacity-100 group-hover/progress:scale-100 scale-0"
                            }`}
                            style={{
                                left: `${progressPercent}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                        />

                        {/* Hover Preview Tooltip */}
                        {hoverTime !== null && (
                            <div
                                className="absolute -top-14 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded shadow-xl border border-gray-600 pointer-events-none z-50 whitespace-nowrap"
                                style={{ left: `${hoverPosition}%` }}
                            >
                                <div className="font-mono font-bold text-orange-400">
                                    {formatTime(hoverTime)}
                                </div>
                                {/* Arrow pointer */}
                                <div
                                    className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                                    style={{
                                        borderLeft: "6px solid transparent",
                                        borderRight: "6px solid transparent",
                                        borderTop: "6px solid rgb(17, 24, 39)",
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Controls Bar - Always visible (hidden for YouTube) */}
                {!isYouTubeVideo && (
                    <div
                        className={`controls-bar absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-8 pb-4 px-4 transition-opacity duration-200 ${
                            showControls
                                ? "opacity-100 pointer-events-auto"
                                : "opacity-0 pointer-events-none"
                        }`}
                    >
                        {/* Controls Row */}
                        <div className="flex items-center justify-between gap-3">
                            {/* Left Controls */}
                            <div className="flex items-center gap-2">
                                {/* Play/Pause */}
                                <button
                                    onClick={handlePlayPause}
                                    className="p-2 hover:bg-white/20 rounded transition-colors text-white"
                                    title={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? (
                                        <Pause className="w-4 h-4" />
                                    ) : (
                                        <Play className="w-4 h-4 fill-white" />
                                    )}
                                </button>

                                {/* Skip Buttons */}
                                <button
                                    onClick={() => handleSkip(-10)}
                                    className="p-2 hover:bg-white/20 rounded transition-colors text-white text-xs"
                                    title="Skip back 10s"
                                >
                                    <SkipBack className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={() => handleSkip(10)}
                                    className="p-2 hover:bg-white/20 rounded transition-colors text-white text-xs"
                                    title="Skip forward 10s"
                                >
                                    <SkipForward className="w-4 h-4" />
                                </button>

                                {/* Volume */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleMuteToggle}
                                        className="p-2 hover:bg-white/20 rounded transition-colors text-white"
                                        title={isMuted ? "Unmute" : "Mute"}
                                    >
                                        {isMuted ? (
                                            <VolumeX className="w-4 h-4" />
                                        ) : (
                                            <Volume2 className="w-4 h-4" />
                                        )}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-16 h-1 bg-gray-600 rounded cursor-pointer accent-orange-500"
                                    />
                                </div>

                                {/* Time Display */}
                                <div className="text-white text-xs font-mono ml-2">
                                    {formatTime(currentTime)} /{" "}
                                    {formatTime(videoDuration)}
                                </div>
                            </div>

                            {/* Right Controls */}
                            <div className="flex items-center gap-2">
                                {/* Settings */}
                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setShowSettings(!showSettings)
                                        }
                                        className="p-2 hover:bg-white/20 rounded transition-colors text-white"
                                        title="Settings"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>

                                    {/* Settings Menu */}
                                    {showSettings && (
                                        <div className="absolute bottom-12 right-0 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden shadow-lg min-w-max">
                                            <div className="p-2 text-white text-sm font-semibold border-b border-gray-700">
                                                Playback Speed
                                            </div>
                                            {[
                                                0.5, 0.75, 1, 1.25, 1.5, 1.75,
                                                2,
                                            ].map((rate) => (
                                                <button
                                                    key={rate}
                                                    onClick={() =>
                                                        handlePlaybackRateChange(
                                                            rate,
                                                        )
                                                    }
                                                    className={`block w-full text-left px-4 py-2 text-sm ${
                                                        playbackRate === rate
                                                            ? "bg-orange-500 text-white"
                                                            : "text-gray-300 hover:bg-gray-800"
                                                    }`}
                                                >
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Download */}
                                <button
                                    onClick={() => {
                                        if (!processedVideoUrl) return;
                                        const link =
                                            document.createElement("a");
                                        link.href = processedVideoUrl;
                                        link.download = title || "video.mp4";
                                        link.click();
                                    }}
                                    className="p-2 hover:bg-white/20 rounded transition-colors text-white"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" />
                                </button>

                                {/* Share */}
                                <button
                                    onClick={async () => {
                                        try {
                                            await navigator.share({
                                                title,
                                                text: "Check out this lesson",
                                                url: window.location.href,
                                            });
                                        } catch (error) {
                                            console.error(
                                                "Share failed:",
                                                error,
                                            );
                                        }
                                    }}
                                    className="p-2 hover:bg-white/20 rounded transition-colors text-white"
                                    title="Share"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>

                                {/* Fullscreen */}
                                <button
                                    onClick={handleFullscreen}
                                    className="p-2 hover:bg-white/20 rounded transition-colors text-white"
                                    title={
                                        isFullscreen
                                            ? "Exit Fullscreen"
                                            : "Fullscreen"
                                    }
                                >
                                    {isFullscreen ? (
                                        <Minimize className="w-4 h-4" />
                                    ) : (
                                        <Maximize className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
