import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { VoiceAssistantFull } from "@/components/voice-assistant-full";

export const metadata: Metadata = {
  title: "AI Assistant - Claude Insider",
  description: "Ask questions about Claude AI using voice or text. Get instant answers powered by Claude with premium text-to-speech responses from ElevenLabs.",
};

export default function AssistantPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 flex flex-col">
        <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Claude Insider{" "}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                AI Assistant
              </span>
            </h1>
            <p className="text-gray-400">
              Ask questions about Claude AI, Claude Code, APIs, and more
            </p>
          </div>

          <VoiceAssistantFull />
        </div>
      </main>

      <Footer />
    </div>
  );
}
