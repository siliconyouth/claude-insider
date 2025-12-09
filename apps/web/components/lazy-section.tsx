"use client";

import { ReactNode } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { cn } from "@/lib/design-system";

interface LazySectionProps {
  children: ReactNode;
  placeholder?: ReactNode;
  className?: string;
  /** Distance from viewport to start loading (default: 100px) */
  rootMargin?: string;
  /** Only trigger once (default: true) */
  triggerOnce?: boolean;
  /** Minimum height for placeholder to prevent layout shift */
  minHeight?: string | number;
  /** Animation on reveal */
  animate?: boolean;
  /** Animation delay for staggered effects */
  animationDelay?: number;
}

/**
 * Lazy load section content when it enters the viewport.
 * Uses Intersection Observer for efficient performance.
 *
 * @example
 * ```tsx
 * <LazySection
 *   placeholder={<SkeletonCard />}
 *   minHeight={200}
 * >
 *   <ExpensiveComponent />
 * </LazySection>
 * ```
 */
export function LazySection({
  children,
  placeholder,
  className,
  rootMargin = "100px",
  triggerOnce = true,
  minHeight,
  animate = true,
  animationDelay = 0,
}: LazySectionProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin,
    triggerOnce,
    threshold: 0.01,
  });

  const minHeightStyle =
    typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  return (
    <div
      ref={ref}
      className={cn(
        className,
        animate && isIntersecting && "animate-fade-in-up"
      )}
      style={{
        minHeight: !isIntersecting ? minHeightStyle : undefined,
        animationDelay: animate ? `${animationDelay}ms` : undefined,
        animationFillMode: animate ? "both" : undefined,
      }}
    >
      {isIntersecting ? children : placeholder}
    </div>
  );
}

interface ProgressiveRevealProps {
  children: ReactNode[];
  /** Delay between each child reveal (ms) */
  stagger?: number;
  /** Base delay before first item (ms) */
  baseDelay?: number;
  className?: string;
  itemClassName?: string;
}

/**
 * Progressively reveal children with staggered animation.
 * Each child fades in sequentially when the container enters viewport.
 *
 * @example
 * ```tsx
 * <ProgressiveReveal stagger={100}>
 *   <Card />
 *   <Card />
 *   <Card />
 * </ProgressiveReveal>
 * ```
 */
export function ProgressiveReveal({
  children,
  stagger = 50,
  baseDelay = 0,
  className,
  itemClassName,
}: ProgressiveRevealProps) {
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: "50px",
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            itemClassName,
            isIntersecting ? "animate-fade-in-up" : "opacity-0"
          )}
          style={{
            animationDelay: isIntersecting
              ? `${baseDelay + index * stagger}ms`
              : undefined,
            animationFillMode: "both",
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

interface LazyListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  renderPlaceholder?: (index: number) => ReactNode;
  /** Number of items to show as placeholders before intersection */
  placeholderCount?: number;
  className?: string;
  itemClassName?: string;
  stagger?: number;
}

/**
 * Lazy load list items with progressive reveal.
 *
 * @example
 * ```tsx
 * <LazyList
 *   items={categories}
 *   renderItem={(cat, i) => <CategoryCard key={i} {...cat} />}
 *   renderPlaceholder={(i) => <SkeletonCard key={i} />}
 *   placeholderCount={3}
 * />
 * ```
 */
export function LazyList<T>({
  items,
  renderItem,
  renderPlaceholder,
  placeholderCount = 3,
  className,
  itemClassName,
  stagger = 50,
}: LazyListProps<T>) {
  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: "100px",
    triggerOnce: true,
    threshold: 0.01,
  });

  return (
    <div ref={ref} className={className}>
      {isIntersecting
        ? items.map((item, index) => (
            <div
              key={index}
              className={cn(itemClassName, "animate-fade-in-up")}
              style={{
                animationDelay: `${index * stagger}ms`,
                animationFillMode: "both",
              }}
            >
              {renderItem(item, index)}
            </div>
          ))
        : renderPlaceholder
          ? Array.from({ length: placeholderCount }).map((_, index) =>
              renderPlaceholder(index)
            )
          : null}
    </div>
  );
}
