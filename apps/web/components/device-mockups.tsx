"use client";

import { cn } from "@/lib/design-system";

/**
 * MacBook Pro mockup with customizable screen content
 * Inspired by Stripe's device mockups
 */
export function MacBookMockup({
  className = "",
  children
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative", className)}>
      {/* Laptop body */}
      <div className="relative">
        {/* Screen bezel */}
        <div className="relative rounded-t-xl bg-[#1a1a1a] p-2 shadow-2xl">
          {/* Camera notch */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#0a0a0a] rounded-b-lg flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#2a2a2a]" />
          </div>

          {/* Screen */}
          <div className="relative bg-[#0a0a0a] rounded-lg overflow-hidden aspect-[16/10] mt-2">
            {children || <MacBookTerminalContent />}
          </div>
        </div>

        {/* Keyboard base */}
        <div className="relative h-3 bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a] rounded-b-lg">
          {/* Notch indent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#1a1a1a] rounded-b" />
        </div>

        {/* Bottom edge */}
        <div className="h-1 bg-[#1a1a1a] rounded-b-xl mx-4" />
      </div>
    </div>
  );
}

/**
 * Terminal content showing Claude Code in action
 */
function MacBookTerminalContent() {
  return (
    <div className="h-full bg-[#0a0a0a] p-3 font-mono text-[10px] sm:text-xs leading-relaxed">
      {/* Terminal header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27ca3f]" />
        </div>
        <span className="text-gray-500 text-[9px] ml-2">claude-insider — zsh</span>
      </div>

      {/* Terminal content */}
      <div className="space-y-1 text-gray-300">
        <div>
          <span className="text-cyan-400">~/projects/app</span>
          <span className="text-gray-500"> $</span>
          <span className="text-white ml-2">claude</span>
        </div>
        <div className="text-violet-400">
          ╭─ Claude Code v1.0.0
        </div>
        <div className="text-gray-400">
          │ Ready to help with your code
        </div>
        <div className="text-violet-400">
          ╰─
        </div>
        <div className="mt-2">
          <span className="text-amber-400">You:</span>
          <span className="text-gray-300 ml-2">Add authentication to my app</span>
        </div>
        <div className="mt-2">
          <span className="text-cyan-400">Claude:</span>
          <span className="text-gray-300 ml-2">I'll implement JWT auth with...</span>
        </div>
        <div className="text-green-400 mt-2">
          ✓ Created auth/middleware.ts
        </div>
        <div className="text-green-400">
          ✓ Updated app/api/login/route.ts
        </div>
        <div className="text-blue-400 animate-pulse mt-1">
          █ Writing tests...
        </div>
      </div>
    </div>
  );
}

/**
 * iPhone mockup with customizable screen content
 */
export function IPhoneMockup({
  className = "",
  children
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("relative", className)}>
      {/* Phone body */}
      <div className="relative bg-[#1a1a1a] rounded-[2.5rem] p-2 shadow-2xl">
        {/* Side buttons */}
        <div className="absolute -left-0.5 top-24 w-0.5 h-8 bg-[#3a3a3a] rounded-l" />
        <div className="absolute -left-0.5 top-36 w-0.5 h-12 bg-[#3a3a3a] rounded-l" />
        <div className="absolute -left-0.5 top-52 w-0.5 h-12 bg-[#3a3a3a] rounded-l" />
        <div className="absolute -right-0.5 top-32 w-0.5 h-16 bg-[#3a3a3a] rounded-r" />

        {/* Screen */}
        <div className="relative bg-[#0a0a0a] rounded-[2rem] overflow-hidden aspect-[9/19.5]">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />

          {/* Screen content */}
          <div className="h-full">
            {children || <IPhoneWebsiteContent />}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Website preview content for iPhone
 */
function IPhoneWebsiteContent() {
  return (
    <div className="h-full bg-[#0a0a0a] pt-10 overflow-hidden">
      {/* Safari-style URL bar */}
      <div className="mx-3 mb-2 bg-[#1a1a1a] rounded-lg px-3 py-1.5 flex items-center gap-2">
        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="text-[8px] text-gray-400 truncate">claudeinsider.com</span>
      </div>

      {/* Website preview */}
      <div className="px-3 space-y-2">
        {/* Mini header */}
        <div className="flex items-center justify-between py-2">
          <span className="text-[8px] font-bold text-white">Claude Insider</span>
          <div className="flex gap-1">
            <div className="w-4 h-2 bg-[#2a2a2a] rounded" />
            <div className="w-4 h-2 bg-[#2a2a2a] rounded" />
          </div>
        </div>

        {/* Mini hero */}
        <div className="bg-gradient-to-br from-violet-900/30 to-cyan-900/30 rounded-lg p-3">
          <div className="text-[7px] font-bold text-white leading-tight mb-1">
            Master Claude AI
          </div>
          <div className="text-[6px] text-gray-400">
            34 guides covering setup, API, integrations
          </div>
          <div className="mt-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded px-2 py-1 inline-block">
            <span className="text-[6px] text-white font-medium">Get Started</span>
          </div>
        </div>

        {/* Mini categories */}
        <div className="grid grid-cols-2 gap-1.5">
          {["Setup", "API", "Tips", "MCP"].map((cat) => (
            <div key={cat} className="bg-[#1a1a1a] rounded p-2">
              <span className="text-[6px] text-gray-300">{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Combined device showcase component
 */
export function DeviceShowcase({ className = "" }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      {/* MacBook - main device */}
      <MacBookMockup className="w-full max-w-lg transform hover:scale-[1.02] transition-transform duration-500" />

      {/* iPhone - positioned to overlap */}
      <div className="absolute -right-4 -bottom-4 sm:right-8 sm:bottom-0 transform rotate-6 hover:rotate-3 transition-transform duration-500">
        <IPhoneMockup className="w-20 sm:w-28" />
      </div>

      {/* Glow effect behind devices */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-30">
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-violet-500 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-1/3 h-1/3 bg-cyan-500 rounded-full" />
      </div>
    </div>
  );
}
