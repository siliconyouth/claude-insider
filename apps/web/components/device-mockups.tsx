"use client";

import { cn } from "@/lib/design-system";

/**
 * Photorealistic MacBook Pro mockup (M3 Pro style)
 * SVG-based for crisp rendering at any size
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
      {/* Realistic shadow */}
      <div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[85%] h-12 rounded-[50%]"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 50%, transparent 70%)',
          filter: 'blur(8px)'
        }}
      />

      {/* SVG MacBook Frame */}
      <svg viewBox="0 0 800 520" className="w-full h-auto" style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.3))' }}>
        <defs>
          {/* Aluminum gradient */}
          <linearGradient id="macbook-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3d3d3d"/>
            <stop offset="50%" stopColor="#2a2a2a"/>
            <stop offset="100%" stopColor="#1a1a1a"/>
          </linearGradient>
          {/* Screen bezel */}
          <linearGradient id="macbook-bezel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a1a1a"/>
            <stop offset="100%" stopColor="#0a0a0a"/>
          </linearGradient>
          {/* Hinge gradient */}
          <linearGradient id="macbook-hinge" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a4a4a"/>
            <stop offset="30%" stopColor="#3a3a3a"/>
            <stop offset="100%" stopColor="#2a2a2a"/>
          </linearGradient>
          {/* Edge highlight */}
          <linearGradient id="edge-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>
        </defs>

        {/* Main body/lid */}
        <rect x="20" y="10" width="760" height="460" rx="18" fill="url(#macbook-body)"/>

        {/* Top edge highlight */}
        <rect x="20" y="10" width="760" height="2" rx="1" fill="url(#edge-highlight)"/>

        {/* Screen bezel */}
        <rect x="32" y="22" width="736" height="436" rx="12" fill="url(#macbook-bezel)"/>

        {/* Notch/camera area */}
        <path d="M340 22 L340 42 Q340 52 350 52 L450 52 Q460 52 460 42 L460 22" fill="#0a0a0a"/>
        <circle cx="400" cy="36" r="4" fill="#1f1f1f"/>
        <circle cx="400" cy="36" r="2" fill="#0a0a2a"/>

        {/* Hinge */}
        <rect x="20" y="470" width="760" height="22" rx="4" fill="url(#macbook-hinge)"/>
        <rect x="20" y="470" width="760" height="1" fill="rgba(255,255,255,0.1)"/>

        {/* Trackpad notch */}
        <rect x="340" y="470" width="120" height="4" rx="2" fill="#1a1a1a"/>

        {/* Bottom deck */}
        <rect x="60" y="492" width="680" height="8" rx="4" fill="#1a1a1a"/>
      </svg>

      {/* Screen content overlay */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '4.6%',
          left: '4.3%',
          width: '91.4%',
          height: '82%',
          borderRadius: '8px'
        }}
      >
        {children || <MacBookTerminalContent />}
      </div>
    </div>
  );
}

/**
 * Pure SVG-based iPhone 17 Pro Max mockup with precise dimensions
 *
 * Design specifications (iPhone 17 Pro Max leaked specs):
 * - 6.9" display, 19.5:9 aspect ratio
 * - Narrower Dynamic Island (metalens camera tech)
 * - Natural Titanium finish
 * - Super Retina XDR display with ProMotion
 *
 * SVG dimensions chosen for crisp rendering:
 * - ViewBox: 236 x 480 (maintains ~19.5:9 inner ratio with bezels)
 * - Frame width: 6px on each side
 * - Screen area: x=6, y=6, width=224, height=468
 * - Screen corner radius: 32px (matches iOS display corners)
 * - Dynamic Island: centered, 60x18px pill shape
 */
export function IPhone17ProMax({
  className = "",
  children
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  // Precise SVG dimensions
  const width = 236;
  const height = 480;
  const frameWidth = 6;
  const screenX = frameWidth;
  const screenY = frameWidth;
  const screenW = width - frameWidth * 2; // 224
  const screenH = height - frameWidth * 2; // 468
  const outerRadius = 36;
  const screenRadius = 32;

  // Dynamic Island dimensions (narrower for iPhone 17)
  const diWidth = 60;
  const diHeight = 18;
  const diX = (width - diWidth) / 2;
  const diY = 14;
  const diRadius = diHeight / 2;

  return (
    <div className={cn("relative", className)}>
      {/* Ground shadow */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-8"
        style={{
          background: 'radial-gradient(ellipse 100% 100%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 50%, transparent 75%)',
          filter: 'blur(10px)',
          transform: 'translateX(-50%) scaleY(0.35)',
        }}
      />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
      >
        <defs>
          {/* Natural Titanium gradient - photorealistic */}
          <linearGradient id="iphone17-titanium" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a4a4a"/>
            <stop offset="15%" stopColor="#3d3d3d"/>
            <stop offset="30%" stopColor="#2f2f2f"/>
            <stop offset="50%" stopColor="#3a3a3a"/>
            <stop offset="70%" stopColor="#2d2d2d"/>
            <stop offset="85%" stopColor="#383838"/>
            <stop offset="100%" stopColor="#303030"/>
          </linearGradient>

          {/* Frame edge highlight */}
          <linearGradient id="iphone17-edge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)"/>
            <stop offset="50%" stopColor="rgba(255,255,255,0.04)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.1)"/>
          </linearGradient>

          {/* Side button gradients */}
          <linearGradient id="iphone17-button" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#505050"/>
            <stop offset="50%" stopColor="#3a3a3a"/>
            <stop offset="100%" stopColor="#454545"/>
          </linearGradient>

          {/* Screen bezel inner shadow */}
          <filter id="screen-inset" x="-2%" y="-2%" width="104%" height="104%">
            <feOffset dx="0" dy="1" in="SourceAlpha" result="shadowOffset"/>
            <feGaussianBlur in="shadowOffset" stdDeviation="1" result="shadowBlur"/>
            <feComposite in="shadowBlur" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"/>
            <feFlood floodColor="black" floodOpacity="0.3"/>
            <feComposite in2="shadowDiff" operator="in"/>
            <feComposite in2="SourceGraphic" operator="over"/>
          </filter>
        </defs>

        {/* Main titanium body */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx={outerRadius}
          fill="url(#iphone17-titanium)"
        />

        {/* Edge highlight (subtle) */}
        <rect
          x="0.5"
          y="0.5"
          width={width - 1}
          height={height - 1}
          rx={outerRadius - 0.5}
          fill="none"
          stroke="url(#iphone17-edge)"
          strokeWidth="1"
        />

        {/* Side buttons - Left: Action Button + Volume */}
        {/* Action Button */}
        <rect x="-1.5" y="85" width="2" height="22" rx="1" fill="url(#iphone17-button)"/>
        {/* Volume Up */}
        <rect x="-1.5" y="120" width="2" height="32" rx="1" fill="url(#iphone17-button)"/>
        {/* Volume Down */}
        <rect x="-1.5" y="160" width="2" height="32" rx="1" fill="url(#iphone17-button)"/>

        {/* Side button - Right: Power */}
        <rect x={width - 0.5} y="130" width="2" height="50" rx="1" fill="url(#iphone17-button)"/>

        {/* Screen area (black background) */}
        <rect
          x={screenX}
          y={screenY}
          width={screenW}
          height={screenH}
          rx={screenRadius}
          fill="#000000"
          filter="url(#screen-inset)"
        />

        {/* Dynamic Island - narrower for iPhone 17 (metalens tech) */}
        <rect
          x={diX}
          y={diY}
          width={diWidth}
          height={diHeight}
          rx={diRadius}
          fill="#0a0a0a"
        />
        {/* Camera lens inside Dynamic Island */}
        <circle cx={diX + diWidth - 14} cy={diY + diHeight / 2} r="4" fill="#1a1a1a"/>
        <circle cx={diX + diWidth - 14} cy={diY + diHeight / 2} r="2.5" fill="#0a0a2a"/>
        <circle cx={diX + diWidth - 14} cy={diY + diHeight / 2} r="1" fill="rgba(255,255,255,0.1)"/>

        {/* foreignObject for React content - precisely positioned */}
        <foreignObject
          x={screenX}
          y={screenY}
          width={screenW}
          height={screenH}
          style={{ borderRadius: `${screenRadius}px`, overflow: 'hidden' }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: `${screenRadius}px`,
              overflow: 'hidden',
              containerType: 'inline-size'
            }}
          >
            {children || <IPhoneScreenContent />}
          </div>
        </foreignObject>

        {/* Home indicator */}
        <rect
          x={(width - 70) / 2}
          y={height - 14}
          width="70"
          height="4"
          rx="2"
          fill="rgba(255,255,255,0.3)"
        />
      </svg>
    </div>
  );
}

/**
 * Realistic terminal content showing Claude Insider v1.10.6
 */
function MacBookTerminalContent() {
  return (
    <div className="h-full bg-[#0d1117] font-mono text-[8px] sm:text-[9px] lg:text-[10px] leading-[1.6] overflow-hidden">
      {/* Terminal window chrome */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex gap-[5px]">
          <div className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]" />
          <div className="w-[9px] h-[9px] rounded-full bg-[#febc2e]" />
          <div className="w-[9px] h-[9px] rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[#8b949e] text-[8px] ml-2 font-sans">Terminal — claude-insider — zsh</span>
      </div>

      {/* Terminal content */}
      <div className="p-3 space-y-[5px] text-[#c9d1d9]">
        <div>
          <span className="text-[#58a6ff]">~/claude-insider</span>
          <span className="text-[#8b949e]"> on </span>
          <span className="text-[#f78166]"> main</span>
          <span className="text-[#8b949e]"> $</span>
          <span className="text-[#c9d1d9] ml-1">pnpm dev</span>
        </div>

        <div className="mt-1">
          <span className="text-[#a371f7]">╭─</span>
          <span className="text-[#7ee787]"> Claude Insider</span>
          <span className="text-[#8b949e]"> v1.10.6</span>
        </div>
        <div>
          <span className="text-[#a371f7]">│</span>
          <span className="text-[#8b949e]"> Features: 49 • Resources: 1,950+</span>
        </div>
        <div>
          <span className="text-[#a371f7]">╰─</span>
          <span className="text-[#8b949e]"> localhost:3001</span>
        </div>

        <div className="mt-2 space-y-[3px]">
          <div className="text-[#7ee787]">✓ Dashboard Charts (Recharts)</div>
          <div className="text-[#7ee787]">✓ Prompt Library with Categories</div>
          <div className="text-[#7ee787]">✓ Doc Version Management</div>
          <div className="text-[#7ee787]">✓ Site-Wide Data Visualizations</div>
          <div className="text-[#7ee787]">✓ 126 Database Tables</div>
        </div>

        <div className="mt-2 flex items-center gap-1">
          <span className="text-[#58a6ff] animate-pulse">●</span>
          <span className="text-[#8b949e]">Ready on http://localhost:3001</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Realistic iOS Safari screen content for iPhone 17 Pro Max
 * Designed for SVG foreignObject with precise 224x468 viewBox dimensions
 * Uses container query units (cqw) for responsive scaling
 *
 * Note: Dynamic Island is rendered as part of the SVG frame, not screen content
 * The screen starts below the Dynamic Island area
 */
function IPhoneScreenContent() {
  return (
    <div className="h-full w-full bg-[#000000] flex flex-col overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Space for Dynamic Island (rendered in SVG, but we leave room) */}
      <div className="h-[6%]" />

      {/* iOS Status bar - positioned around Dynamic Island */}
      <div className="flex items-center justify-between px-[6%] text-white" style={{ marginTop: '-3%' }}>
        <span className="text-[3.5cqw] font-semibold tracking-tight">9:41</span>
        <div className="flex items-center gap-[3%]">
          {/* Cellular bars */}
          <div className="flex items-end gap-[2px] h-[3cqw]">
            <div className="w-[1.2cqw] h-[35%] bg-white/40 rounded-[1px]" />
            <div className="w-[1.2cqw] h-[50%] bg-white/50 rounded-[1px]" />
            <div className="w-[1.2cqw] h-[70%] bg-white/70 rounded-[1px]" />
            <div className="w-[1.2cqw] h-[100%] bg-white rounded-[1px]" />
          </div>
          {/* WiFi */}
          <svg className="w-[4.5cqw] h-[3.5cqw]" viewBox="0 0 16 12" fill="white">
            <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
            <path d="M4.5 7.5c2-2 5-2 7 0" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            <path d="M2 5c3.5-3 8.5-3 12 0" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
          {/* Battery */}
          <div className="flex items-center">
            <div className="w-[7cqw] h-[3.2cqw] rounded-[3px] border border-white/50 p-[1px]">
              <div className="w-[85%] h-full bg-white rounded-[2px]"/>
            </div>
            <div className="w-[1cqw] h-[1.5cqw] bg-white/50 rounded-r-[1px] ml-[1px]"/>
          </div>
        </div>
      </div>

      {/* Safari URL bar */}
      <div className="px-[4%] py-[2.5%]">
        <div className="bg-[#1c1c1e] rounded-[2.5cqw] px-[4%] py-[2.5%] flex items-center justify-center gap-[2%]">
          <svg className="w-[3.5cqw] h-[3.5cqw] text-[#8e8e93]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          <span className="text-[#8e8e93] text-[3cqw] font-medium">claudeinsider.com</span>
        </div>
      </div>

      {/* Website content */}
      <div className="flex-1 overflow-hidden bg-[#0a0a0a]">
        {/* Header */}
        <div className="flex items-center justify-between px-[5%] py-[3%] border-b border-[#222]">
          <div className="flex items-center gap-[3%]">
            <div className="w-[6cqw] h-[6cqw] rounded-[1.2cqw] bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-[3cqw] font-bold text-white">Ci</span>
            </div>
            <span className="text-[3.5cqw] font-bold text-white">Claude Insider</span>
          </div>
          <div className="flex flex-col gap-[3px]">
            <div className="w-[5cqw] h-[2px] bg-white rounded"/>
            <div className="w-[5cqw] h-[2px] bg-white rounded"/>
            <div className="w-[5cqw] h-[2px] bg-white rounded"/>
          </div>
        </div>

        {/* Hero section */}
        <div
          className="mx-[4%] my-[4%] rounded-[3.5cqw] p-[5%] relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.8) 0%, rgba(59,130,246,0.7) 50%, rgba(6,182,212,0.8) 100%)'
          }}
        >
          <div className="text-[4cqw] font-bold text-white leading-tight">
            Claude Insider v1.10.6
          </div>
          <div className="text-[3cqw] text-white/85 mt-[2%]">
            49 features • 1,950+ resources
          </div>
          <div className="text-[2.5cqw] text-white/70 mt-[1.5%]">
            Charts • Prompts • E2EE • Achievements
          </div>
          <div className="mt-[5%] bg-white rounded-[2.5cqw] px-[6%] py-[3%] inline-flex items-center">
            <span className="text-[3cqw] text-gray-900 font-semibold">Get Started</span>
            <svg className="w-[3cqw] h-[3cqw] ml-[2%] text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </div>

        {/* Categories grid */}
        <div className="px-[4%] grid grid-cols-2 gap-[3%]">
          {[
            { icon: "📊", name: "Dashboard", desc: "Rich charts" },
            { icon: "📝", name: "Prompts", desc: "Library & cats" },
            { icon: "🔐", name: "E2E Encryption", desc: "Matrix Olm" },
            { icon: "🏆", name: "Achievements", desc: "50+ badges" }
          ].map((cat) => (
            <div
              key={cat.name}
              className="bg-[#1c1c1e] rounded-[2.5cqw] p-[4%]"
            >
              <div className="flex items-center gap-[4%]">
                <span className="text-[4cqw]">{cat.icon}</span>
                <div>
                  <span className="text-[2.8cqw] text-white font-semibold block leading-tight">{cat.name}</span>
                  <span className="text-[2.2cqw] text-gray-500">{cat.desc}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safari bottom toolbar */}
      <div className="px-[6%] py-[3%] flex items-center justify-between bg-[#1c1c1e] border-t border-[#2c2c2e]">
        <svg className="w-[5.5cqw] h-[5.5cqw] text-[#0a84ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        <svg className="w-[5.5cqw] h-[5.5cqw] text-[#0a84ff]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
        </svg>
        <svg className="w-[5.5cqw] h-[5.5cqw] text-[#0a84ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
        </svg>
        <svg className="w-[5.5cqw] h-[5.5cqw] text-[#0a84ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
        </svg>
        <div className="w-[7cqw] h-[7cqw] rounded-[1.8cqw] bg-[#2c2c2e] border border-[#3c3c3e] flex items-center justify-center">
          <svg className="w-[4.5cqw] h-[4.5cqw] text-[#0a84ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </div>
      </div>

      {/* Home indicator is rendered in SVG, not here */}
    </div>
  );
}

/**
 * Backward-compatible alias for the PNG-based iPhone 17 Pro Max
 * @deprecated Use IPhone17ProMax directly
 */
export const IPhoneMockup = IPhone17ProMax;

/**
 * Combined device showcase - Stripe-style positioning
 * MacBook as primary device, iPhone overlapping on the right side
 * Uses photorealistic PNG mockup for iPhone 17 Pro Max
 */
export function DeviceShowcase({ className = "" }: { className?: string }) {
  return (
    <div className={cn("relative min-h-[520px] lg:min-h-[600px]", className)}>
      {/* Ambient glow effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[15%] right-[15%] w-[350px] h-[350px] bg-violet-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[25%] w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-[100px]" />
        <div className="absolute top-[35%] right-[5%] w-[250px] h-[250px] bg-blue-500/10 rounded-full blur-[80px]" />
      </div>

      {/* MacBook Pro - Primary device, positioned lower */}
      <div className="absolute top-[12%] -right-[10%] w-[100%] max-w-[600px] transform hover:scale-[1.01] transition-transform duration-700 ease-out">
        <MacBookMockup />
      </div>

      {/* iPhone 17 Pro Max - Further right, overlapping MacBook */}
      <div className="absolute right-[-15%] sm:right-[-12%] lg:right-[-10%] top-[5%] w-[160px] sm:w-[200px] lg:w-[240px] hover:scale-[1.02] transition-all duration-500 ease-out z-10">
        <IPhone17ProMax />
      </div>
    </div>
  );
}
