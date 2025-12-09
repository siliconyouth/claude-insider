import Link from "next/link";
import { ReactNode } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TableOfContents } from "@/components/table-of-contents";
import { ArticleJsonLd } from "@/components/json-ld";

interface SidebarSection {
  title: string;
  items: { label: string; href: string; active?: boolean }[];
}

interface DocsLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  breadcrumbs: { label: string; href?: string }[];
  sidebar?: SidebarSection[];
  prevPage?: { label: string; href: string };
  nextPage?: { label: string; href: string };
  slug?: string[];
}

export function DocsLayout({
  children,
  title,
  description,
  breadcrumbs,
  sidebar,
  prevPage,
  nextPage,
  slug,
}: DocsLayoutProps) {
  // Build URL from slug or breadcrumbs
  const currentPath = slug
    ? `/docs/${slug.join("/")}`
    : breadcrumbs.length > 1
      ? breadcrumbs[breadcrumbs.length - 1]?.href || "/docs"
      : "/docs";
  const url = `https://www.claudeinsider.com${currentPath}`;

  return (
    <div className="min-h-screen">
      <ArticleJsonLd
        title={title}
        description={description}
        url={url}
        breadcrumbs={breadcrumbs}
      />
      <Header />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-12">
          {/* Sidebar */}
          {sidebar && sidebar.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <nav className="sticky top-24 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
                {sidebar.map((section) => (
                  <div key={section.title}>
                    <div className="text-sm font-semibold text-gray-300 mb-2">
                      {section.title}
                    </div>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            item.active
                              ? "text-orange-400 bg-orange-500/10"
                              : "text-gray-400 hover:text-white hover:bg-gray-800"
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>
          )}

          {/* Main Content */}
          <main className={`flex-1 min-w-0 ${!sidebar ? "max-w-4xl mx-auto" : ""}`} id="main-content">
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

          {/* Table of Contents */}
          <TableOfContents contentSelector="article" />
        </div>
      </div>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
