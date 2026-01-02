/**
 * Voice Message Recording & Playback
 *
 * Provides voice message functionality for chat:
 * - Audio recording with real-time waveform visualization
 * - Playback with seek and speed controls
 * - Supabase Storage integration
 * - Optional AI transcription
 *
 * Browser requirements:
 * - MediaRecorder API (all modern browsers)
 * - Web Audio API (for waveform)
 * - WebM/Opus codec (Chrome, Firefox, Edge) or MP4 (Safari)
 */

"use client";

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceRecorderConfig {
  /** Maximum recording duration in seconds (default: 300 = 5 min) */
  maxDuration?: number;
  /** Sample rate for waveform (ms between samples, default: 100) */
  waveformSampleRate?: number;
  /** Preferred MIME type (auto-detected if not specified) */
  mimeType?: string;
  /** Enable debug logging */
  debug?: boolean;
}

export interface VoiceRecorderState {
  /** Whether currently recording */
  isRecording: boolean;
  /** Current duration in seconds */
  duration: number;
  /** Waveform data (normalized 0-1 values) */
  waveform: number[];
  /** Recording error */
  error: string | null;
}

export interface VoiceRecorderResult {
  /** Audio blob */
  blob: Blob;
  /** Duration in seconds */
  duration: number;
  /** Waveform data for visualization */
  waveform: number[];
  /** MIME type */
  mimeType: string;
}

export interface VoicePlayerState {
  /** Whether currently playing */
  isPlaying: boolean;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Playback speed (1 = normal) */
  playbackRate: number;
  /** Whether audio is loaded */
  isLoaded: boolean;
  /** Loading/playback error */
  error: string | null;
}

export type VoiceRecorderEventHandler = (state: VoiceRecorderState) => void;
export type VoicePlayerEventHandler = (state: VoicePlayerState) => void;

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_DURATION = 300; // 5 minutes
const DEFAULT_WAVEFORM_SAMPLE_RATE = 100; // ms
const MAX_WAVEFORM_SAMPLES = 100; // Max samples to store (for UI)
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// Preferred MIME types in order of preference
const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
];

// ============================================================================
// VOICE RECORDER CLASS
// ============================================================================

export class VoiceRecorder {
  private config: Required<VoiceRecorderConfig>;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private waveform: number[] = [];
  private startTime: number = 0;
  private duration: number = 0;
  private animationFrame: number | null = null;
  private durationInterval: NodeJS.Timeout | null = null;
  private listeners: Set<VoiceRecorderEventHandler> = new Set();

  constructor(config: VoiceRecorderConfig = {}) {
    this.config = {
      maxDuration: config.maxDuration ?? DEFAULT_MAX_DURATION,
      waveformSampleRate: config.waveformSampleRate ?? DEFAULT_WAVEFORM_SAMPLE_RATE,
      mimeType: config.mimeType ?? this.detectMimeType(),
      debug: config.debug ?? false,
    };
  }

  // ==========================================================================
  // RECORDING
  // ==========================================================================

  /**
   * Start recording
   */
  async start(): Promise<void> {
    if (this.mediaRecorder?.state === "recording") {
      throw new Error("Already recording");
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up audio analysis for waveform
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.config.mimeType,
      });

      this.chunks = [];
      this.waveform = [];
      this.startTime = Date.now();
      this.duration = 0;

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms

      // Start waveform analysis
      this.startWaveformAnalysis();

      // Start duration tracking
      this.startDurationTracking();

      this.notifyListeners();
      this.log("Recording started");
    } catch (error) {
      this.notifyListeners(error instanceof Error ? error.message : "Failed to start recording");
      throw error;
    }
  }

  /**
   * Stop recording and return result
   */
  async stop(): Promise<VoiceRecorderResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== "recording") {
        reject(new Error("Not recording"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        // Create blob from chunks
        const blob = new Blob(this.chunks, { type: this.config.mimeType });

        // Check file size
        if (blob.size > MAX_FILE_SIZE_BYTES) {
          reject(new Error(`Recording too large (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)`));
          this.cleanup();
          return;
        }

        // Normalize waveform to max 100 samples
        const normalizedWaveform = this.normalizeWaveform(this.waveform);

        const result: VoiceRecorderResult = {
          blob,
          duration: this.duration,
          waveform: normalizedWaveform,
          mimeType: this.config.mimeType,
        };

        this.cleanup();
        this.log("Recording stopped, duration:", this.duration);
        resolve(result);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancel recording without saving
   */
  cancel(): void {
    this.log("Recording cancelled");
    this.cleanup();
  }

  /**
   * Get current recording duration
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * Get current waveform data
   */
  getWaveform(): number[] {
    return [...this.waveform];
  }

  /**
   * Check if recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording";
  }

  // ==========================================================================
  // WAVEFORM ANALYSIS
  // ==========================================================================

  private startWaveformAnalysis(): void {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const analyze = () => {
      if (!this.analyser || !this.mediaRecorder || this.mediaRecorder.state !== "recording") {
        return;
      }

      this.analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS (root mean square) for amplitude
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const sample = dataArray[i] ?? 128;
        const normalized = (sample - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Normalize to 0-1 range
      const amplitude = Math.min(1, rms * 3); // Scale up for visibility

      this.waveform.push(amplitude);
      this.notifyListeners();

      this.animationFrame = requestAnimationFrame(analyze);
    };

    // Sample at configured rate
    const sampleInterval = setInterval(() => {
      if (this.mediaRecorder?.state === "recording") {
        analyze();
      } else {
        clearInterval(sampleInterval);
      }
    }, this.config.waveformSampleRate);
  }

  private startDurationTracking(): void {
    this.durationInterval = setInterval(() => {
      if (this.mediaRecorder?.state === "recording") {
        this.duration = (Date.now() - this.startTime) / 1000;

        // Auto-stop at max duration
        if (this.duration >= this.config.maxDuration) {
          this.log("Max duration reached, stopping");
          this.stop();
        }

        this.notifyListeners();
      }
    }, 100);
  }

  private normalizeWaveform(waveform: number[]): number[] {
    if (waveform.length <= MAX_WAVEFORM_SAMPLES) {
      return waveform;
    }

    // Downsample to MAX_WAVEFORM_SAMPLES
    const ratio = waveform.length / MAX_WAVEFORM_SAMPLES;
    const normalized: number[] = [];

    for (let i = 0; i < MAX_WAVEFORM_SAMPLES; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.floor((i + 1) * ratio);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += waveform[j] ?? 0;
      }
      normalized.push(sum / (end - start));
    }

    return normalized;
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  onStateChange(handler: VoiceRecorderEventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  private notifyListeners(error?: string): void {
    const state: VoiceRecorderState = {
      isRecording: this.mediaRecorder?.state === "recording",
      duration: this.duration,
      waveform: [...this.waveform],
      error: error ?? null,
    };

    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        this.log("Error in listener:", err);
      }
    }
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  private detectMimeType(): string {
    for (const mimeType of PREFERRED_MIME_TYPES) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    return "audio/webm"; // Fallback
  }

  private cleanup(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.analyser = null;
    this.chunks = [];
    this.notifyListeners();
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log("[VoiceRecorder]", ...args);
    }
  }

  destroy(): void {
    this.cleanup();
    this.listeners.clear();
  }
}

// ============================================================================
// VOICE PLAYER CLASS
// ============================================================================

export class VoicePlayer {
  private audio: HTMLAudioElement | null = null;
  private state: VoicePlayerState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    isLoaded: false,
    error: null,
  };
  private listeners: Set<VoicePlayerEventHandler> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Load audio from URL
   */
  async load(url: string): Promise<void> {
    this.cleanup();

    return new Promise((resolve, reject) => {
      this.audio = new Audio();
      this.audio.preload = "auto";

      this.audio.onloadedmetadata = () => {
        if (this.audio) {
          this.state.duration = this.audio.duration;
          this.state.isLoaded = true;
          this.state.error = null;
          this.notifyListeners();
          resolve();
        }
      };

      this.audio.onerror = () => {
        this.state.error = "Failed to load audio";
        this.state.isLoaded = false;
        this.notifyListeners();
        reject(new Error("Failed to load audio"));
      };

      this.audio.onended = () => {
        this.state.isPlaying = false;
        this.state.currentTime = 0;
        this.notifyListeners();
        this.stopUpdateInterval();
      };

      this.audio.src = url;
    });
  }

  /**
   * Play audio
   */
  async play(): Promise<void> {
    if (!this.audio || !this.state.isLoaded) {
      throw new Error("Audio not loaded");
    }

    await this.audio.play();
    this.state.isPlaying = true;
    this.notifyListeners();
    this.startUpdateInterval();
  }

  /**
   * Pause audio
   */
  pause(): void {
    if (this.audio) {
      this.audio.pause();
      this.state.isPlaying = false;
      this.notifyListeners();
      this.stopUpdateInterval();
    }
  }

  /**
   * Toggle play/pause
   */
  togglePlay(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Seek to position (0-1 percentage or seconds)
   */
  seek(position: number, isPercentage = false): void {
    if (!this.audio) return;

    const targetTime = isPercentage ? position * this.state.duration : position;
    this.audio.currentTime = Math.max(0, Math.min(targetTime, this.state.duration));
    this.state.currentTime = this.audio.currentTime;
    this.notifyListeners();
  }

  /**
   * Set playback speed (0.5, 1, 1.5, 2)
   */
  setPlaybackRate(rate: number): void {
    if (this.audio) {
      this.audio.playbackRate = rate;
      this.state.playbackRate = rate;
      this.notifyListeners();
    }
  }

  /**
   * Get current state
   */
  getState(): VoicePlayerState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(handler: VoicePlayerEventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  private startUpdateInterval(): void {
    this.stopUpdateInterval();
    this.updateInterval = setInterval(() => {
      if (this.audio) {
        this.state.currentTime = this.audio.currentTime;
        this.notifyListeners();
      }
    }, 50); // Update every 50ms for smooth progress
  }

  private stopUpdateInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (error) {
        console.error("[VoicePlayer] Error in listener:", error);
      }
    }
  }

  private cleanup(): void {
    this.stopUpdateInterval();
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
    this.state = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1,
      isLoaded: false,
      error: null,
    };
  }

  destroy(): void {
    this.cleanup();
    this.listeners.clear();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format duration as MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Check if voice recording is supported
 */
export function isVoiceRecordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia !== "undefined" &&
    typeof MediaRecorder !== "undefined"
  );
}

/**
 * Get supported audio MIME type
 */
export function getSupportedMimeType(): string | null {
  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return null;
}
