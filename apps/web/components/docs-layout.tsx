import Link from "next/link";
import { ReactNode } from "react";

interface DocsLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  breadcrumbs: { label: string; href?: string }[];
  sidebar?: {
    title: string;
    items: { label: string; href: string; active?: boolean }[];
  };
  prevPage?: { label: string; href: string };
  nextPage?: { label: string; href: string };
}

export function DocsLayout({
  children,
  title,
  description,
  breadcrumbs,
  sidebar,
  prevPage,
  nextPage,
}: DocsLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 sticky top-0 bg-gray-950/80 backdrop-blur-lg z-50">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
                  <span className="text-lg font-bold text-white">C</span>
                </div>
                <span className="text-xl font-semibold">Claude Insider</span>
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/docs"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/docs/getting-started"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Getting Started
              </Link>
              <a
                href="https://github.com/siliconyouth/claude-insider"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          {/* Sidebar */}
          {sidebar && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <nav className="sticky top-24 space-y-1">
                <div className="text-sm font-semibold text-gray-300 mb-4">
                  {sidebar.title}
                </div>
                {sidebar.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                      item.active
                        ? "text-orange-400 bg-orange-500/10"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>
          )}

          {/* Main Content */}
          <main className={`flex-1 min-w-0 ${!sidebar ? "max-w-4xl mx-auto" : ""}`}>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-white transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-white">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>

            <article className="prose prose-invert prose-orange max-w-none">
              <h1 className="text-4xl font-bold mb-6">{title}</h1>
              {description && (
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {description}
                </p>
              )}
              {children}
            </article>

            {/* Page Navigation */}
            {(prevPage || nextPage) && (
              <div className="flex justify-between mt-16 pt-8 border-t border-gray-800">
                {prevPage ? (
                  <Link
                    href={prevPage.href}
                    className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    <span>{prevPage.label}</span>
                  </Link>
                ) : (
                  <div />
                )}
                {nextPage ? (
                  <Link
                    href={nextPage.href}
                    className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <span>{nextPage.label}</span>
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm text-gray-400">
              Claude Insider - Built with Claude Code & Opus 4.5
            </span>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Claude AI
              </a>
              <a
                href="https://github.com/siliconyouth/claude-insider"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
