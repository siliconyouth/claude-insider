/**
 * ElevenLabs TTS Voice Configuration
 *
 * Available pre-made voices from ElevenLabs.
 * Voice IDs are stable and can be used directly with the API.
 */

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

/**
 * Get voice ID by voice name
 */
export function getVoiceId(voice: TTSVoice): string {
  return TTS_VOICES[voice];
}

/**
 * Get all available voice names
 */
export function getAvailableVoices(): TTSVoice[] {
  return Object.keys(TTS_VOICES) as TTSVoice[];
}
