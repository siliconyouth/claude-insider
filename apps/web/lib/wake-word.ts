/**
 * Wake Word Detection for "Hey Insider"
 * Uses Web Speech API to continuously listen for the wake phrase
 */

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Wake word variations to detect
const WAKE_PHRASES = [
  "hey insider",
  "hey, insider",
  "hey insiders",
  "a insider",
  "hey inside",
  "hey in sider",
  "heyinsider",
];

// Check browser support
export function isWakeWordSupported(): boolean {
  if (typeof window === "undefined") return false;

  return !!(
    (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition
  );
}

// Get the SpeechRecognition constructor
function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;

  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export interface WakeWordDetectorOptions {
  onWakeWord: () => void;
  onError?: (error: string) => void;
  onListeningChange?: (isListening: boolean) => void;
}

export class WakeWordDetector {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private options: WakeWordDetectorOptions;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;
  private isPaused: boolean = false;

  constructor(options: WakeWordDetectorOptions) {
    this.options = options;
    this.initRecognition();
  }

  private initRecognition(): void {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    this.recognition = new SpeechRecognitionClass();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.recognition.maxAlternatives = 3;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.options.onListeningChange?.(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.options.onListeningChange?.(false);

      // Auto-restart if not paused
      if (!this.isPaused) {
        this.restartTimeout = setTimeout(() => {
          this.start();
        }, 100);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore no-speech and aborted errors (common during continuous listening)
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }

      this.options.onError?.(event.error);
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Check all results for wake word
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;

        // Check all alternatives
        for (let j = 0; j < result.length; j++) {
          const alternative = result[j];
          if (!alternative) continue;

          const transcript = alternative.transcript.toLowerCase().trim();

          // Check if any wake phrase is in the transcript
          for (const phrase of WAKE_PHRASES) {
            if (transcript.includes(phrase)) {
              // Wake word detected!
              this.pause();
              this.options.onWakeWord();
              return;
            }
          }
        }
      }
    };
  }

  start(): void {
    if (!this.recognition) {
      this.options.onError?.("Speech recognition not supported");
      return;
    }

    if (this.isListening) return;

    this.isPaused = false;

    try {
      this.recognition.start();
    } catch {
      // May throw if already started, try restarting
      this.recognition.stop();
      setTimeout(() => {
        try {
          this.recognition?.start();
        } catch {
          // Ignore
        }
      }, 100);
    }
  }

  stop(): void {
    this.isPaused = true;

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  pause(): void {
    this.isPaused = true;

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  resume(): void {
    this.isPaused = false;
    this.start();
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  destroy(): void {
    this.stop();
    this.recognition = null;
  }
}
