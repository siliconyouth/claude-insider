# AI Assistant Tab Audio Refactoring Plan

## Executive Summary

The new `ai-assistant-tab.tsx` has critical audio handling bugs that cause:
1. **Audio not stopping** when expected
2. **Audio playing over itself** (overlapping)
3. **No cleanup on unmount** (zombie audio)

Root cause: The old `voice-assistant.tsx` uses a **semaphore-based queue system with 6 refs** that was not ported to the new implementation.

---

## Detailed Analysis

### Old Implementation (voice-assistant.tsx) - What Works

#### 1. Audio Refs (6 total)
```typescript
// Main playback
const audioRef = useRef<HTMLAudioElement | null>(null);
// Preview voice playback
const previewAudioRef = useRef<HTMLAudioElement | null>(null);
// TTS audio cache for replay
const audioCacheRef = useRef<Map<string, string>>(new Map());
```

#### 2. Speech Queue System (CRITICAL - 5 refs)
```typescript
// Queue of sentences to speak
const speechQueueRef = useRef<string[]>([]);
// SEMAPHORE: Is audio currently playing?
const isSpeakingQueueRef = useRef(false);
// Track how many sentences have been spoken during streaming
const lastSpokenIndexRef = useRef(0);
// Has streaming completed?
const streamingCompleteRef = useRef(false);
// Accumulate text for mobile (Safari blocks chained audio.play())
const pendingAutoSpeakTextRef = useRef<string>("");
// Mobile detection for TTS strategy
const isMobileRef = useRef(false);
```

#### 3. Key Function: `processSpeechQueue` (lines 402-512)
```typescript
const processSpeechQueue = useCallback(async () => {
  // CRITICAL: Semaphore guard - PREVENTS overlapping audio
  if (isSpeakingQueueRef.current) return;

  // Lock acquired
  isSpeakingQueueRef.current = true;

  // ... play audio ...

  audio.onended = () => {
    // Release lock
    isSpeakingQueueRef.current = false;
    // Process next (desktop only)
    if (!isMobileRef.current && speechQueueRef.current.length > 0) {
      processSpeechQueue();
    }
  };
}, []);
```

#### 4. Key Function: `stopStreamingTTS` (lines 630-646)
```typescript
const stopStreamingTTS = useCallback(() => {
  // Clear the queue
  speechQueueRef.current = [];
  // Release the lock
  isSpeakingQueueRef.current = false;
  // Reset tracking indices
  lastSpokenIndexRef.current = 0;
  streamingCompleteRef.current = false;
  // Stop current audio
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  // Stop browser TTS fallback
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  setIsSpeaking(false);
  setSpeakingMessageIndex(null);
}, []);
```

#### 5. Key Function: `speakMessage` (lines 1262-1383) - Toggle Behavior
```typescript
const speakMessage = useCallback(async (text: string, messageIndex: number) => {
  // Check if clicking the SAME message that's playing
  const isAudioPlaying = audioRef.current !== null && !audioRef.current.paused;
  const isCurrentlySpeakingThisMessage =
    speakingMessageIndex === messageIndex &&
    (isAudioPlaying || isSpeakingQueueRef.current);

  // TOGGLE: Click same message = stop
  if (isCurrentlySpeakingThisMessage) {
    audioRef.current?.pause();
    audioRef.current = null;
    speechQueueRef.current = [];
    isSpeakingQueueRef.current = false;
    // ... reset states ...
    return;
  }

  // STOP OLD before playing NEW
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  speechQueueRef.current = [];
  isSpeakingQueueRef.current = false;

  // Now play new audio...
}, []);
```

#### 6. Cleanup on Unmount (lines 1386-1400)
```typescript
useEffect(() => {
  return () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recognizerRef.current) {
      recognizerRef.current.abort();
      recognizerRef.current = null;
    }
  };
}, []);
```

#### 7. Stop Before Send (in `sendMessage`)
```typescript
// Reset streaming TTS state BEFORE starting new message
stopStreamingTTS();
lastSpokenIndexRef.current = 0;
streamingCompleteRef.current = false;
```

---

### New Implementation (ai-assistant-tab.tsx) - What's Broken

#### Current State (Simplified)
```typescript
// ONLY ONE REF
const audioRef = useRef<HTMLAudioElement | null>(null);

// NO queue refs
// NO semaphore
// NO tracking indices
// NO mobile detection

const speakText = useCallback(async (text: string) => {
  setIsSpeaking(true);
  // BUG: No guard! Can run multiple times simultaneously
  // BUG: Doesn't stop previous audio before creating new
  const audio = new Audio(audioUrl);
  audioRef.current = audio; // BUG: Just overwrites ref, old audio keeps playing!
  await audio.play();
}, []);

const stopSpeaking = useCallback(() => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  // Missing: queue clearing, index reset, streaming flag reset
  setIsSpeaking(false);
}, []);

// NO cleanup effect!
// NO stop before send!
```

---

## Bug Analysis

### Bug 1: Audio Not Stopping
**Cause**: When `speakText` is called again, it creates a NEW Audio object and assigns it to `audioRef`, but the OLD audio object continues playing because it was never stopped.

**Fix**: Call `stopSpeaking()` at the beginning of `speakText()`.

### Bug 2: Audio Playing Over Itself
**Cause**: No semaphore (`isSpeakingQueueRef`) to prevent concurrent executions of `speakText`.

**Fix**: Add `isSpeakingRef` guard at start of `speakText`:
```typescript
if (isSpeakingRef.current) return; // Already playing
isSpeakingRef.current = true;
```

### Bug 3: Click Same Message Doesn't Toggle Off
**Cause**: No tracking of which message is currently speaking (`speakingMessageIndex`).

**Fix**: Add `speakingMessageIndex` state and toggle logic.

### Bug 4: Audio Continues After Tab Switch
**Cause**: No cleanup effect on component unmount.

**Fix**: Add cleanup useEffect.

### Bug 5: No Streaming TTS
**Cause**: The new implementation waits until streaming is complete, then speaks the entire response. The old one speaks sentences as they complete during streaming.

**Fix**: Add sentence splitting and queue processing (optional enhancement).

---

## Refactoring Plan

### Phase 1: Critical Fixes (Stop Overlapping Audio)

#### Step 1.1: Add Missing Refs
```typescript
// At top of component, add:
const isSpeakingRef = useRef(false);           // Semaphore
const speakingMessageIndex = useRef<number | null>(null); // Which message is speaking
```

#### Step 1.2: Fix `speakText` Function
```typescript
const speakText = useCallback(async (text: string, messageIndex?: number) => {
  if (!text.trim()) return;

  // GUARD: If already speaking, stop first
  if (isSpeakingRef.current || audioRef.current) {
    stopSpeaking();
  }

  // LOCK: Set semaphore before any async
  isSpeakingRef.current = true;
  setIsSpeaking(true);
  if (messageIndex !== undefined) {
    speakingMessageIndex.current = messageIndex;
  }

  try {
    const response = await fetch("/api/assistant/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: markdownToSpeakableText(text),
        voice: selectedVoiceRef.current,
      }),
    });

    if (!response.ok) {
      // Fallback to browser TTS
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          speakingMessageIndex.current = null;
        };
        utterance.onerror = () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          speakingMessageIndex.current = null;
        };
        window.speechSynthesis.speak(utterance);
        return;
      }
      throw new Error("TTS failed");
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      speakingMessageIndex.current = null;
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      speakingMessageIndex.current = null;
      URL.revokeObjectURL(audioUrl);
    };

    await audio.play();
  } catch (err) {
    console.error("TTS error:", err);
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    speakingMessageIndex.current = null;
  }
}, []);
```

#### Step 1.3: Fix `stopSpeaking` Function
```typescript
const stopSpeaking = useCallback(() => {
  // Stop audio element
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
  }

  // Stop browser TTS
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  // Release semaphore
  isSpeakingRef.current = false;
  setIsSpeaking(false);
  speakingMessageIndex.current = null;
}, []);
```

#### Step 1.4: Add Cleanup Effect
```typescript
// Add after other useEffects
useEffect(() => {
  return () => {
    // Cleanup on unmount
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (recognizerRef.current) {
      recognizerRef.current.abort();
      recognizerRef.current = null;
    }
  };
}, []);
```

#### Step 1.5: Stop Audio Before Sending New Message
```typescript
const sendMessage = useCallback(async () => {
  const messageText = input.trim();
  if (!messageText || isLoading) return;

  // CRITICAL: Stop any playing audio before new message
  stopSpeaking();

  // ... rest of function
}, [/* deps including stopSpeaking */]);
```

### Phase 2: Enhanced Features (Toggle & Per-Message Speaking)

#### Step 2.1: Add `speakingMessageIndex` State
```typescript
const [speakingMessageIdx, setSpeakingMessageIdx] = useState<number | null>(null);
```

#### Step 2.2: Add Toggle Logic
```typescript
const handleSpeakMessage = useCallback((content: string, index: number) => {
  // If clicking the same message that's playing, toggle off
  if (speakingMessageIdx === index && isSpeaking) {
    stopSpeaking();
    return;
  }

  // Otherwise, stop previous and play new
  speakText(content, index);
  setSpeakingMessageIdx(index);
}, [speakingMessageIdx, isSpeaking, stopSpeaking, speakText]);
```

#### Step 2.3: Update UI to Show Which Message Is Speaking
```typescript
{msg.role === "assistant" && (
  <button
    onClick={() => handleSpeakMessage(msg.content, i)}
    className="..."
  >
    {speakingMessageIdx === i && isSpeaking ? (
      <StopIcon className="h-4 w-4" />
    ) : (
      <SpeakerIcon className="h-4 w-4" />
    )}
  </button>
)}
```

### Phase 3: Optional Enhancements

#### 3.1: Add Audio Caching
```typescript
const audioCacheRef = useRef<Map<string, string>>(new Map());

// In speakText:
const cacheKey = `${selectedVoiceRef.current}:${text}`;
const cachedUrl = audioCacheRef.current.get(cacheKey);
if (cachedUrl) {
  // Use cached audio
  const audio = new Audio(cachedUrl);
  // ...
} else {
  // Fetch and cache
  audioCacheRef.current.set(cacheKey, audioUrl);
}
```

#### 3.2: Add Mobile Detection for TTS Strategy
```typescript
const isMobileRef = useRef(false);

useEffect(() => {
  const ua = navigator.userAgent;
  isMobileRef.current = /iPhone|iPad|iPod|Android/i.test(ua);
}, []);
```

#### 3.3: Add Streaming TTS (sentences during streaming)
Port the full queue system from voice-assistant.tsx if real-time TTS during streaming is desired.

---

## Implementation Checklist

### Phase 1 & 2: Critical Fixes ✅ COMPLETE
- [x] Add `isSpeakingRef` semaphore ref
- [x] Add `speakingMessageIndex` ref/state
- [x] Update `speakText` to stop previous audio first
- [x] Update `speakText` to acquire/release semaphore
- [x] Update `stopSpeaking` to release semaphore
- [x] Add cleanup `useEffect` for unmount
- [x] Call `stopSpeaking()` at start of `sendMessage`
- [x] Update UI buttons to show which message is speaking
- [x] Add toggle behavior for speak buttons

### Manual Testing (User Verification)
- [ ] Test: Click speak on message A, then B - only B should play
- [ ] Test: Click speak on same message twice - should toggle off
- [ ] Test: Send new message while audio playing - should stop audio
- [ ] Test: Switch tabs while audio playing - should stop audio

### Phase 3: Enhanced TTS ✅ COMPLETE
- [x] Add audio caching for replay (audioCacheRef)
- [x] Add mobile detection for TTS strategy (isMobileRef)
- [x] Add sentence splitting with smart punctuation handling
- [x] Add speech queue for sequential sentence playback
- [x] Mobile strategy: batch all sentences into one API call
- [x] Desktop strategy: play sentences sequentially for natural pauses

---

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/components/unified-chat/tabs/ai-assistant-tab.tsx` | All audio handling fixes |

---

## Expected Outcome

After refactoring:
1. Audio stops immediately when requested
2. Only one audio plays at a time
3. Clicking same message toggles audio off
4. Audio stops when sending new messages
5. Audio stops when component unmounts
6. UI correctly shows which message is currently speaking
