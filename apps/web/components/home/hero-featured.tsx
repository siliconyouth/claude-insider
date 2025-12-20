'use client';

/**
 * Hero Featured Resources
 *
 * Displays two large featured resource cards at the top of the resources section.
 * Shows "Editor's Pick" and "Trending Now" with rich information.
 */

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { cn } from '@/lib/design-system';
import { getFeaturedResources, getTopByStars } from '@/data/resources';
import type { ResourceEntry } from '@/data/resources/schema';

// Format numbers like 85000 -> "85k"
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

interface HeroCardProps {
  resource: ResourceEntry;
  label: string;
  labelColor: 'violet' | 'cyan';
  animationDelay?: string;
}

function HeroCard({ resource, label, labelColor, animationDelay = '0ms' }: HeroCardProps) {
  const colorClasses = {
    violet: {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
      text: 'text-violet-600 dark:text-violet-400',
      glow: 'group-hover:shadow-violet-500/20',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      text: 'text-cyan-600 dark:text-cyan-400',
      glow: 'group-hover:shadow-cyan-500/20',
    },
  };

  const colors = colorClasses[labelColor];

  return (
    <Link
      href={`/resources/${resource.id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl',
        'bg-white dark:bg-[#111111]',
        'border border-gray-200 dark:border-[#262626]',
        'transition-all duration-300',
        'hover:border-blue-500/50',
        'hover:shadow-2xl',
        colors.glow,
        'hover:-translate-y-1',
        'animate-fade-in-up'
      )}
      style={{ animationDelay }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        {resource.screenshotUrl ? (
          <Image
            src={resource.screenshotUrl}
            alt={resource.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-30">
              {resource.category === 'tools' ? '🛠️' :
               resource.category === 'mcp-servers' ? '🔌' :
               resource.category === 'sdks' ? '📦' :
               resource.category === 'agents' ? '🤖' :
               '📚'}
            </span>
          </div>
        )}

        {/* Label Badge */}
        <div className="absolute top-4 left-4">
          <div className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
            colors.bg,
            'border',
            colors.border,
            colors.text,
            'backdrop-blur-sm'
          )}>
            <span className="relative flex h-2 w-2">
              <span className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                labelColor === 'violet' ? 'bg-violet-400' : 'bg-cyan-400'
              )}></span>
              <span className={cn(
                'relative inline-flex rounded-full h-2 w-2',
                labelColor === 'violet' ? 'bg-violet-500' : 'bg-cyan-500'
              )}></span>
            </span>
            {label}
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute top-4 right-4">
          <div className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium capitalize">
            {resource.category.replace('-', ' ')}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
          {resource.title}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
          {resource.description}
        </p>

        {/* Footer with stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#1a1a1a]">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {resource.github && (
              <>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {formatNumber(resource.github.stars)}
                </span>
                {resource.github.language && (
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
                    {resource.github.language}
                  </span>
                )}
              </>
            )}
          </div>

          <span className="text-blue-600 dark:text-cyan-400 text-sm font-medium group-hover:underline">
            Learn more →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function HeroFeatured() {
  // Get editor's pick (first featured resource)
  const editorsPick = useMemo(() => {
    const featured = getFeaturedResources(1);
    return featured[0];
  }, []);

  // Get trending (most starred that isn't the editor's pick)
  const trending = useMemo(() => {
    const topStars = getTopByStars(5);
    return topStars.find(r => r.id !== editorsPick?.id) || topStars[1];
  }, [editorsPick]);

  if (!editorsPick || !trending) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      <HeroCard
        resource={editorsPick}
        label="Editor's Pick"
        labelColor="violet"
        animationDelay="0ms"
      />
      <HeroCard
        resource={trending}
        label="Trending Now"
        labelColor="cyan"
        animationDelay="100ms"
      />
    </div>
  );
}

export default HeroFeatured;
