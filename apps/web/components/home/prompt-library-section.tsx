'use client';

/**
 * Homepage Prompt Library Section
 *
 * Showcases the Prompt Library and Interactive Prompt Builder with:
 * - Animated demonstration of the builder flow
 * - Key features and statistics
 * - CTA buttons to library and submit pages
 *
 * Animation stages (12s loop):
 * 1. Prompt card visible with {{variables}} highlighted
 * 2. "Use with AI" button pulses
 * 3. Mode selector slides up
 * 4. Quick Mode selected, variables being filled
 * 5. Success state with sparkles
 */

import Link from 'next/link';
import { cn } from '@/lib/design-system';

// ============================================================================
// Icons
// ============================================================================

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ZapIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const WandIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const MessageSquareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const LayoutGridIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
  </svg>
);

const BookOpenIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// ============================================================================
// Animated Prompt Builder Demo
// ============================================================================

function PromptBuilderDemo() {
  return (
    <div className={cn(
      'relative rounded-2xl overflow-hidden',
      'bg-white dark:bg-[#111111]',
      'border border-gray-200 dark:border-[#262626]',
      'shadow-2xl shadow-black/10 dark:shadow-black/30',
      'p-6'
    )}>
      {/* Animated Flow Container */}
      <div className="relative min-h-[380px]">

        {/* Stage 1: Prompt Card */}
        <div className={cn(
          'absolute inset-0',
          'animate-prompt-stage-1'
        )}>
          {/* Prompt Card Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                  Featured
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Coding
                </span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                Code Explainer
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Get detailed explanations of any code
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span className="text-amber-500">★</span> 4.9
            </div>
          </div>

          {/* Prompt Content with Variables */}
          <div className={cn(
            'p-4 rounded-xl mb-4',
            'bg-gray-50 dark:bg-[#0a0a0a]',
            'border border-gray-200 dark:border-[#262626]',
            'font-mono text-sm'
          )}>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Explain the following{' '}
              <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-600 dark:text-violet-400 font-semibold animate-pulse">
                {'{{language}}'}
              </span>
              {' '}code in detail:
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold animate-pulse">
                {'{{code}}'}
              </span>
            </p>
          </div>

          {/* Use with AI Button - Pulses */}
          <button className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl',
            'text-white font-semibold',
            'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
            'shadow-lg shadow-blue-500/25',
            'animate-button-pulse'
          )}>
            <SparklesIcon className="w-5 h-5" />
            Use with AI
          </button>

          {/* Click indicator */}
          <div className={cn(
            'absolute bottom-16 left-1/2 -translate-x-1/2',
            'flex flex-col items-center gap-1',
            'animate-click-indicator'
          )}>
            <div className="w-8 h-8 rounded-full bg-violet-500/20 border-2 border-violet-500 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
            </div>
            <span className="text-[10px] text-violet-500 font-medium">Click</span>
          </div>
        </div>

        {/* Stage 2: Mode Selector */}
        <div className={cn(
          'absolute inset-0',
          'animate-prompt-stage-2'
        )}>
          <div className={cn(
            'rounded-xl overflow-hidden',
            'bg-white dark:bg-[#111111]',
            'border border-gray-200 dark:border-[#262626]',
            'shadow-xl'
          )}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-[#262626]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-500/10">
                  <SparklesIcon className="w-4 h-4 text-violet-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Choose Your Mode</h4>
                  <p className="text-[10px] text-gray-500">2 variables to fill</p>
                </div>
              </div>
            </div>

            {/* Mode Options - 2x2 Grid */}
            <div className="p-3 grid grid-cols-2 gap-2">
              {/* Quick Mode - Highlighted */}
              <div className={cn(
                'p-3 rounded-lg text-left',
                'border-2 border-blue-500',
                'bg-blue-50/50 dark:bg-blue-500/10',
                'animate-mode-highlight'
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded bg-gradient-to-br from-violet-500 to-blue-500 text-white">
                    <ZapIcon className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Quick</span>
                  <span className="px-1 py-0.5 text-[8px] font-bold rounded bg-blue-500 text-white">REC</span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Fill variables fast</p>
              </div>

              {/* Guided Mode */}
              <div className="p-3 rounded-lg border border-gray-200 dark:border-[#333]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                    <WandIcon className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Guided</span>
                </div>
                <p className="text-[10px] text-gray-500">Step by step</p>
              </div>

              {/* Chat Mode */}
              <div className="p-3 rounded-lg border border-gray-200 dark:border-[#333]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                    <MessageSquareIcon className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Chat</span>
                </div>
                <p className="text-[10px] text-gray-500">AI helps you</p>
              </div>

              {/* Playground Mode */}
              <div className="p-3 rounded-lg border border-gray-200 dark:border-[#333]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                    <LayoutGridIcon className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Playground</span>
                </div>
                <p className="text-[10px] text-gray-500">Full editor</p>
              </div>
            </div>

            {/* Keyboard hint */}
            <div className="px-3 pb-3 flex justify-center">
              <span className="text-[10px] text-gray-400">
                Press <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono">1</kbd> for Quick Mode
              </span>
            </div>
          </div>
        </div>

        {/* Stage 3: Variable Filling */}
        <div className={cn(
          'absolute inset-0',
          'animate-prompt-stage-3'
        )}>
          <div className={cn(
            'rounded-xl overflow-hidden',
            'bg-white dark:bg-[#111111]',
            'border border-gray-200 dark:border-[#262626]'
          )}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-[#262626] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 text-white">
                  <ZapIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Quick Mode</h4>
                  <p className="text-[10px] text-gray-500">1/2 filled</p>
                </div>
              </div>
              <div className="h-1.5 w-20 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div className="h-full w-1/2 bg-gradient-to-r from-violet-500 to-blue-500 animate-progress-fill" />
              </div>
            </div>

            {/* Variable Inputs */}
            <div className="p-4 space-y-4">
              {/* Language Variable - Filled */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Language <span className="text-red-500">*</span>
                </label>
                <div className={cn(
                  'px-3 py-2 rounded-lg',
                  'bg-green-50 dark:bg-green-500/10',
                  'border border-green-500/50',
                  'flex items-center justify-between'
                )}>
                  <span className="text-sm text-gray-900 dark:text-white">Python</span>
                  <CheckIcon className="w-4 h-4 text-green-500" />
                </div>
              </div>

              {/* Code Variable - Being typed */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Code <span className="text-red-500">*</span>
                </label>
                <div className={cn(
                  'px-3 py-2 rounded-lg',
                  'bg-white dark:bg-[#0a0a0a]',
                  'border-2 border-blue-500',
                  'ring-4 ring-blue-500/20'
                )}>
                  <span className="text-sm font-mono text-gray-900 dark:text-white animate-typing">
                    def fibonacci(n):
                  </span>
                  <span className="animate-cursor">|</span>
                </div>
              </div>
            </div>

            {/* Live Preview Collapsed */}
            <div className="px-4 pb-4">
              <div className={cn(
                'p-3 rounded-lg',
                'bg-gray-50 dark:bg-[#0a0a0a]',
                'border border-gray-200 dark:border-[#262626]'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Live Preview</span>
                  <span className="text-[10px] text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Ready
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  Explain the following <span className="text-violet-500 font-medium">Python</span> code in detail: <span className="text-cyan-500 font-mono">def fibonacci(n):</span>...
                </p>
              </div>
            </div>

            {/* Use Button */}
            <div className="px-4 pb-4">
              <button className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
                'text-white font-semibold text-sm',
                'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                'shadow-lg shadow-blue-500/25'
              )}>
                <SparklesIcon className="w-4 h-4" />
                Use with AI
              </button>
            </div>
          </div>
        </div>

        {/* Stage 4: Success State */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center',
          'animate-prompt-stage-4'
        )}>
          <div className="text-center">
            {/* Success Icon */}
            <div className={cn(
              'w-20 h-20 mx-auto mb-4 rounded-2xl',
              'bg-gradient-to-br from-violet-500 to-blue-500',
              'flex items-center justify-center',
              'shadow-xl shadow-violet-500/30',
              'animate-success-bounce'
            )}>
              <CheckIcon className="w-10 h-10 text-white" />
            </div>

            {/* Success Text */}
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Prompt Ready!
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Opening AI Assistant...
            </p>

            {/* Sparkles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-violet-400 rounded-full animate-sparkle-1" />
              <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-sparkle-2" />
              <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-sparkle-3" />
              <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-violet-400 rounded-full animate-sparkle-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        <div className="w-6 h-1 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 animate-timeline-1" />
        <div className="w-6 h-1 rounded-full bg-gray-300 dark:bg-gray-700 animate-timeline-2" />
        <div className="w-6 h-1 rounded-full bg-gray-300 dark:bg-gray-700 animate-timeline-3" />
        <div className="w-6 h-1 rounded-full bg-gray-300 dark:bg-gray-700 animate-timeline-4" />
      </div>
    </div>
  );
}

// ============================================================================
// Feature Card
// ============================================================================

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-lg',
        'bg-gradient-to-br from-violet-500/10 to-cyan-500/10',
        'flex items-center justify-center',
        'text-violet-600 dark:text-violet-400'
      )}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
          {title}
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Section Component
// ============================================================================

export function PromptLibrarySection() {
  return (
    <section className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gradient-to-b from-gray-50 dark:from-[#111111]/50 to-white dark:to-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left side - Content */}
          <div className="animate-fade-in order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium mb-6">
              <BookOpenIcon className="w-4 h-4" />
              <span>Prompt Library</span>
              <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-[10px] font-bold">800+ Prompts</span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              <span className="gradient-text-stripe">Interactive Prompt Builder</span>
              <br />
              <span className="text-2xl sm:text-3xl text-gray-700 dark:text-gray-300">
                From template to AI in seconds
              </span>
            </h2>

            {/* Description */}
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
              Browse 800+ Claude-optimized prompts across 18 categories.
              Fill variables with our 4-mode builder and send directly to AI Assistant.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <FeatureItem
                icon={<ZapIcon className="w-4 h-4" />}
                title="4 Builder Modes"
                description="Quick fill, guided wizard, AI chat, or full playground - choose your style"
              />
              <FeatureItem
                icon={<SparklesIcon className="w-4 h-4" />}
                title="Claude Optimization Hints"
                description="Each prompt scored 0-100 with XML tags, thinking sections, chain-of-thought tips"
              />
              <FeatureItem
                icon={<MessageSquareIcon className="w-4 h-4" />}
                title="One-Click AI Integration"
                description="Fill variables and open directly in AI Assistant with context preserved"
              />
              <FeatureItem
                icon={<BookOpenIcon className="w-4 h-4" />}
                title="Community Contributions"
                description="Submit your prompts, fork others, track version history"
              />
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-8 p-4 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
              <div>
                <div className="text-2xl font-bold gradient-text-stripe">800+</div>
                <div className="text-xs text-gray-500">Prompts</div>
              </div>
              <div>
                <div className="text-2xl font-bold gradient-text-stripe">18</div>
                <div className="text-xs text-gray-500">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-bold gradient-text-stripe">4</div>
                <div className="text-xs text-gray-500">Builder Modes</div>
              </div>
              <div>
                <div className="text-2xl font-bold gradient-text-stripe">100%</div>
                <div className="text-xs text-gray-500">Free</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/prompts"
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
                  'text-white font-semibold',
                  'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600',
                  'shadow-lg shadow-blue-500/25',
                  'hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500',
                  'hover:shadow-xl hover:shadow-blue-500/30',
                  'hover:-translate-y-0.5',
                  'transition-all duration-200'
                )}
              >
                <BookOpenIcon className="w-5 h-5" />
                Browse Prompts
              </Link>
              <Link
                href="/prompts/submit"
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
                  'text-gray-700 dark:text-gray-300 font-semibold',
                  'bg-white dark:bg-[#111111]',
                  'border border-gray-200 dark:border-[#333]',
                  'hover:border-violet-500/50',
                  'hover:bg-violet-50 dark:hover:bg-violet-900/10',
                  'hover:-translate-y-0.5',
                  'transition-all duration-200'
                )}
              >
                <PlusIcon className="w-5 h-5" />
                Submit Prompt
              </Link>
            </div>
          </div>

          {/* Right side - Animated Demo */}
          <div className="relative animate-fade-in lg:animate-slide-in-right order-1 lg:order-2">
            <PromptBuilderDemo />

            {/* Decorative elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default PromptLibrarySection;
