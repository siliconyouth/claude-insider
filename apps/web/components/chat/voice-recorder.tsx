/**
 * Voice Recorder Component
 *
 * Recording UI for voice messages with:
 * - Real-time waveform visualization
 * - Duration counter
 * - Cancel/send controls
 * - Recording permission handling
 *
 * Usage:
 * ```tsx
 * <VoiceRecorderButton
 *   onRecordingComplete={(result) => handleSendVoice(result)}
 *   onCancel={() => setShowRecorder(false)}
 * />
 * ```
 */

"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/design-system";
import {
  VoiceRecorder,
  type VoiceRecorderResult,
  type VoiceRecorderState,
  formatDuration,
  isVoiceRecordingSupported,
} from "@/lib/chat/voice";

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceRecorderProps {
  /** Called when recording is complete */
  onRecordingComplete: (result: VoiceRecorderResult) => void;
  /** Called when recording is cancelled */
  onCancel?: () => void;
  /** Maximum recording duration in seconds */
  maxDuration?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional class name */
  className?: string;
}

export interface VoiceRecorderButtonProps {
  /** Called when recording is complete */
  onRecordingComplete: (result: VoiceRecorderResult) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class name */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_CONFIG = {
  sm: {
    container: "h-10",
    icon: "w-4 h-4",
    text: "text-xs",
    waveform: "h-6",
  },
  md: {
    container: "h-12",
    icon: "w-5 h-5",
    text: "text-sm",
    waveform: "h-8",
  },
  lg: {
    container: "h-14",
    icon: "w-6 h-6",
    text: "text-base",
    waveform: "h-10",
  },
};

// ============================================================================
// VOICE RECORDER INLINE
// ============================================================================

/**
 * Full voice recorder with waveform and controls
 */
export const VoiceRecorderInline = memo(function VoiceRecorderInline({
  onRecordingComplete,
  onCancel,
  maxDuration = 300,
  size = "md",
  className,
}: VoiceRecorderProps) {
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    duration: 0,
    waveform: [],
    error: null,
  });
  const [permissionDenied, setPermissionDenied] = useState(false);

  const sizeConfig = SIZE_CONFIG[size];

  // Initialize recorder on mount
  useEffect(() => {
    recorderRef.current = new VoiceRecorder({
      maxDuration,
      debug: process.env.NODE_ENV === "development",
    });

    const unsubscribe = recorderRef.current.onStateChange(setState);

    return () => {
      unsubscribe();
      recorderRef.current?.destroy();
    };
  }, [maxDuration]);

  // Auto-start recording
  useEffect(() => {
    const startRecording = async () => {
      if (recorderRef.current) {
        try {
          await recorderRef.current.start();
        } catch (error) {
          if (error instanceof Error && error.name === "NotAllowedError") {
            setPermissionDenied(true);
          }
        }
      }
    };

    startRecording();
  }, []);

  const handleStop = useCallback(async () => {
    if (recorderRef.current?.isRecording()) {
      const result = await recorderRef.current.stop();
      onRecordingComplete(result);
    }
  }, [onRecordingComplete]);

  const handleCancel = useCallback(() => {
    recorderRef.current?.cancel();
    onCancel?.();
  }, [onCancel]);

  // Permission denied state
  if (permissionDenied) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg",
          "bg-red-50 dark:bg-red-900/20",
          "text-red-700 dark:text-red-300",
          sizeConfig.container,
          className
        )}
      >
        <MicrophoneOffIcon className={sizeConfig.icon} />
        <span className={sizeConfig.text}>Microphone access denied</span>
        <button
          onClick={handleCancel}
          className="ml-auto text-red-600 dark:text-red-400 hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-lg",
          "bg-red-50 dark:bg-red-900/20",
          "text-red-700 dark:text-red-300",
          sizeConfig.container,
          className
        )}
      >
        <span className={sizeConfig.text}>{state.error}</span>
        <button
          onClick={handleCancel}
          className="ml-auto text-red-600 dark:text-red-400 hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-lg",
        "bg-red-50 dark:bg-red-900/20",
        "border border-red-200 dark:border-red-800",
        sizeConfig.container,
        className
      )}
    >
      {/* Recording indicator */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span
          className={cn(
            "font-mono font-medium text-red-700 dark:text-red-300",
            sizeConfig.text
          )}
        >
          {formatDuration(state.duration)}
        </span>
      </div>

      {/* Waveform */}
      <div className={cn("flex-1", sizeConfig.waveform)}>
        <WaveformDisplay waveform={state.waveform} isActive={state.isRecording} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Cancel button */}
        <button
          onClick={handleCancel}
          className={cn(
            "p-2 rounded-full",
            "text-gray-500 dark:text-gray-400",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "transition-colors"
          )}
          title="Cancel"
        >
          <TrashIcon className={sizeConfig.icon} />
        </button>

        {/* Send button */}
        <button
          onClick={handleStop}
          className={cn(
            "p-2 rounded-full",
            "bg-red-500 hover:bg-red-600",
            "text-white",
            "transition-colors"
          )}
          title="Send voice message"
        >
          <SendIcon className={sizeConfig.icon} />
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// VOICE RECORDER BUTTON
// ============================================================================

/**
 * Button to start voice recording
 */
export const VoiceRecorderButton = memo(function VoiceRecorderButton({
  onRecordingComplete,
  disabled = false,
  size = "md",
  className,
}: VoiceRecorderButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported] = useState(() => isVoiceRecordingSupported());

  const handleComplete = useCallback(
    (result: VoiceRecorderResult) => {
      setIsRecording(false);
      onRecordingComplete(result);
    },
    [onRecordingComplete]
  );

  const handleCancel = useCallback(() => {
    setIsRecording(false);
  }, []);

  if (!isSupported) {
    return null;
  }

  if (isRecording) {
    return (
      <VoiceRecorderInline
        onRecordingComplete={handleComplete}
        onCancel={handleCancel}
        size={size}
        className={className}
      />
    );
  }

  const sizeConfig = SIZE_CONFIG[size];

  return (
    <button
      onClick={() => setIsRecording(true)}
      disabled={disabled}
      className={cn(
        "p-2 rounded-full",
        "text-gray-500 dark:text-gray-400",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "hover:text-gray-700 dark:hover:text-gray-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transition-colors",
        className
      )}
      title="Record voice message"
    >
      <MicrophoneIcon className={sizeConfig.icon} />
    </button>
  );
});

// ============================================================================
// WAVEFORM DISPLAY
// ============================================================================

interface WaveformDisplayProps {
  waveform: number[];
  isActive?: boolean;
  className?: string;
}

/**
 * Animated waveform visualization
 */
const WaveformDisplay = memo(function WaveformDisplay({
  waveform,
  isActive = false,
  className,
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw waveform
    const barWidth = 3;
    const barGap = 2;
    const maxBars = Math.floor(rect.width / (barWidth + barGap));
    const displayWaveform = waveform.slice(-maxBars);

    ctx.fillStyle = isActive ? "#ef4444" : "#9ca3af"; // Red when active, gray otherwise

    for (let i = 0; i < displayWaveform.length; i++) {
      const amplitude = displayWaveform[i] ?? 0;
      const barHeight = Math.max(2, amplitude * (rect.height - 4));
      const x = i * (barWidth + barGap);
      const y = (rect.height - barHeight) / 2;

      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [waveform, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full h-full rounded", className)}
      style={{ display: "block" }}
    />
  );
});

// ============================================================================
// SVG ICONS
// ============================================================================

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function MicrophoneOffIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
