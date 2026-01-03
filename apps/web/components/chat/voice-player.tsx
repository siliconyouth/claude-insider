/**
 * Voice Player Component
 *
 * Playback UI for voice messages with:
 * - Waveform visualization with progress
 * - Play/pause controls
 * - Seek by clicking waveform
 * - Playback speed control (1x, 1.5x, 2x)
 * - Duration display
 *
 * Usage:
 * ```tsx
 * <VoiceMessagePlayer
 *   url="https://storage.example.com/voice.webm"
 *   waveform={[0.1, 0.3, 0.5, ...]}
 *   duration={15}
 * />
 * ```
 */

"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/design-system";
import { VoicePlayer, type VoicePlayerState, formatDuration } from "@/lib/chat/voice";

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceMessagePlayerProps {
  /** Audio URL */
  url: string;
  /** Waveform data (normalized 0-1 values) */
  waveform?: number[];
  /** Duration in seconds (for initial display before load) */
  duration?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether this is the sender's message (for styling) */
  isOwnMessage?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_CONFIG = {
  sm: {
    container: "px-3 py-2",
    icon: "w-6 h-6",
    text: "text-xs",
    waveform: "h-6",
    playButton: "w-8 h-8",
  },
  md: {
    container: "px-4 py-3",
    icon: "w-8 h-8",
    text: "text-sm",
    waveform: "h-8",
    playButton: "w-10 h-10",
  },
  lg: {
    container: "px-5 py-4",
    icon: "w-10 h-10",
    text: "text-base",
    waveform: "h-10",
    playButton: "w-12 h-12",
  },
};

const PLAYBACK_SPEEDS = [1, 1.5, 2];

// ============================================================================
// VOICE MESSAGE PLAYER
// ============================================================================

export const VoiceMessagePlayer = memo(function VoiceMessagePlayer({
  url,
  waveform = [],
  duration: initialDuration = 0,
  size = "md",
  isOwnMessage = false,
  className,
}: VoiceMessagePlayerProps) {
  const playerRef = useRef<VoicePlayer | null>(null);
  const [state, setState] = useState<VoicePlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: initialDuration,
    playbackRate: 1,
    isLoaded: false,
    error: null,
  });
  const [speedIndex, setSpeedIndex] = useState(0);

  const sizeConfig = SIZE_CONFIG[size];

  // Initialize player
  useEffect(() => {
    console.log("[VoicePlayer] Initializing with url:", url, "initialDuration:", initialDuration);

    if (!url) {
      console.error("[VoicePlayer] No URL provided!");
      setState((prev) => ({ ...prev, error: "No audio URL" }));
      return;
    }

    playerRef.current = new VoicePlayer();

    const unsubscribe = playerRef.current.onStateChange((newState) => {
      console.log("[VoicePlayer] State change:", newState);
      setState(newState);
    });

    // Load audio
    playerRef.current.load(url).catch((error) => {
      console.error("[VoicePlayer] Failed to load audio:", error, "URL:", url);
    });

    return () => {
      unsubscribe();
      playerRef.current?.destroy();
    };
  }, [url, initialDuration]);

  const handlePlayPause = useCallback(() => {
    playerRef.current?.togglePlay();
  }, []);

  const handleSeek = useCallback((percentage: number) => {
    playerRef.current?.seek(percentage, true);
  }, []);

  const handleSpeedChange = useCallback(() => {
    const nextIndex = (speedIndex + 1) % PLAYBACK_SPEEDS.length;
    const newSpeed = PLAYBACK_SPEEDS[nextIndex] ?? 1;
    setSpeedIndex(nextIndex);
    playerRef.current?.setPlaybackRate(newSpeed);
  }, [speedIndex]);

  const progress = state.duration > 0 ? state.currentTime / state.duration : 0;

  // Colors based on sender
  const bgColor = isOwnMessage
    ? "bg-gradient-to-r from-violet-600/10 to-cyan-600/10"
    : "bg-gray-100 dark:bg-gray-800";

  const playButtonColor = isOwnMessage
    ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
    : "bg-gray-700 dark:bg-gray-600 text-white";

  const progressColor = isOwnMessage
    ? "from-violet-500 to-cyan-500"
    : "from-gray-500 to-gray-400";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl",
        bgColor,
        sizeConfig.container,
        className
      )}
    >
      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        disabled={!state.isLoaded}
        className={cn(
          "shrink-0 rounded-full flex items-center justify-center",
          "transition-transform hover:scale-105 active:scale-95",
          "disabled:opacity-50",
          playButtonColor,
          sizeConfig.playButton
        )}
        title={state.isPlaying ? "Pause" : "Play"}
      >
        {state.isPlaying ? (
          <PauseIcon className={sizeConfig.icon} />
        ) : (
          <PlayIcon className={sizeConfig.icon} />
        )}
      </button>

      {/* Waveform with Progress */}
      <div className="flex-1 flex flex-col gap-1">
        <WaveformProgress
          waveform={waveform}
          progress={progress}
          progressColor={progressColor}
          onSeek={handleSeek}
          isPlaying={state.isPlaying}
          className={sizeConfig.waveform}
        />

        {/* Time and Speed */}
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "font-mono ui-text-secondary",
              sizeConfig.text
            )}
          >
            {formatDuration(state.currentTime)} / {formatDuration(state.duration)}
          </span>

          <button
            onClick={handleSpeedChange}
            className={cn(
              "px-2 py-0.5 rounded",
              "bg-gray-200/50 dark:bg-gray-700/50",
              "hover:bg-gray-200 dark:hover:bg-gray-700",
              "transition-colors",
              "font-medium ui-text-secondary",
              sizeConfig.text
            )}
            title="Change playback speed"
          >
            {PLAYBACK_SPEEDS[speedIndex]}x
          </button>
        </div>
      </div>

      {/* Loading/Error State */}
      {state.error && (
        <span
          className={cn(
            "text-red-500 dark:text-red-400",
            sizeConfig.text
          )}
          title={state.error}
        >
          ⚠️ {state.error}
        </span>
      )}
    </div>
  );
});

// ============================================================================
// WAVEFORM PROGRESS
// ============================================================================

interface WaveformProgressProps {
  waveform: number[];
  progress: number;
  progressColor: string;
  onSeek: (percentage: number) => void;
  isPlaying?: boolean;
  className?: string;
}

const WaveformProgress = memo(function WaveformProgress({
  waveform,
  progress,
  progressColor,
  onSeek,
  isPlaying = false,
  className,
}: WaveformProgressProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Generate waveform if none provided
    const displayWaveform = waveform.length > 0
      ? waveform
      : Array.from({ length: 50 }, () => 0.3 + Math.random() * 0.4);

    const barWidth = 3;
    const barGap = 2;
    const totalWidth = displayWaveform.length * (barWidth + barGap);
    const scale = rect.width / totalWidth;

    // Calculate progress position
    const progressX = progress * rect.width;

    // Draw bars
    for (let i = 0; i < displayWaveform.length; i++) {
      const amplitude = displayWaveform[i] ?? 0;
      const barHeight = Math.max(4, amplitude * (rect.height - 4));
      const x = i * (barWidth + barGap) * scale;
      const y = (rect.height - barHeight) / 2;

      // Color based on progress
      const isPlayed = x < progressX;

      if (isPlayed) {
        // Create gradient for played portion
        const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
        gradient.addColorStop(0, "#8b5cf6"); // violet-500
        gradient.addColorStop(1, "#06b6d4"); // cyan-500
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = "#9ca3af"; // gray-400
      }

      ctx.fillRect(x, y, barWidth * scale, barHeight);
    }
  }, [waveform, progress]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      onSeek(percentage);
    },
    [onSeek]
  );

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn(
        "relative cursor-pointer rounded",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded"
        style={{ display: "block" }}
      />

      {/* Progress indicator line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        style={{ left: `${progress * 100}%` }}
      />
    </div>
  );
});

// ============================================================================
// COMPACT VOICE PLAYER (for message list)
// ============================================================================

export interface CompactVoicePlayerProps {
  url: string;
  duration?: number;
  waveform?: number[];
  isOwnMessage?: boolean;
  className?: string;
}

/**
 * Compact voice player for message bubbles
 */
export const CompactVoicePlayer = memo(function CompactVoicePlayer({
  url,
  duration = 0,
  waveform = [],
  isOwnMessage = false,
  className,
}: CompactVoicePlayerProps) {
  return (
    <VoiceMessagePlayer
      url={url}
      waveform={waveform}
      duration={duration}
      size="sm"
      isOwnMessage={isOwnMessage}
      className={className}
    />
  );
});

// ============================================================================
// SVG ICONS
// ============================================================================

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
    </svg>
  );
}
