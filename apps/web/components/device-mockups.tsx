"use client";

import { cn } from "@/lib/design-system";

/**
 * Realistic MacBook Pro mockup (M3 Pro style)
 * More detailed with proper proportions and shadows
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
      {/* Shadow underneath */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/20 blur-xl rounded-full" />

      {/* Laptop body */}
      <div className="relative">
        {/* Screen housing - Space Black aluminum */}
        <div
          className="relative rounded-t-[12px] p-[6px] shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 25px 50px -12px rgba(0,0,0,0.5)'
          }}
        >
          {/* Camera/sensor area - notch style */}
          <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-[80px] h-[20px] bg-[#0a0a0a] rounded-b-[8px] flex items-center justify-center z-10">
            <div className="w-[6px] h-[6px] rounded-full bg-[#1a1a1a] border border-[#333]" />
          </div>

          {/* Screen bezel */}
          <div className="bg-[#0a0a0a] rounded-[8px] p-[2px]">
            {/* Actual screen */}
            <div className="relative bg-[#0d1117] rounded-[6px] overflow-hidden aspect-[16/10]">
              {children || <MacBookTerminalContent />}
            </div>
          </div>
        </div>

        {/* Hinge/bottom bezel */}
        <div
          className="relative h-[14px] rounded-b-[4px]"
          style={{
            background: 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 50%, #1f1f1f 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Trackpad indent indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[3px] bg-[#1a1a1a] rounded-b-[2px]" />
        </div>

        {/* Keyboard deck (bottom part visible) */}
        <div
          className="relative h-[6px] mx-[8%] rounded-b-[8px]"
          style={{
            background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Realistic terminal content showing Claude Code v2.0.62
 */
function MacBookTerminalContent() {
  return (
    <div className="h-full bg-[#0d1117] font-mono text-[9px] sm:text-[10px] lg:text-[11px] leading-[1.5]">
      {/* Terminal window chrome */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex gap-[6px]">
          <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57] shadow-inner" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e] shadow-inner" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28c840] shadow-inner" />
        </div>
        <span className="text-[#8b949e] text-[9px] ml-2 font-sans">claude-insider — zsh — 80×24</span>
      </div>

      {/* Terminal content */}
      <div className="p-3 space-y-[6px] text-[#c9d1d9]">
        <div>
          <span className="text-[#58a6ff]">~/projects/app</span>
          <span className="text-[#8b949e]"> on </span>
          <span className="text-[#f78166]">main</span>
          <span className="text-[#8b949e]"> $</span>
          <span className="text-[#c9d1d9] ml-2">claude</span>
        </div>

        <div className="mt-2">
          <span className="text-[#a371f7]">╭─</span>
          <span className="text-[#7ee787]"> Claude Code</span>
          <span className="text-[#8b949e]"> v2.0.62</span>
        </div>
        <div>
          <span className="text-[#a371f7]">│</span>
          <span className="text-[#8b949e]"> Model: claude-sonnet-4-20250514</span>
        </div>
        <div>
          <span className="text-[#a371f7]">╰─</span>
          <span className="text-[#8b949e]"> Ready</span>
        </div>

        <div className="mt-3">
          <span className="text-[#ffa657]">You</span>
          <span className="text-[#8b949e]">:</span>
          <span className="text-[#c9d1d9] ml-2">Add authentication to my Next.js app</span>
        </div>

        <div className="mt-2">
          <span className="text-[#58a6ff]">Claude</span>
          <span className="text-[#8b949e]">:</span>
          <span className="text-[#c9d1d9] ml-2">I&apos;ll implement NextAuth.js with JWT...</span>
        </div>

        <div className="mt-2 space-y-1">
          <div className="text-[#7ee787]">✓ Created lib/auth.ts</div>
          <div className="text-[#7ee787]">✓ Created app/api/auth/[...nextauth]/route.ts</div>
          <div className="text-[#7ee787]">✓ Updated middleware.ts</div>
          <div className="flex items-center gap-1">
            <span className="text-[#58a6ff]">⠋</span>
            <span className="text-[#8b949e]">Writing tests...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Realistic iPhone 16 Pro Max mockup
 * Proper titanium frame, Dynamic Island, and proportions
 * Based on actual iPhone 16 Pro Max dimensions (77.6 x 163.0 mm)
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
      {/* Shadow */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[85%] h-6 bg-black/30 blur-lg rounded-full" />

      {/* Phone frame - Titanium finish */}
      <div
        className="relative rounded-[44px] p-[10px]"
        style={{
          background: 'linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 50%, #2a2a2a 100%)',
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.3),
            0 25px 50px -12px rgba(0,0,0,0.5),
            0 0 0 1px rgba(255,255,255,0.05)
          `
        }}
      >
        {/* Side buttons - Left */}
        <div
          className="absolute -left-[2px] top-[80px] w-[3px] h-[24px] rounded-l-[2px]"
          style={{ background: 'linear-gradient(90deg, #2a2a2a, #3a3a3a)' }}
        />
        <div
          className="absolute -left-[2px] top-[115px] w-[3px] h-[44px] rounded-l-[2px]"
          style={{ background: 'linear-gradient(90deg, #2a2a2a, #3a3a3a)' }}
        />
        <div
          className="absolute -left-[2px] top-[170px] w-[3px] h-[44px] rounded-l-[2px]"
          style={{ background: 'linear-gradient(90deg, #2a2a2a, #3a3a3a)' }}
        />

        {/* Side button - Right (power + action button) */}
        <div
          className="absolute -right-[2px] top-[80px] w-[3px] h-[24px] rounded-r-[2px]"
          style={{ background: 'linear-gradient(270deg, #2a2a2a, #3a3a3a)' }}
        />
        <div
          className="absolute -right-[2px] top-[130px] w-[3px] h-[56px] rounded-r-[2px]"
          style={{ background: 'linear-gradient(270deg, #2a2a2a, #3a3a3a)' }}
        />

        {/* Screen bezel - Black */}
        <div className="bg-black rounded-[34px] p-[2px] overflow-hidden">
          {/* Screen */}
          <div
            className="relative bg-black rounded-[32px] overflow-hidden"
            style={{ aspectRatio: '9/19.5' }}
          >
            {/* Dynamic Island */}
            <div
              className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[100px] h-[32px] bg-black rounded-full z-20 flex items-center justify-center gap-[40px]"
              style={{
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)'
              }}
            >
              {/* Front camera */}
              <div className="w-[10px] h-[10px] rounded-full bg-[#1a1a1a] border border-[#333] relative">
                <div className="absolute inset-[2px] rounded-full bg-[#0a0a2a]" />
              </div>
            </div>

            {/* Screen content */}
            <div className="h-full bg-black">
              {children || <IPhoneWebsiteContent />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Website preview content for iPhone - Safari browser
 */
function IPhoneWebsiteContent() {
  return (
    <div className="h-full bg-[#0a0a0a] flex flex-col text-[8px]">
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 pt-[42px] pb-1 text-white">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-3" viewBox="0 0 17 12" fill="white">
            <path d="M1.5 5.5h1v3h-1zM4 4h1v4.5H4zM6.5 2.5h1v6h-1zM9 1h1v7.5H9z" opacity="0.4"/>
            <path d="M11.5 5.5h1v3h-1z"/>
          </svg>
          <svg className="w-4 h-3" viewBox="0 0 16 12" fill="white">
            <path d="M8 2.4A6.6 6.6 0 0114.4 9h1.1A7.7 7.7 0 008 1.3 7.7 7.7 0 00.5 9h1.1A6.6 6.6 0 018 2.4z"/>
            <path d="M8 5.3a3.7 3.7 0 013.7 3.7h1.1A4.8 4.8 0 008 4.2 4.8 4.8 0 003.2 9h1.1A3.7 3.7 0 018 5.3z"/>
            <circle cx="8" cy="9" r="1.5"/>
          </svg>
          <div className="flex items-center">
            <div className="w-6 h-3 rounded-sm border border-white/30 p-[1px]">
              <div className="w-[70%] h-full bg-white rounded-[1px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Safari URL bar */}
      <div className="mx-3 mt-1 mb-2">
        <div className="bg-[#1c1c1e] rounded-lg px-3 py-2 flex items-center gap-2">
          <svg className="w-3 h-3 text-[#8e8e93]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="text-[#8e8e93] text-[9px] flex-1 text-center">claudeinsider.com</span>
        </div>
      </div>

      {/* Website content */}
      <div className="flex-1 overflow-hidden px-3">
        {/* Mini header */}
        <div className="flex items-center justify-between py-2 border-b border-[#2a2a2a]">
          <span className="text-[9px] font-bold text-white">Claude Insider</span>
          <div className="w-5 h-4 flex flex-col justify-center gap-[2px]">
            <div className="w-full h-[1.5px] bg-white rounded" />
            <div className="w-full h-[1.5px] bg-white rounded" />
          </div>
        </div>

        {/* Mini hero */}
        <div
          className="mt-2 rounded-lg p-3 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.2) 50%, rgba(6,182,212,0.3) 100%)'
          }}
        >
          <div className="relative z-10">
            <div className="text-[8px] font-bold text-white leading-tight">
              Master Claude AI
            </div>
            <div className="text-[6px] text-gray-400 mt-1">
              34 guides • API • MCP
            </div>
            <div className="mt-2 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-md px-2 py-1 inline-block">
              <span className="text-[6px] text-white font-semibold">Get Started →</span>
            </div>
          </div>
        </div>

        {/* Mini categories grid */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { icon: "⚡", name: "Setup" },
            { icon: "🔌", name: "API" },
            { icon: "💡", name: "Tips" },
            { icon: "🔧", name: "MCP" }
          ].map((cat) => (
            <div
              key={cat.name}
              className="bg-[#1c1c1e] rounded-lg p-2 flex items-center gap-2"
            >
              <span className="text-[10px]">{cat.icon}</span>
              <span className="text-[7px] text-gray-300">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safari bottom bar */}
      <div className="px-6 py-3 flex items-center justify-between border-t border-[#2a2a2a] bg-[#1c1c1e]/80 backdrop-blur">
        <svg className="w-5 h-5 text-[#0a84ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        <svg className="w-5 h-5 text-[#0a84ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
        <svg className="w-5 h-5 text-[#0a84ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <svg className="w-5 h-5 text-[#0a84ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <div className="w-6 h-6 rounded bg-[#2c2c2e] flex items-center justify-center">
          <span className="text-[8px] text-white font-medium">2</span>
        </div>
      </div>

      {/* Home indicator */}
      <div className="flex justify-center pb-2 pt-1">
        <div className="w-[100px] h-[4px] bg-white/80 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Combined device showcase - positioned like Stripe
 * Devices are larger and positioned more to the right
 */
export function DeviceShowcase({ className = "" }: { className?: string }) {
  return (
    <div className={cn("relative min-h-[500px]", className)}>
      {/* Glow effects behind devices */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-violet-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[30%] w-[250px] h-[250px] bg-cyan-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[10%] w-[200px] h-[200px] bg-blue-500/20 rounded-full blur-[80px]" />
      </div>

      {/* MacBook - main device, positioned to the right */}
      <div className="absolute top-0 right-0 w-[95%] max-w-[580px] transform hover:scale-[1.01] transition-transform duration-700 ease-out">
        <MacBookMockup />
      </div>

      {/* iPhone - overlapping on the right side */}
      <div className="absolute right-[-20px] bottom-[-40px] w-[140px] sm:w-[160px] transform rotate-[8deg] hover:rotate-[5deg] hover:scale-105 transition-all duration-500 ease-out z-10">
        <IPhoneMockup />
      </div>
    </div>
  );
}
