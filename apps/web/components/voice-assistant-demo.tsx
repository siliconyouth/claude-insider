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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    // Total cycle duration: 46 seconds
    const CYCLE_DURATION = 46000;

    const runAnimation = () => {
      const timers: NodeJS.Timeout[] = [];

      // Reset state at start of each cycle
      setVisibleMessages(0);
      setIsTyping(false);
      setShowPulse(false);
      setIsPlayingAudio(false);

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

      // First audio ends - reading time begins
      timers.push(setTimeout(() => {
        setIsPlayingAudio(false);
      }, 12000));

      // Second user message (after reading time)
      timers.push(setTimeout(() => {
        setVisibleMessages(3);
      }, 20000));

      // Second typing indicator
      timers.push(setTimeout(() => {
        setIsTyping(true);
      }, 21500));

      // Second assistant response
      timers.push(setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages(4);
        setIsPlayingAudio(true);
      }, 24500));

      // Second audio ends - extended reading time
      timers.push(setTimeout(() => {
        setIsPlayingAudio(false);
      }, 31000));

      // Voice pulse starts
      timers.push(setTimeout(() => {
        setShowPulse(true);
      }, 34000));

      // Voice pulse ends
      timers.push(setTimeout(() => {
        setShowPulse(false);
      }, 37000));

      return timers;
    };

    // Run initial animation
    let timers = runAnimation();

    // Set up interval to loop the animation
    const interval = setInterval(() => {
      // Clear previous timers
      timers.forEach(timer => clearTimeout(timer));
      // Run animation again
      timers = runAnimation();
    }, CYCLE_DURATION);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative">
      {/* Animated glow effect - Stripe gradient */}
      <div className="absolute -inset-4 rounded-2xl blur-2xl opacity-60 animate-glowPulse">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/30 via-blue-500/30 to-cyan-500/30 rounded-2xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-cyan-600/20 rounded-2xl animate-glowShift" />
      </div>

      {/* Window frame */}
      <div className="relative rounded-xl border border-gray-700 bg-gray-900 shadow-2xl overflow-hidden">
        {/* Title bar with gradient accent */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-800 via-gray-800 to-gray-800 border-b border-gray-700 relative overflow-hidden">
          {/* Subtle gradient line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 opacity-60" />
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
        <div className="p-4 min-h-[380px] max-h-[380px] overflow-hidden relative">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-violet-900/5 pointer-events-none" />

          {/* Welcome message - only show when no messages */}
          {visibleMessages === 0 && (
            <div className="text-center mb-6 animate-fadeIn relative z-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-violet-500/20 via-blue-500/20 to-cyan-500/20 mb-3 relative">
                {/* Animated ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 opacity-30 animate-spin-slow" style={{ padding: '2px' }}>
                  <div className="w-full h-full rounded-full bg-gray-900" />
                </div>
                <svg className="w-7 h-7 text-cyan-400 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">Ask me anything about Claude AI</p>
              <p className="text-xs text-gray-500 mt-2">Voice & text input supported</p>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-3 relative z-10">
            {/* First user message */}
            {visibleMessages >= 1 && (
              <div className="flex justify-end animate-fadeIn">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gradient-to-r from-violet-600/30 via-blue-600/30 to-cyan-600/30 border border-blue-500/20 text-gray-200 text-sm">
                  {DEMO_CONVERSATIONS[0]?.content}
                </div>
              </div>
            )}

            {/* First assistant response */}
            {visibleMessages >= 2 && (
              <div className="flex justify-start animate-fadeIn">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-gray-800/80 border border-gray-700 text-gray-200 text-sm leading-relaxed">
                  {DEMO_CONVERSATIONS[1]?.content}
                  {isPlayingAudio && visibleMessages === 2 && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-700">
                      <div className="flex items-center gap-0.5">
                        <span className="w-1 h-3 bg-gradient-to-t from-violet-400 to-cyan-400 rounded-full animate-audioWave1" />
                        <span className="w-1 h-4 bg-gradient-to-t from-blue-400 to-cyan-400 rounded-full animate-audioWave2" />
                        <span className="w-1 h-2 bg-gradient-to-t from-violet-400 to-blue-400 rounded-full animate-audioWave3" />
                        <span className="w-1 h-5 bg-gradient-to-t from-cyan-400 to-violet-400 rounded-full animate-audioWave1" />
                        <span className="w-1 h-3 bg-gradient-to-t from-blue-400 to-violet-400 rounded-full animate-audioWave2" />
                        <span className="w-1 h-4 bg-gradient-to-t from-violet-400 to-cyan-400 rounded-full animate-audioWave3" />
                        <span className="w-1 h-2 bg-gradient-to-t from-cyan-400 to-blue-400 rounded-full animate-audioWave1" />
                      </div>
                      <span className="text-xs bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent font-medium">Speaking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Second user message */}
            {visibleMessages >= 3 && (
              <div className="flex justify-end animate-fadeIn">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gradient-to-r from-violet-600/30 via-blue-600/30 to-cyan-600/30 border border-blue-500/20 text-gray-200 text-sm">
                  {DEMO_CONVERSATIONS[2]?.content}
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-800/80 border border-gray-700 text-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Second assistant response */}
            {visibleMessages >= 4 && (
              <div className="flex justify-start animate-fadeIn">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-gray-800/80 border border-gray-700 text-gray-200 text-sm leading-relaxed">
                  {DEMO_CONVERSATIONS[3]?.content}
                  {isPlayingAudio && visibleMessages === 4 && (
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-700">
                      <div className="flex items-center gap-0.5">
                        <span className="w-1 h-3 bg-gradient-to-t from-violet-400 to-cyan-400 rounded-full animate-audioWave1" />
                        <span className="w-1 h-4 bg-gradient-to-t from-blue-400 to-cyan-400 rounded-full animate-audioWave2" />
                        <span className="w-1 h-2 bg-gradient-to-t from-violet-400 to-blue-400 rounded-full animate-audioWave3" />
                        <span className="w-1 h-5 bg-gradient-to-t from-cyan-400 to-violet-400 rounded-full animate-audioWave1" />
                        <span className="w-1 h-3 bg-gradient-to-t from-blue-400 to-violet-400 rounded-full animate-audioWave2" />
                        <span className="w-1 h-4 bg-gradient-to-t from-violet-400 to-cyan-400 rounded-full animate-audioWave3" />
                        <span className="w-1 h-2 bg-gradient-to-t from-cyan-400 to-blue-400 rounded-full animate-audioWave1" />
                      </div>
                      <span className="text-xs bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent font-medium">Speaking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-gray-700 p-3 bg-gray-800/50 relative">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-900/5 via-transparent to-cyan-900/5 pointer-events-none" />

          <div className="flex items-center gap-2 relative z-10">
            {/* Voice button */}
            <button
              className={`relative p-2.5 rounded-full transition-all ${
                showPulse
                  ? "bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              {showPulse && (
                <>
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 animate-ping opacity-50" />
                  <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-500/30 via-blue-500/30 to-cyan-500/30 blur-md animate-pulse" />
                </>
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
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                readOnly
              />
            </div>

            {/* Send button */}
            <button className="p-2.5 rounded-full bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Voice selector */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700 relative z-10">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 012.828-2.828" />
              </svg>
              <span className="text-xs text-gray-500">Voice: Rachel</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Powered by</span>
              <span className="text-xs bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent font-medium">ElevenLabs</span>
            </div>
          </div>
        </div>
      </div>

      {/* eslint-disable-next-line react/no-unknown-property */}
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
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        .animate-glowPulse {
          animation: glowPulse 4s ease-in-out infinite;
        }
        @keyframes glowShift {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(10px) translateY(-5px); }
          50% { transform: translateX(0) translateY(5px); }
          75% { transform: translateX(-10px) translateY(0); }
        }
        .animate-glowShift {
          animation: glowShift 8s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
