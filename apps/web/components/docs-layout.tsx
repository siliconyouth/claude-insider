import Link from "next/link";
import { ReactNode, Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { TableOfContents } from "@/components/table-of-contents";
import { ArticleJsonLd } from "@/components/json-ld";
import { EditOnGitHub } from "@/components/edit-on-github";
import { SuggestEditButton } from "@/components/interactions/suggest-edit-button";
import { CommentSection } from "@/components/interactions/comment-section";
import { FavoriteButton } from "@/components/interactions/favorite-button";
import { RatingStars } from "@/components/interactions/rating-stars";
import { DocRelatedResources } from "@/components/cross-linking/DocRelatedResources";
import { RelatedResourcesSkeleton } from "@/components/cross-linking/RelatedResources";

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
  readingTime?: string;
  editPath?: string;
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
  readingTime,
  editPath,
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
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">
                      {section.title}
                    </div>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            item.active
                              ? "text-blue-600 dark:text-cyan-400 bg-blue-500/10"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
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
            <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 dark:text-white">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>

            <article className="prose dark:prose-invert prose-blue dark:prose-cyan max-w-none">
              <h1 className="text-4xl font-bold mb-2">{title}</h1>
              {/* Doc Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 not-prose">
                {readingTime && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{readingTime}</span>
                  </div>
                )}

                {/* User Interaction Controls */}
                {slug && (
                  <div className="flex items-center gap-3">
                    <FavoriteButton
                      resourceType="doc"
                      resourceId={slug.join("/")}
                      size="sm"
                    />
                    <RatingStars
                      resourceType="doc"
                      resourceId={slug.join("/")}
                      size="sm"
                    />
                  </div>
                )}
              </div>
              {description && (
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-8">
                  {description}
                </p>
              )}
              {children}

              {/* Edit actions */}
              {editPath && (
                <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 not-prose">
                  <div className="flex items-center gap-4">
                    <EditOnGitHub filePath={editPath} />
                    <span className="text-gray-300 dark:text-gray-700">·</span>
                    <SuggestEditButton
                      resourceType="doc"
                      resourceId={slug?.join("/") || "index"}
                      resourceTitle={title}
                      variant="link"
                    />
                  </div>
                </div>
              )}
            </article>

            {/* Related Resources */}
            {slug && (
              <Suspense fallback={<RelatedResourcesSkeleton />}>
                <DocRelatedResources docSlug={slug.join("/")} maxResources={6} />
              </Suspense>
            )}

            {/* Page Navigation */}
            {(prevPage || nextPage) && (
              <div className="flex justify-between mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
                {prevPage ? (
                  <Link
                    href={prevPage.href}
                    className="group flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
                    className="group flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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

            {/* Comments Section */}
            {slug && (
              <CommentSection
                resourceType="doc"
                resourceId={slug.join("/")}
                title="Discussion"
              />
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
