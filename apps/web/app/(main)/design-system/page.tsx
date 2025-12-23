"use client";

/**
 * Design System Page
 *
 * A comprehensive brand book showcasing Claude Insider's visual identity,
 * inspired by Apple, Stripe, and Vercel design systems.
 *
 * Sections:
 * 1. Brand Identity - Logo, wordmark, tagline
 * 2. Colors - Primary gradient, semantic colors, surfaces
 * 3. Typography - Type scale, font stacks
 * 4. Spacing - Spacing scale, grid system
 * 5. Components - Buttons, cards, inputs, badges
 * 6. Animations - Entrance, hover, micro-interactions
 * 7. Icons & Patterns - Icon system, background patterns
 * 8. Accessibility - Contrast, focus states, touch targets
 */

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/design-system";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MonochromeLogo } from "@/components/monochrome-logo";

// ============================================================================
// Types
// ============================================================================

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface ColorSwatch {
  name: string;
  value: string;
  tailwind: string;
  textColor?: string;
}

// ============================================================================
// Constants
// ============================================================================

const SECTIONS: Section[] = [
  { id: "brand", label: "Brand", icon: <BrandIcon /> },
  { id: "colors", label: "Colors", icon: <ColorIcon /> },
  { id: "typography", label: "Typography", icon: <TypeIcon /> },
  { id: "spacing", label: "Spacing", icon: <SpacingIcon /> },
  { id: "components", label: "Components", icon: <ComponentIcon /> },
  { id: "animations", label: "Animations", icon: <AnimationIcon /> },
  { id: "icons", label: "Icons", icon: <IconsIcon /> },
  { id: "accessibility", label: "Accessibility", icon: <A11yIcon /> },
];

const PRIMARY_GRADIENT: ColorSwatch[] = [
  { name: "Violet", value: "#8B5CF6", tailwind: "violet-500" },
  { name: "Blue", value: "#3B82F6", tailwind: "blue-500" },
  { name: "Cyan", value: "#06B6D4", tailwind: "cyan-500" },
];

const SEMANTIC_COLORS: ColorSwatch[] = [
  { name: "Success", value: "#10B981", tailwind: "emerald-500" },
  { name: "Warning", value: "#F59E0B", tailwind: "amber-500" },
  { name: "Error", value: "#EF4444", tailwind: "red-500" },
  { name: "Info", value: "#3B82F6", tailwind: "blue-500" },
];

const DARK_SURFACES: ColorSwatch[] = [
  { name: "Background", value: "#0A0A0A", tailwind: "bg-[#0a0a0a]", textColor: "white" },
  { name: "Surface 1", value: "#111111", tailwind: "bg-[#111111]", textColor: "white" },
  { name: "Surface 2", value: "#1A1A1A", tailwind: "bg-[#1a1a1a]", textColor: "white" },
  { name: "Surface 3", value: "#262626", tailwind: "bg-[#262626]", textColor: "white" },
  { name: "Border", value: "#333333", tailwind: "border-[#333333]", textColor: "white" },
];

const LIGHT_SURFACES: ColorSwatch[] = [
  { name: "Background", value: "#FFFFFF", tailwind: "bg-white", textColor: "black" },
  { name: "Surface 1", value: "#F9FAFB", tailwind: "bg-gray-50", textColor: "black" },
  { name: "Surface 2", value: "#F3F4F6", tailwind: "bg-gray-100", textColor: "black" },
  { name: "Surface 3", value: "#E5E7EB", tailwind: "bg-gray-200", textColor: "black" },
  { name: "Border", value: "#D1D5DB", tailwind: "border-gray-300", textColor: "black" },
];

const TYPOGRAPHY_SCALE = [
  { name: "Display", size: "72px", weight: "Bold", lineHeight: "1.1", tailwind: "text-7xl font-bold", example: "Display" },
  { name: "H1", size: "48px", weight: "Bold", lineHeight: "1.2", tailwind: "text-5xl font-bold", example: "Heading 1" },
  { name: "H2", size: "36px", weight: "Semibold", lineHeight: "1.25", tailwind: "text-4xl font-semibold", example: "Heading 2" },
  { name: "H3", size: "24px", weight: "Semibold", lineHeight: "1.3", tailwind: "text-2xl font-semibold", example: "Heading 3" },
  { name: "H4", size: "20px", weight: "Medium", lineHeight: "1.4", tailwind: "text-xl font-medium", example: "Heading 4" },
  { name: "Body Large", size: "18px", weight: "Regular", lineHeight: "1.6", tailwind: "text-lg", example: "Body text large for lead paragraphs" },
  { name: "Body", size: "16px", weight: "Regular", lineHeight: "1.5", tailwind: "text-base", example: "Body text for main content" },
  { name: "Small", size: "14px", weight: "Regular", lineHeight: "1.5", tailwind: "text-sm", example: "Small text for captions" },
  { name: "Mono", size: "14px", weight: "Regular", lineHeight: "1.5", tailwind: "font-mono text-sm", example: "const code = 'example';" },
];

const SPACING_SCALE = [
  { name: "1", value: "4px", tailwind: "p-1 / gap-1" },
  { name: "2", value: "8px", tailwind: "p-2 / gap-2" },
  { name: "3", value: "12px", tailwind: "p-3 / gap-3" },
  { name: "4", value: "16px", tailwind: "p-4 / gap-4" },
  { name: "6", value: "24px", tailwind: "p-6 / gap-6" },
  { name: "8", value: "32px", tailwind: "p-8 / gap-8" },
  { name: "12", value: "48px", tailwind: "p-12 / gap-12" },
  { name: "16", value: "64px", tailwind: "p-16 / gap-16" },
  { name: "24", value: "96px", tailwind: "p-24 / gap-24" },
];

// ============================================================================
// Icons
// ============================================================================

function BrandIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

function ColorIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

function TypeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
  );
}

function SpacingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function ComponentIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function AnimationIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function A11yIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ============================================================================
// Utility Components
// ============================================================================

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
        "bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400",
        "hover:bg-gray-200 dark:hover:bg-[#333] transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      )}
      title={`Copy ${label || text}`}
    >
      {copied ? (
        <>
          <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <CopyIcon className="w-3.5 h-3.5" />
          <span>{label || text}</span>
        </>
      )}
    </button>
  );
}

function SectionCard({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 rounded-2xl p-6 sm:p-8",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]"
      )}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 text-violet-600 dark:text-violet-400">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 last:mb-0">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

function CodeBlock({ code, language = "tsx" }: { code: string; language?: string }) {
  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={code} label="code" />
      </div>
      <pre className="p-4 rounded-lg bg-gray-900 text-gray-100 text-sm font-mono overflow-x-auto">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium bg-gray-700 text-gray-300">
        {language}
      </div>
    </div>
  );
}

// ============================================================================
// Section Components
// ============================================================================

function BrandSection() {
  return (
    <SectionCard id="brand" title="Brand Identity" icon={<BrandIcon />}>
      <SubSection title="Logo">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gradient Logo */}
          <div className="p-8 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 shadow-lg shadow-blue-500/25">
              <span className="text-3xl font-bold text-white tracking-tight">Ci</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Primary Logo</span>
            <CopyButton text="from-violet-600 via-blue-600 to-cyan-600" label="gradient" />
          </div>

          {/* Monochrome Logo */}
          <div className="p-8 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
            <MonochromeLogo size={80} />
            <span className="text-sm text-gray-500 dark:text-gray-400">Monochrome Logo</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">Adapts to theme</span>
          </div>
        </div>
      </SubSection>

      <SubSection title="Wordmark">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 shadow-sm">
              <span className="text-sm font-bold text-white">Ci</span>
            </div>
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">Claude Insider</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Font: <span className="font-medium">Inter</span> or system font stack
          </p>
          <CopyButton text="font-semibold text-gray-900 dark:text-white" label="wordmark classes" />
        </div>
      </SubSection>

      <SubSection title="Tagline">
        <div className="p-6 rounded-xl bg-gradient-to-r from-violet-50 via-blue-50 to-cyan-50 dark:from-violet-900/10 dark:via-blue-900/10 dark:to-cyan-900/10">
          <p className="text-lg text-gray-700 dark:text-gray-300 italic">
            &ldquo;Your comprehensive guide to Claude AI&rdquo;
          </p>
        </div>
      </SubSection>

      <SubSection title="Clear Space">
        <div className="p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="relative inline-block p-8 border border-blue-300 dark:border-blue-700">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600">
                <span className="text-xl font-bold text-white">Ci</span>
              </div>
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#111] px-2 text-xs text-blue-500">
              1x
            </div>
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#111] px-2 text-xs text-blue-500">
              1x
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Minimum clear space = 1x logo width on all sides
          </p>
        </div>
      </SubSection>
    </SectionCard>
  );
}

function ColorsSection() {
  return (
    <SectionCard id="colors" title="Color Palette" icon={<ColorIcon />}>
      <SubSection title="Primary Gradient">
        <div className="mb-4">
          <div className="h-24 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 shadow-lg shadow-blue-500/25" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {PRIMARY_GRADIENT.map((color) => (
            <div key={color.name} className="text-center">
              <div
                className="h-16 rounded-lg mb-2 shadow-inner"
                style={{ backgroundColor: color.value }}
              />
              <p className="font-medium text-gray-900 dark:text-white">{color.name}</p>
              <p className="text-sm text-gray-500">{color.value}</p>
              <CopyButton text={color.tailwind} />
            </div>
          ))}
        </div>
        <CodeBlock
          code={`// Tailwind CSS
className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600"

// CSS
background: linear-gradient(to right, #8B5CF6, #3B82F6, #06B6D4);`}
          language="css"
        />
      </SubSection>

      <SubSection title="Semantic Colors">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {SEMANTIC_COLORS.map((color) => (
            <div key={color.name} className="text-center">
              <div
                className="h-16 rounded-lg mb-2 shadow-sm"
                style={{ backgroundColor: color.value }}
              />
              <p className="font-medium text-gray-900 dark:text-white">{color.name}</p>
              <p className="text-sm text-gray-500">{color.value}</p>
              <CopyButton text={color.tailwind} />
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="Surface Colors - Dark Mode">
        <div className="grid grid-cols-5 gap-2">
          {DARK_SURFACES.map((color) => (
            <div key={color.name} className="text-center">
              <div
                className="h-20 rounded-lg mb-2 border border-gray-700 flex items-end justify-center pb-2"
                style={{ backgroundColor: color.value }}
              >
                <span className="text-[10px] text-gray-400">{color.value}</span>
              </div>
              <p className="text-xs font-medium text-gray-900 dark:text-white">{color.name}</p>
              <CopyButton text={color.tailwind} />
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="Surface Colors - Light Mode">
        <div className="grid grid-cols-5 gap-2">
          {LIGHT_SURFACES.map((color) => (
            <div key={color.name} className="text-center">
              <div
                className="h-20 rounded-lg mb-2 border border-gray-200 flex items-end justify-center pb-2"
                style={{ backgroundColor: color.value }}
              >
                <span className="text-[10px] text-gray-500">{color.value}</span>
              </div>
              <p className="text-xs font-medium text-gray-900 dark:text-white">{color.name}</p>
              <CopyButton text={color.tailwind} />
            </div>
          ))}
        </div>
      </SubSection>
    </SectionCard>
  );
}

function TypographySection() {
  return (
    <SectionCard id="typography" title="Typography" icon={<TypeIcon />}>
      <SubSection title="Type Scale">
        <div className="space-y-6">
          {TYPOGRAPHY_SCALE.map((type) => (
            <div
              key={type.name}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-[#0a0a0a]"
            >
              <div className="sm:w-32 flex-shrink-0">
                <p className="font-medium text-gray-900 dark:text-white">{type.name}</p>
                <p className="text-xs text-gray-500">{type.size} / {type.weight}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(type.tailwind, "text-gray-900 dark:text-white truncate")}>
                  {type.example}
                </p>
              </div>
              <div className="flex-shrink-0">
                <CopyButton text={type.tailwind} />
              </div>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="Font Stack">
        <CodeBlock
          code={`// Primary Font (UI)
font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

// Monospace (Code)
font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;`}
          language="css"
        />
      </SubSection>
    </SectionCard>
  );
}

function SpacingSection() {
  return (
    <SectionCard id="spacing" title="Spacing & Layout" icon={<SpacingIcon />}>
      <SubSection title="Spacing Scale">
        <div className="flex flex-wrap gap-4 items-end">
          {SPACING_SCALE.map((space) => (
            <div key={space.name} className="text-center">
              <div
                className="bg-gradient-to-br from-violet-500 to-blue-500 rounded mb-2"
                style={{ width: space.value, height: space.value }}
              />
              <p className="text-xs font-medium text-gray-900 dark:text-white">{space.value}</p>
              <p className="text-[10px] text-gray-500">{space.tailwind}</p>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="Container Widths">
        <div className="space-y-3">
          {[
            { name: "sm", value: "640px" },
            { name: "md", value: "768px" },
            { name: "lg", value: "1024px" },
            { name: "xl", value: "1280px" },
            { name: "2xl", value: "1536px" },
            { name: "7xl", value: "1280px (max-w-7xl)" },
          ].map((bp) => (
            <div key={bp.name} className="flex items-center gap-4">
              <span className="w-12 text-sm font-mono text-gray-500">{bp.name}</span>
              <div
                className="h-6 rounded bg-gradient-to-r from-violet-200 to-blue-200 dark:from-violet-900/30 dark:to-blue-900/30"
                style={{ width: `min(100%, ${bp.value})` }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{bp.value}</span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="Page Padding">
        <CodeBlock
          code={`// Standard page padding
className="px-4 sm:px-6 lg:px-8"

// Section vertical spacing
className="py-12 sm:py-16 lg:py-24"

// Container with max-width
className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"`}
          language="tsx"
        />
      </SubSection>
    </SectionCard>
  );
}

function ComponentsSection() {
  const [activeButton, setActiveButton] = useState<string | null>(null);

  return (
    <SectionCard id="components" title="Components" icon={<ComponentIcon />}>
      <SubSection title="Buttons">
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Primary */}
          <button
            onClick={() => setActiveButton("primary")}
            className={cn(
              "px-6 py-3 rounded-lg text-sm font-semibold text-white",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "shadow-lg shadow-blue-500/25",
              "hover:shadow-xl hover:-translate-y-0.5",
              "active:translate-y-0 active:shadow-md",
              "transition-all duration-200"
            )}
          >
            Primary Button
          </button>

          {/* Secondary */}
          <button
            onClick={() => setActiveButton("secondary")}
            className={cn(
              "px-6 py-3 rounded-lg text-sm font-semibold",
              "bg-white dark:bg-[#1a1a1a]",
              "border border-gray-300 dark:border-[#333]",
              "text-gray-900 dark:text-white",
              "hover:border-gray-400 dark:hover:border-gray-600",
              "hover:-translate-y-0.5",
              "transition-all duration-200"
            )}
          >
            Secondary Button
          </button>

          {/* Ghost */}
          <button
            onClick={() => setActiveButton("ghost")}
            className={cn(
              "px-6 py-3 rounded-lg text-sm font-semibold",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "transition-colors duration-200"
            )}
          >
            Ghost Button
          </button>

          {/* Danger */}
          <button
            onClick={() => setActiveButton("danger")}
            className={cn(
              "px-6 py-3 rounded-lg text-sm font-semibold text-white",
              "bg-gradient-to-r from-red-600 to-rose-600",
              "shadow-lg shadow-red-500/25",
              "hover:shadow-xl hover:-translate-y-0.5",
              "transition-all duration-200"
            )}
          >
            Danger Button
          </button>
        </div>

        {activeButton && (
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] text-sm">
            <p className="text-gray-500 mb-2">Clicked: {activeButton}</p>
          </div>
        )}

        <CodeBlock
          code={`// Primary Button
className={cn(
  "px-6 py-3 rounded-lg text-sm font-semibold text-white",
  "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
  "shadow-lg shadow-blue-500/25",
  "hover:shadow-xl hover:-translate-y-0.5",
  "transition-all duration-200"
)}`}
          language="tsx"
        />
      </SubSection>

      <SubSection title="Cards">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Default Card */}
          <div className={cn(
            "p-6 rounded-xl",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Default Card</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Basic card with border</p>
          </div>

          {/* Elevated Card */}
          <div className={cn(
            "p-6 rounded-xl",
            "bg-white dark:bg-[#111111]",
            "shadow-lg"
          )}>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Elevated Card</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Card with shadow elevation</p>
          </div>

          {/* Interactive Card */}
          <div className={cn(
            "p-6 rounded-xl cursor-pointer",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-1",
            "transition-all duration-300"
          )}>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Interactive Card</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Hover me for effect</p>
          </div>

          {/* Glass Card */}
          <div className={cn(
            "p-6 rounded-xl",
            "bg-white/50 dark:bg-white/5",
            "backdrop-blur-lg",
            "border border-gray-200/50 dark:border-white/10"
          )}>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Glass Card</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Glass morphism effect</p>
          </div>
        </div>
      </SubSection>

      <SubSection title="Inputs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text Input
            </label>
            <input
              type="text"
              placeholder="Enter text..."
              className={cn(
                "w-full px-4 py-2.5 rounded-lg",
                "bg-white dark:bg-[#0a0a0a]",
                "border border-gray-300 dark:border-[#333]",
                "text-gray-900 dark:text-white",
                "placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              )}
            />
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Input
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search..."
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 rounded-lg",
                  "bg-white dark:bg-[#0a0a0a]",
                  "border border-gray-300 dark:border-[#333]",
                  "text-gray-900 dark:text-white",
                  "placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                )}
              />
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="Badges">
        <div className="flex flex-wrap gap-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300">
            Default
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
            Success
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            Warning
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            Error
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            Info
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-violet-500 to-blue-500 text-white">
            New
          </span>
        </div>
      </SubSection>
    </SectionCard>
  );
}

function AnimationsSection() {
  const [showDemo, setShowDemo] = useState(false);
  const [hoverDemo, setHoverDemo] = useState<number | null>(null);

  return (
    <SectionCard id="animations" title="Animations & Effects" icon={<AnimationIcon />}>
      <SubSection title="Entrance Animations">
        <button
          onClick={() => {
            setShowDemo(false);
            setTimeout(() => setShowDemo(true), 100);
          }}
          className={cn(
            "mb-4 px-4 py-2 rounded-lg text-sm font-medium",
            "bg-gray-100 dark:bg-[#262626] text-gray-700 dark:text-gray-300",
            "hover:bg-gray-200 dark:hover:bg-[#333]",
            "transition-colors"
          )}
        >
          Replay Animations
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {showDemo && (
            <>
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-center animate-in fade-in duration-500">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Fade In</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Slide Up</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-center animate-in fade-in zoom-in-95 duration-500">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Zoom In</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-center animate-in fade-in slide-in-from-left-4 duration-500">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Slide Right</p>
              </div>
            </>
          )}
        </div>
      </SubSection>

      <SubSection title="Hover Effects">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onMouseEnter={() => setHoverDemo(0)}
            onMouseLeave={() => setHoverDemo(null)}
            className={cn(
              "p-4 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-center cursor-pointer",
              "transition-transform duration-200",
              hoverDemo === 0 && "-translate-y-1"
            )}
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">Lift</p>
            <p className="text-xs text-gray-500">-translate-y-1</p>
          </div>

          <div
            onMouseEnter={() => setHoverDemo(1)}
            onMouseLeave={() => setHoverDemo(null)}
            className={cn(
              "p-4 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-center cursor-pointer",
              "transition-transform duration-200",
              hoverDemo === 1 && "scale-105"
            )}
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">Scale</p>
            <p className="text-xs text-gray-500">scale-105</p>
          </div>

          <div
            onMouseEnter={() => setHoverDemo(2)}
            onMouseLeave={() => setHoverDemo(null)}
            className={cn(
              "p-4 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-center cursor-pointer",
              "transition-shadow duration-200",
              hoverDemo === 2 && "shadow-lg shadow-blue-500/25"
            )}
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">Glow</p>
            <p className="text-xs text-gray-500">shadow-blue-500/25</p>
          </div>

          <div
            onMouseEnter={() => setHoverDemo(3)}
            onMouseLeave={() => setHoverDemo(null)}
            className={cn(
              "p-4 rounded-lg text-center cursor-pointer",
              "transition-all duration-200",
              hoverDemo === 3
                ? "bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30"
                : "bg-gray-100 dark:bg-[#1a1a1a]"
            )}
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white">Color</p>
            <p className="text-xs text-gray-500">gradient fill</p>
          </div>
        </div>
      </SubSection>

      <SubSection title="Special Effects">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Glass Morphism */}
          <div className="relative h-32 rounded-xl bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 p-4 overflow-hidden">
            <div className="absolute inset-4 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
              <span className="text-white font-medium">Glass Morphism</span>
            </div>
          </div>

          {/* Gradient Animation */}
          <div className="h-32 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-[length:200%_100%] animate-gradient-x flex items-center justify-center">
            <span className="text-white font-medium">Animated Gradient</span>
          </div>
        </div>
      </SubSection>

      <CodeBlock
        code={`// Entrance Animation
className="animate-in fade-in slide-in-from-bottom-4 duration-500"

// Hover Effect
className="hover:-translate-y-1 hover:shadow-lg transition-all duration-200"

// Glass Morphism
className="bg-white/20 backdrop-blur-md border border-white/30"`}
        language="tsx"
      />
    </SectionCard>
  );
}

function IconsSection() {
  const icons = [
    { name: "Home", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { name: "Search", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
    { name: "User", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { name: "Settings", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { name: "Heart", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
    { name: "Star", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> },
    { name: "Bell", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
    { name: "Check", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> },
  ];

  return (
    <SectionCard id="icons" title="Icons & Patterns" icon={<IconsIcon />}>
      <SubSection title="Icon System">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Using Heroicons (outline style) for consistency. 24x24px default size.
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
          {icons.map((item) => (
            <div
              key={item.name}
              className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
            >
              <span className="text-gray-700 dark:text-gray-300">{item.icon}</span>
              <span className="text-[10px] text-gray-500">{item.name}</span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection title="Background Patterns">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Dot Grid */}
          <div className="h-32 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden relative">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(#d1d5db 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
            <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white dark:bg-[#111] px-2 py-1 rounded">
              Dot Grid
            </div>
          </div>

          {/* Large Dots */}
          <div className="h-32 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden relative">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "radial-gradient(#d1d5db 1.5px, transparent 1.5px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white dark:bg-[#111] px-2 py-1 rounded">
              Large Dots
            </div>
          </div>

          {/* Grid Lines */}
          <div className="h-32 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden relative">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white dark:bg-[#111] px-2 py-1 rounded">
              Grid
            </div>
          </div>

          {/* Gradient Orbs */}
          <div className="h-32 rounded-lg bg-gray-900 overflow-hidden relative">
            <div className="absolute w-32 h-32 -top-8 -left-8 rounded-full bg-violet-500/30 blur-2xl" />
            <div className="absolute w-24 h-24 -bottom-6 -right-6 rounded-full bg-cyan-500/30 blur-2xl" />
            <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
              Gradient Orbs
            </div>
          </div>
        </div>
      </SubSection>
    </SectionCard>
  );
}

function AccessibilitySection() {
  return (
    <SectionCard id="accessibility" title="Accessibility" icon={<A11yIcon />}>
      <SubSection title="Color Contrast">
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-[#0a0a0a]">
            <div className="w-12 h-12 rounded bg-gray-900 dark:bg-white" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Text on Background</p>
              <p className="text-sm text-gray-500">Contrast ratio: 21:1 (AAA)</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-[#0a0a0a]">
            <div className="w-12 h-12 rounded bg-blue-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Primary Blue on White</p>
              <p className="text-sm text-gray-500">Contrast ratio: 4.5:1 (AA)</p>
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="Focus States">
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-[#262626] text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0a0a]">
            Focus Me (Tab)
          </button>
          <input
            type="text"
            placeholder="Focus this input"
            className="px-4 py-2 rounded-lg bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-[#333] text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
        <CodeBlock
          code={`// Focus ring pattern
className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"

// Dark mode offset
className="dark:focus-visible:ring-offset-[#0a0a0a]"`}
          language="tsx"
        />
      </SubSection>

      <SubSection title="Touch Targets">
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#0a0a0a]">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs">
              44px
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Minimum Touch Target</p>
              <p className="text-sm text-gray-500">44x44px minimum for WCAG 2.1 compliance</p>
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection title="Reduced Motion">
        <CodeBlock
          code={`// Respect user preferences
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}`}
          language="css"
        />
      </SubSection>
    </SectionCard>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function DesignSystemPage() {
  const [activeSection, setActiveSection] = useState("brand");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scroll spy for section navigation
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observerRef.current?.observe(element);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0a0a]">
      <Header />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#262626]">
        {/* Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 -top-48 -left-48 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute w-96 h-96 -top-48 -right-48 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 text-violet-700 dark:text-violet-300 mb-6">
              <span className="w-2 h-2 rounded-full bg-violet-500" />
              Version 1.0
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Design System
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A comprehensive guide to Claude Insider&apos;s visual language, components, and patterns.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeSection === section.id
                      ? "bg-gradient-to-r from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 text-violet-700 dark:text-violet-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                  )}
                >
                  <span className={activeSection === section.id ? "text-violet-500" : "text-gray-400"}>
                    {section.icon}
                  </span>
                  {section.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content Sections */}
          <div className="flex-1 min-w-0 space-y-8">
            <BrandSection />
            <ColorsSection />
            <TypographySection />
            <SpacingSection />
            <ComponentsSection />
            <AnimationsSection />
            <IconsSection />
            <AccessibilitySection />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
