"use client";

import { useEffect, useState } from "react";

const DEMO_CONVERSATIONS = [
  // First exchange
  { role: "user", content: "What is Claude Code?" },
  { role: "assistant", content: "Claude Code is Anthropic's official CLI tool that brings AI-powered coding assistance directly to your terminal. It can help with code reviews, refactoring, debugging, and writing new features." },
  // Second exchange
  { role: "user", content: "How do I install it?" },
  { role: "assistant", content: "You can install Claude Code globally using npm: npm install -g @anthropic-ai/claude-code. After installation, run 'claude' in your terminal to start. You'll need an Anthropic API key to use it." },
];

export function VoiceAssistantDemo() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Timeline (all times in ms):
    // 0ms: Start - welcome screen visible
    // 2000ms: First user message appears
    // 3500ms: Typing indicator starts
    // 6000ms: First assistant response appears, audio plays
    // 12000ms: Audio ends
    // 14000ms: Second user message appears
    // 15500ms: Typing indicator starts
    // 18500ms: Second assistant response appears, audio plays
    // 25000ms: Audio ends, voice pulse starts
    // 28000ms: Voice pulse ends
    // 32000ms: Reset animation

    // First user message
    timers.push(setTimeout(() => {
      setVisibleMessages(1);
    }, 2000));

    // First typing indicator
    timers.push(setTimeout(() => {
      setIsTyping(true);
    }, 3500));

    // First assistant response
    timers.push(setTimeout(() => {
      setIsTyping(false);
      setVisibleMessages(2);
      setIsPlayingAudio(true);
    }, 6000));

    // First audio ends
    timers.push(setTimeout(() => {
      setIsPlayingAudio(false);
    }, 12000));

    // Second user message
    timers.push(setTimeout(() => {
      setVisibleMessages(3);
    }, 14000));

    // Second typing indicator
    timers.push(setTimeout(() => {
      setIsTyping(true);
    }, 15500));

    // Second assistant response
    timers.push(setTimeout(() => {
      setIsTyping(false);
      setVisibleMessages(4);
      setIsPlayingAudio(true);
    }, 18500));

    // Second audio ends, show voice pulse
    timers.push(setTimeout(() => {
      setIsPlayingAudio(false);
      setShowPulse(true);
    }, 25000));

    // Voice pulse ends
    timers.push(setTimeout(() => {
      setShowPulse(false);
    }, 28000));

    // Reset animation
    timers.push(setTimeout(() => {
      setVisibleMessages(0);
      setIsTyping(false);
      setShowPulse(false);
      setIsPlayingAudio(false);
    }, 32000));

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [visibleMessages]);

  return (
    <div className="relative">
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl blur-2xl opacity-50" />

      {/* Window frame */}
      <div className="relative rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-gray-400">Claude Insider Assistant</span>
          </div>
          <div className="w-12" />
        </div>

        {/* Chat area */}
        <div className="p-4 min-h-[380px] max-h-[380px] overflow-hidden">
          {/* Welcome message - only show when no messages */}
          {visibleMessages === 0 && (
            <div className="text-center mb-6 animate-fadeIn">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10 mb-3">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">Ask me anything about Claude AI</p>
              <p className="text-xs text-gray-500 mt-2">Voice & text input supported</p>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-3">
            {/* First user message */}
            {visibleMessages >= 1 && (
              <div className="flex justify-end animate-fadeIn">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-orange-500/20 text-gray-200 text-sm">
                  {DEMO_CONVERSATIONS[0]?.content}
                </div>
              </div>
            )}

            {/* First assistant response */}
            {visibleMessages >= 2 && (
              <div className="flex justify-start animate-fadeIn">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-gray-800 text-gray-200 text-sm leading-relaxed">
                  {DEMO_CONVERSATIONS[1]?.content}
                  {isPlayingAudio && visibleMessages === 2 && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-700">
                      <div className="flex items-center gap-0.5">
                        <span className="w-1 h-3 bg-orange-400 rounded-full animate-audioWave1" />
                        <span className="w-1 h-4 bg-orange-400 rounded-full animate-audioWave2" />
                        <span className="w-1 h-2 bg-orange-400 rounded-full animate-audioWave3" />
                        <span className="w-1 h-5 bg-orange-400 rounded-full animate-audioWave1" />
                        <span className="w-1 h-3 bg-orange-400 rounded-full animate-audioWave2" />
                      </div>
                      <span className="text-xs text-orange-400">Speaking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Second user message */}
            {visibleMessages >= 3 && (
              <div className="flex justify-end animate-fadeIn">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-orange-500/20 text-gray-200 text-sm">
                  {DEMO_CONVERSATIONS[2]?.content}
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-800 text-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Second assistant response */}
            {visibleMessages >= 4 && (
              <div className="flex justify-start animate-fadeIn">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-gray-800 text-gray-200 text-sm leading-relaxed">
                  {DEMO_CONVERSATIONS[3]?.content}
                  {isPlayingAudio && visibleMessages === 4 && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-700">
                      <div className="flex items-center gap-0.5">
                        <span className="w-1 h-3 bg-orange-400 rounded-full animate-audioWave1" />
                        <span className="w-1 h-4 bg-orange-400 rounded-full animate-audioWave2" />
                        <span className="w-1 h-2 bg-orange-400 rounded-full animate-audioWave3" />
                        <span className="w-1 h-5 bg-orange-400 rounded-full animate-audioWave1" />
                        <span className="w-1 h-3 bg-orange-400 rounded-full animate-audioWave2" />
                      </div>
                      <span className="text-xs text-orange-400">Speaking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-gray-700 p-3 bg-gray-800/50">
          <div className="flex items-center gap-2">
            {/* Voice button */}
            <button
              className={`relative p-2.5 rounded-full transition-all ${
                showPulse
                  ? "bg-orange-500 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              {showPulse && (
                <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-75" />
              )}
              <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* Input field */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Type your message..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                readOnly
              />
            </div>

            {/* Send button */}
            <button className="p-2.5 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Voice selector */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
              </svg>
              <span className="text-xs text-gray-500">Voice: Rachel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Powered by</span>
              <span className="text-xs text-orange-400">ElevenLabs</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes audioWave1 {
          0%, 100% { height: 12px; }
          50% { height: 20px; }
        }
        @keyframes audioWave2 {
          0%, 100% { height: 16px; }
          50% { height: 8px; }
        }
        @keyframes audioWave3 {
          0%, 100% { height: 8px; }
          50% { height: 16px; }
        }
        .animate-audioWave1 {
          animation: audioWave1 0.5s ease-in-out infinite;
        }
        .animate-audioWave2 {
          animation: audioWave2 0.5s ease-in-out infinite;
          animation-delay: 0.1s;
        }
        .animate-audioWave3 {
          animation: audioWave3 0.5s ease-in-out infinite;
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
