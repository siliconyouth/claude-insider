"use client";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10000] focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
    >
      Skip to main content
    </a>
  );
}
