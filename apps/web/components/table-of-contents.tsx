"use client";

import { useEffect, useState } from "react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentSelector?: string;
}

export function TableOfContents({
  contentSelector = "article",
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Extract headings from the article content
    const article = document.querySelector(contentSelector);
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: TOCItem[] = [];

    elements.forEach((element) => {
      const id = element.id;
      if (id) {
        items.push({
          id,
          text: element.textContent || "",
          level: element.tagName === "H2" ? 2 : 3,
        });
      }
    });

    setHeadings(items);

    // Set up intersection observer for scroll spy
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

    elements.forEach((element) => {
      if (element.id) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [contentSelector]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="hidden xl:block w-56 flex-shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="text-sm font-semibold text-gray-300 dark:text-gray-300 mb-3">
          On this page
        </div>
        <ul className="space-y-2 text-sm">
          {headings.map((heading) => (
            <li
              key={heading.id}
              className={heading.level === 3 ? "ml-3" : ""}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(heading.id);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                    setActiveId(heading.id);
                    // Update URL hash without scrolling
                    window.history.pushState(null, "", `#${heading.id}`);
                  }
                }}
                className={`block py-1 transition-colors border-l-2 pl-3 ${
                  activeId === heading.id
                    ? "border-orange-500 text-orange-400 dark:text-orange-400"
                    : "border-transparent text-gray-500 dark:text-gray-500 hover:text-gray-300 dark:hover:text-gray-300 hover:border-gray-600"
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
