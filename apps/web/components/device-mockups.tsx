"use client";

import Image from "next/image";
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
 * Realistic terminal content showing Claude Insider v1.11.0
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
          <span className="text-[#8b949e]"> v1.13.0</span>
        </div>
        <div>
          <span className="text-[#a371f7]">│</span>
          <span className="text-[#8b949e]"> Features: 53 • Resources: 1,952+</span>
        </div>
        <div>
          <span className="text-[#a371f7]">╰─</span>
          <span className="text-[#8b949e]"> localhost:3001</span>
        </div>

        <div className="mt-2 space-y-[3px]">
          <div className="text-[#7ee787]">✓ ElevenLabs Turbo v2.5 TTS</div>
          <div className="text-[#7ee787]">✓ Immediate Text Streaming</div>
          <div className="text-[#7ee787]">✓ Code Block TTS Support</div>
          <div className="text-[#7ee787]">✓ 42 Premium AI Voices</div>
          <div className="text-[#7ee787]">✓ RAG v7.0 (6,953 chunks)</div>
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
 * Real screenshot of Claude Insider mobile homepage
 * Shows the actual mobile header and bottom navigation bar
 * Updated for v1.13.0 with proper aspect ratio handling and LCP optimization
 *
 * MANDATORY MOCKUP RULES:
 * 1. Screenshot MUST be taken at 446×932 viewport (matches mockup 224:468 aspect ratio)
 * 2. ALWAYS use object-cover to fill the screen naturally
 * 3. Header with logo/icons MUST be visible below Dynamic Island
 * 4. Bottom mobile navigation MUST be fully visible
 * 5. Screenshot should capture the hero section with both device mockups
 *
 * LCP OPTIMIZATION:
 * - Uses Next.js Image with priority={true} for above-fold preloading
 * - Image is preloaded in HTML head before JavaScript executes
 * - Improves Largest Contentful Paint by 100-300ms
 *
 * Aspect Ratio Math:
 * - Mockup screen area: 224×468 (ratio 0.4786)
 * - Screenshot viewport: 446×932 (ratio 0.4785) - matches exactly!
 * - With matching aspect ratios, object-cover fits perfectly without cropping
 */
function IPhoneScreenContent() {
  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-hidden relative">
      <Image
        src="/images/mobile-screenshot.png"
        alt="Claude Insider mobile homepage"
        fill
        priority
        sizes="240px"
        className="object-cover"
      />
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
