import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { TTS_VOICES, type TTSVoice } from "@/lib/tts-voices";

export const runtime = "nodejs";
export const maxDuration = 30;

// Create a fresh client for each request to avoid stale API key issues
function getElevenLabs(apiKey: string): ElevenLabsClient {
  return new ElevenLabsClient({
    apiKey: apiKey,
  });
}

interface SpeakRequest {
  text: string;
  voice?: TTSVoice;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ElevenLabs API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: SpeakRequest = await request.json();
    const { text, voice = "sarah" } = body; // Default to Sarah - natural sounding

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Limit text length
    const truncatedText = text.slice(0, 5000);

    // Get voice ID from voice name
    const voiceId = TTS_VOICES[voice] || TTS_VOICES.sarah;

    // Generate speech using ElevenLabs
    const elevenlabs = getElevenLabs(apiKey);
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text: truncatedText,
      modelId: "eleven_v3", // Latest model - most emotionally expressive, 70+ languages
      outputFormat: "mp3_44100_128", // High quality MP3
    });

    // Buffer the complete audio before sending
    // Note: Streaming MP3 causes playback issues because chunk boundaries
    // don't align with MP3 frame boundaries, causing audio artifacts
    const chunks: Uint8Array[] = [];
    const reader = audioStream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const audioBuffer = Buffer.concat(chunks);

    // Return complete audio as response
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("TTS API error:", error);

    // Check for quota exceeded error
    const errorBody = (error as { body?: { detail?: { status?: string; message?: string } } })?.body;
    if (errorBody?.detail?.status === "quota_exceeded") {
      console.warn("[TTS API] Quota exceeded:", errorBody.detail.message);
      return new Response(
        JSON.stringify({
          error: "quota_exceeded",
          message: errorBody.detail.message
        }),
        {
          status: 429, // Use proper rate limit status code
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate speech";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
