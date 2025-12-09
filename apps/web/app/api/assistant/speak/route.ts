import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export const runtime = "nodejs";
export const maxDuration = 30;

// Lazy initialization of ElevenLabs client
let elevenlabsClient: ElevenLabsClient | null = null;

function getElevenLabs(): ElevenLabsClient {
  if (!elevenlabsClient) {
    elevenlabsClient = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }
  return elevenlabsClient;
}

// Available ElevenLabs voices
// These are popular pre-made voices - you can also use custom voice IDs
export const TTS_VOICES = {
  rachel: "21m00Tcm4TlvDq8ikWAM", // Rachel - calm, young female
  drew: "29vD33N1CtxCmqQRPOHJ", // Drew - well-rounded, male
  clyde: "2EiwWnXFnvU5JabPnv8n", // Clyde - war veteran, male
  paul: "5Q0t7uMcjvnagumLfvZi", // Paul - ground reporter, male
  domi: "AZnzlk1XvdvUeBnXmlld", // Domi - strong, young female
  dave: "CYw3kZ02Hs0563khs1Fj", // Dave - conversational, male
  fin: "D38z5RcWu1voky8WS1ja", // Fin - sailor, male
  sarah: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, young female
  antoni: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, male
  thomas: "GBv7mTt0atIp3Br8iCZE", // Thomas - calm, male
  charlie: "IKne3meq5aSn9XLyUdCD", // Charlie - casual, male
  george: "JBFqnCBsd6RMkjVDRZzb", // George - warm, male
  emily: "LcfcDJNUP1GQjkzn1xUU", // Emily - calm, young female
  elli: "MF3mGyEYCl7XYWbV9V6O", // Elli - young, female
  callum: "N2lVS1w4EtoT3dr4eOWO", // Callum - hoarse, male
  patrick: "ODq5zmih8GrVes37Dizd", // Patrick - shouty, male
  harry: "SOYHLrjzK2X1ezoPC6cr", // Harry - anxious, male
  liam: "TX3LPaxmHKxFdv7VOQHJ", // Liam - articulate, male
  dorothy: "ThT5KcBeYPX3keUQqHPh", // Dorothy - pleasant, female
  josh: "TxGEqnHWrfWFTfGW9XjX", // Josh - deep, young male
  arnold: "VR6AewLTigWG4xSOukaG", // Arnold - crisp, male
  charlotte: "XB0fDUnXU5powFXDhCwa", // Charlotte - seductive, female
  alice: "Xb7hH8MSUJpSbSDYk0k2", // Alice - confident, middle-aged female
  matilda: "XrExE9yKIg1WjnnlVkGX", // Matilda - warm, young female
  james: "ZQe5CZNOzWyzPSCn5a3c", // James - calm, old male
  michael: "flq6f7yk4E4fJM5XTYuZ", // Michael - old, male
  ethan: "g5CIjZEefAph4nQFvHAz", // Ethan - young, male
  chris: "iP95p4xoKVk53GoZ742B", // Chris - casual, male
  gigi: "jBpfuIE2acCO8z3wKNLl", // Gigi - childish, female
  freya: "jsCqWAovK2LkecY7zXl4", // Freya - expressive, female
  brian: "nPczCjzI2devNBz1zQrb", // Brian - deep, middle-aged male
  grace: "oWAxZDx7w5VEj9dCyTzz", // Grace - southern accent, female
  daniel: "onwK4e9ZLuTAKqWW03F9", // Daniel - deep, authoritative male
  lily: "pFZP5JQG7iQjIQuC4Bku", // Lily - warm, middle-aged female
  serena: "pMsXgVXv3BLzUgSXRplE", // Serena - pleasant, middle-aged female
  adam: "pNInz6obpgDQGcFmaJgB", // Adam - deep, middle-aged male
  nicole: "piTKgcLEGmPE4e6mEKli", // Nicole - whisper, young female
  jessie: "t0jbNlBVZ17f02VDIeMI", // Jessie - raspy, older male
  ryan: "wViXBPUzp2ZZixB1xQuM", // Ryan - soldier, male
  sam: "yoZ06aMxZJJ28mfd3POQ", // Sam - raspy, young male
  glinda: "z9fAnlkpzviPz146aGWa", // Glinda - witch, female
  giovanni: "zcAOhNBS3c14rBihAFp1", // Giovanni - foreigner, male
  mimi: "zrHiDhphv9ZnVXBqCLjz", // Mimi - childish, female
} as const;

export type TTSVoice = keyof typeof TTS_VOICES;

interface SpeakRequest {
  text: string;
  voice?: TTSVoice;
}

export async function POST(request: Request) {
  try {
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
    const elevenlabs = getElevenLabs();
    const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
      text: truncatedText,
      modelId: "eleven_turbo_v2_5", // Fast, high-quality model
      outputFormat: "mp3_44100_128", // High quality MP3
    });

    // Collect stream chunks into a buffer
    const chunks: Uint8Array[] = [];
    const reader = audioStream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const audioBuffer = Buffer.concat(chunks);

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
