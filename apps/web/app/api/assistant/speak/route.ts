import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30;

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI();
  }
  return openaiClient;
}

// Available voices for TTS
export const TTS_VOICES = {
  alloy: "alloy", // Neutral, balanced
  echo: "echo", // Warm, conversational
  fable: "fable", // Expressive, storytelling
  onyx: "onyx", // Deep, authoritative
  nova: "nova", // Friendly, upbeat
  shimmer: "shimmer", // Clear, professional
} as const;

export type TTSVoice = keyof typeof TTS_VOICES;

interface SpeakRequest {
  text: string;
  voice?: TTSVoice;
}

export async function POST(request: Request) {
  try {
    const body: SpeakRequest = await request.json();
    const { text, voice = "nova" } = body;

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Limit text length to prevent abuse (OpenAI has 4096 char limit)
    const truncatedText = text.slice(0, 4000);

    // Generate speech using OpenAI TTS
    const openai = getOpenAI();
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1", // Use tts-1 for speed, tts-1-hd for quality
      voice: voice,
      input: truncatedText,
      response_format: "mp3",
      speed: 1.0, // Normal speed for natural speech
    });

    // Get the audio as array buffer
    const audioBuffer = await mp3Response.arrayBuffer();

    // Return audio as response
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("TTS API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate speech";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
