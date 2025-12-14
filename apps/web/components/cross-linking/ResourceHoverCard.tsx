'use client';

/**
 * ResourceHoverCard Component
 *
 * Shows a hover tooltip with resource preview when hovering over links.
 * Used for inline resource references in documentation.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/design-system';
import { ResourceCard } from '@/components/resources/resource-card';
import type { ResourceEntry } from '@/data/resources/schema';

interface ResourceHoverCardProps {
  /** The resource to display in the hover card */
  resource: ResourceEntry;
  /** Content that triggers the hover */
  children: React.ReactNode;
  /** Delay before showing the card (ms) */
  delayMs?: number;
  /** Preferred position of the card */
  side?: 'top' | 'bottom';
  /** Additional classes for the trigger element */
  className?: string;
  /** Disable the hover functionality */
  disabled?: boolean;
}

interface Position {
  top: number;
  left: number;
  side: 'top' | 'bottom';
}

export function ResourceHoverCard({
  resource,
  children,
  delayMs = 200,
  side = 'top',
  className,
  disabled = false,
}: ResourceHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  // Client-side only for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return null;

    const rect = triggerRef.current.getBoundingClientRect();
    const cardWidth = 320; // w-80 = 320px
    const cardHeight = 200; // Approximate height
    const padding = 8;

    // Calculate horizontal position (center on trigger)
    let left = rect.left + rect.width / 2 - cardWidth / 2;

    // Keep within viewport
    if (left < padding) left = padding;
    if (left + cardWidth > window.innerWidth - padding) {
      left = window.innerWidth - cardWidth - padding;
    }

    // Determine vertical position
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const preferredSide = side;

    let actualSide: 'top' | 'bottom';
    let top: number;

    if (preferredSide === 'top' && spaceAbove >= cardHeight + padding) {
      actualSide = 'top';
      top = rect.top - cardHeight - padding + window.scrollY;
    } else if (preferredSide === 'bottom' && spaceBelow >= cardHeight + padding) {
      actualSide = 'bottom';
      top = rect.bottom + padding + window.scrollY;
    } else if (spaceAbove >= spaceBelow) {
      actualSide = 'top';
      top = rect.top - cardHeight - padding + window.scrollY;
    } else {
      actualSide = 'bottom';
      top = rect.bottom + padding + window.scrollY;
    }

    return { top, left, side: actualSide };
  }, [side]);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      const pos = calculatePosition();
      if (pos) {
        setPosition(pos);
        setIsOpen(true);
      }
    }, delayMs);
  }, [delayMs, calculatePosition, disabled]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(false);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Recalculate position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      const pos = calculatePosition();
      if (pos) setPosition(pos);
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen, calculatePosition]);

  const card = isOpen && position && mounted && (
    <div
      ref={cardRef}
      className={cn(
        'fixed z-[100] w-80',
        'animate-in fade-in-0 zoom-in-95',
        'duration-200 ease-out',
        position.side === 'top' ? 'origin-bottom' : 'origin-top'
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
      onMouseEnter={() => {
        // Keep card open when hovering over it
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }}
      onMouseLeave={handleMouseLeave}
    >
      {/* Arrow indicator */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2',
          'w-3 h-3 rotate-45',
          'bg-white dark:bg-[#111111]',
          'border border-gray-200 dark:border-[#262626]',
          position.side === 'top'
            ? 'bottom-[-7px] border-t-0 border-l-0'
            : 'top-[-7px] border-b-0 border-r-0'
        )}
      />

      {/* Card content */}
      <div className="relative bg-white dark:bg-[#111111] rounded-xl shadow-xl border border-gray-200 dark:border-[#262626] overflow-hidden">
        <ResourceCard
          resource={resource}
          variant="compact"
          showCategory
          showTags={false}
          showInteractions={false}
          className="!border-0 !shadow-none"
        />
      </div>
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('inline cursor-pointer', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>

      {mounted && createPortal(card, document.body)}
    </>
  );
}

/**
 * Skeleton placeholder for loading state
 */
export function ResourceHoverCardSkeleton() {
  return (
    <div className="w-80 p-4 bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#262626]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  );
}
