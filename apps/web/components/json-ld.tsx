interface ArticleJsonLdProps {
  title: string;
  description?: string;
  url: string;
  breadcrumbs: { label: string; href?: string }[];
}

export function ArticleJsonLd({
  title,
  description,
  url,
  breadcrumbs,
}: ArticleJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: title,
        description: description || `${title} - Claude AI documentation`,
        url: url,
        isPartOf: {
          "@id": "https://www.claudeinsider.com/#website",
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": url,
        },
        author: {
          "@type": "Person",
          name: "Vladimir Dukelic",
          email: "vladimir@dukelic.com",
          url: "https://github.com/siliconyouth",
        },
        publisher: {
          "@id": "https://www.claudeinsider.com/#organization",
        },
        inLanguage: "en-US",
        about: {
          "@type": "SoftwareApplication",
          name: "Claude AI",
          applicationCategory: "AI Assistant",
          operatingSystem: "Cross-platform",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://www.claudeinsider.com",
          },
          ...breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 2,
            name: crumb.label,
            item: crumb.href
              ? `https://www.claudeinsider.com${crumb.href}`
              : undefined,
          })),
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface FAQJsonLdProps {
  questions: { question: string; answer: string }[];
}

export function FAQJsonLd({ questions }: FAQJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
