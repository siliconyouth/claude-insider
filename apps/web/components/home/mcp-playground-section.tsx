'use client';

/**
 * Homepage MCP Playground Section
 *
 * Showcases the MCP Playground feature with:
 * - Interactive preview/mockup
 * - Key features list
 * - CTA buttons to playground and gallery
 */

import Link from 'next/link';
import { cn } from '@/lib/design-system';

// Icons
const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const ServerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

const CodeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

/**
 * Monaco Editor Preview - Visual mockup of the playground
 */
function EditorPreview() {
  return (
    <div className={cn(
      'relative rounded-2xl overflow-hidden',
      'bg-[#1e1e1e]',
      'border border-[#333]',
      'shadow-2xl shadow-black/30'
    )}>
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#333]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-xs text-gray-400 ml-2">mcp-config.json</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ✓ Valid
          </span>
        </div>
      </div>

      {/* Code Content */}
      <div className="p-4 font-mono text-sm overflow-hidden" style={{ minHeight: '280px' }}>
        <div className="text-gray-400">
          <span className="text-gray-500">1</span>
          <span className="ml-4 text-[#d4d4d4]">{'{'}</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">2</span>
          <span className="ml-4">  </span>
          <span className="text-[#9cdcfe]">&quot;mcpServers&quot;</span>
          <span className="text-[#d4d4d4]">: {'{'}</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">3</span>
          <span className="ml-4">    </span>
          <span className="text-[#9cdcfe]">&quot;filesystem&quot;</span>
          <span className="text-[#d4d4d4]">: {'{'}</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">4</span>
          <span className="ml-4">      </span>
          <span className="text-[#9cdcfe]">&quot;command&quot;</span>
          <span className="text-[#d4d4d4]">: </span>
          <span className="text-[#ce9178]">&quot;npx&quot;</span>
          <span className="text-[#d4d4d4]">,</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">5</span>
          <span className="ml-4">      </span>
          <span className="text-[#9cdcfe]">&quot;args&quot;</span>
          <span className="text-[#d4d4d4]">: [</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">6</span>
          <span className="ml-4">        </span>
          <span className="text-[#ce9178]">&quot;-y&quot;</span>
          <span className="text-[#d4d4d4]">,</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">7</span>
          <span className="ml-4">        </span>
          <span className="text-[#ce9178]">&quot;@anthropic-ai/mcp-server-filesystem&quot;</span>
          <span className="text-[#d4d4d4]">,</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">8</span>
          <span className="ml-4">        </span>
          <span className="text-[#ce9178]">&quot;/path/to/allowed/dir&quot;</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">9</span>
          <span className="ml-4">      </span>
          <span className="text-[#d4d4d4]">]</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">10</span>
          <span className="ml-3">    </span>
          <span className="text-[#d4d4d4]">{'}'}</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">11</span>
          <span className="ml-3">  </span>
          <span className="text-[#d4d4d4]">{'}'}</span>
        </div>
        <div className="text-gray-400">
          <span className="text-gray-500">12</span>
          <span className="ml-3 text-[#d4d4d4]">{'}'}</span>
        </div>
      </div>

      {/* Floating Template Selector */}
      <div className={cn(
        'absolute bottom-4 right-4',
        'px-3 py-2 rounded-lg',
        'bg-gradient-to-r from-violet-600/90 to-blue-600/90',
        'text-white text-xs font-medium',
        'flex items-center gap-2',
        'shadow-lg shadow-violet-500/25',
        'animate-pulse'
      )}>
        <ServerIcon className="w-4 h-4" />
        2,136+ Templates
      </div>
    </div>
  );
}

/**
 * Feature Card Component
 */
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className={cn(
      'flex items-start gap-4 p-4 rounded-xl',
      'bg-white dark:bg-[#111111]',
      'border border-gray-200 dark:border-[#262626]',
      'transition-all duration-200',
      'hover:border-violet-500/30',
      'hover:shadow-lg hover:shadow-violet-500/5',
      'hover:-translate-y-0.5'
    )}>
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-lg',
        'bg-gradient-to-br from-violet-500/10 to-cyan-500/10',
        'flex items-center justify-center',
        'text-violet-600 dark:text-violet-400'
      )}>
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
          {title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/**
 * Main MCP Playground Section Component
 */
export function MCPPlaygroundSection() {
  const features = [
    {
      icon: <CodeIcon className="w-5 h-5" />,
      title: 'Monaco Editor',
      description: 'Full-featured JSON editor with syntax highlighting and IntelliSense'
    },
    {
      icon: <CheckIcon className="w-5 h-5" />,
      title: 'Live Validation',
      description: 'Real-time schema validation with helpful error messages'
    },
    {
      icon: <ServerIcon className="w-5 h-5" />,
      title: '2,136+ Templates',
      description: 'Browse and use pre-built MCP server configurations'
    },
    {
      icon: <ShareIcon className="w-5 h-5" />,
      title: 'Share Configs',
      description: 'Share via URL or publish to the community gallery'
    },
    {
      icon: <StarIcon className="w-5 h-5" />,
      title: 'Save & Star',
      description: 'Save drafts and star your favorite configurations'
    },
    {
      icon: <PlayIcon className="w-5 h-5" />,
      title: 'Fork & Remix',
      description: 'Fork any config and customize it for your needs'
    }
  ];

  return (
    <section className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gradient-to-b from-white dark:from-[#0a0a0a] to-gray-50 dark:to-[#111111]/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium mb-6">
              <PlayIcon className="w-4 h-4" />
              <span>New Feature</span>
              <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-[10px] font-bold">v1.16.0</span>
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              <span className="gradient-text-stripe">MCP Playground</span>
              <br />
              <span className="text-2xl sm:text-3xl text-gray-700 dark:text-gray-300">
                Build configs interactively
              </span>
            </h2>

            {/* Description */}
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
              Create, validate, and share Model Context Protocol server configurations
              with our interactive playground. Start from 2,136+ templates or build from scratch.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/mcp-playground"
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
                <PlayIcon className="w-5 h-5" />
                Open Playground
              </Link>
              <Link
                href="/mcp-playground/gallery"
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
                Browse Gallery
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right side - Editor Preview */}
          <div className="relative animate-fade-in lg:animate-slide-in-right">
            <EditorPreview />

            {/* Decorative elements */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default MCPPlaygroundSection;
