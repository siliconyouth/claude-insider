/**
 * JSON-LD Structured Data Component Tests
 *
 * Tests for SEO structured data components used for rich snippets.
 * These components output JSON-LD scripts that search engines parse.
 *
 * Note: The mocks use dangerouslySetInnerHTML to replicate how next-seo
 * and manual JSON-LD injection work. This is safe because the content
 * is JSON for a script[type="application/ld+json"] tag, not HTML.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import {
  HomeJsonLd,
  DocArticleJsonLd,
  ResourceJsonLd,
  BreadcrumbsJsonLd,
  DocFAQJsonLd,
  PageJsonLd,
  ResourceListJsonLd,
  TutorialJsonLd,
} from "@/components/seo/json-ld";

// Mock next-seo components
vi.mock("next-seo", () => ({
  BreadcrumbJsonLd: ({ items }: { items: Array<{ name: string; item: string }> }) => {
    const jsonData = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.item,
      })),
    });
    return <script type="application/ld+json" data-testid="breadcrumb-jsonld">{jsonData}</script>;
  },
  FAQJsonLd: ({ questions }: { questions: Array<{ question: string; answer: string }> }) => {
    const jsonData = JSON.stringify({
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
    });
    return <script type="application/ld+json" data-testid="faq-jsonld">{jsonData}</script>;
  },
  SoftwareApplicationJsonLd: (props: Record<string, unknown>) => {
    const jsonData = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      ...props,
    });
    return <script type="application/ld+json" data-testid="software-jsonld">{jsonData}</script>;
  },
}));

// Mock seo-config
vi.mock("@/lib/seo-config", () => ({
  organizationJsonLd: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Claude Insider",
    url: "https://www.claudeinsider.com",
    logo: "https://www.claudeinsider.com/icons/icon-512x512.png",
  },
  websiteJsonLd: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Claude Insider",
    url: "https://www.claudeinsider.com",
    description: "Test description",
  },
  SEO_CONSTANTS: {
    SITE_URL: "https://www.claudeinsider.com",
    SITE_NAME: "Claude Insider",
    SITE_DESCRIPTION: "Test description",
    TITLE_MAX_LENGTH: 60,
    DESCRIPTION_MAX_LENGTH: 160,
    OG_IMAGE_WIDTH: 1200,
    OG_IMAGE_HEIGHT: 630,
  },
}));

// Helper to parse JSON-LD from a script element
function parseJsonLd(container: HTMLElement, index = 0): Record<string, unknown> {
  const scripts = container.querySelectorAll('script[type="application/ld+json"]');
  const script = scripts[index];
  if (!script) return {};
  return JSON.parse(script.innerHTML);
}

describe("JSON-LD Components", () => {
  describe("HomeJsonLd", () => {
    it("should render two JSON-LD scripts", () => {
      const { container } = render(<HomeJsonLd />);

      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBe(2);
    });

    it("should render organization JSON-LD", () => {
      const { container } = render(<HomeJsonLd />);

      const orgData = parseJsonLd(container, 0);
      expect(orgData["@type"]).toBe("Organization");
      expect(orgData["name"]).toBe("Claude Insider");
      expect(orgData["url"]).toBe("https://www.claudeinsider.com");
    });

    it("should render website JSON-LD", () => {
      const { container } = render(<HomeJsonLd />);

      const webData = parseJsonLd(container, 1);
      expect(webData["@type"]).toBe("WebSite");
      expect(webData["name"]).toBe("Claude Insider");
    });

    it("should include schema.org context", () => {
      const { container } = render(<HomeJsonLd />);

      const data = parseJsonLd(container, 0);
      expect(data["@context"]).toBe("https://schema.org");
    });
  });

  describe("DocArticleJsonLd", () => {
    const requiredProps = {
      title: "Getting Started with Claude",
      description: "Learn how to use Claude AI effectively",
      slug: "getting-started",
      category: "Basics",
    };

    it("should render TechArticle type", () => {
      const { container } = render(<DocArticleJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["@type"]).toBe("TechArticle");
    });

    it("should include title as headline", () => {
      const { container } = render(<DocArticleJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["headline"]).toBe("Getting Started with Claude");
    });

    it("should include description", () => {
      const { container } = render(<DocArticleJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["description"]).toBe("Learn how to use Claude AI effectively");
    });

    it("should construct correct URL from slug", () => {
      const { container } = render(<DocArticleJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["url"]).toBe("https://www.claudeinsider.com/docs/getting-started");
      expect(data["@id"]).toBe("https://www.claudeinsider.com/docs/getting-started");
    });

    it("should construct OG image URL with title and category", () => {
      const { container } = render(<DocArticleJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      const imageUrl = data["image"] as string;
      expect(imageUrl).toContain("/api/og/doc");
      expect(imageUrl).toContain(encodeURIComponent("Getting Started with Claude"));
      expect(imageUrl).toContain(encodeURIComponent("Basics"));
    });

    it("should include author information", () => {
      const { container } = render(<DocArticleJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      const author = data["author"] as Record<string, unknown>;
      expect(author["@type"]).toBe("Person");
      expect(author["name"]).toBe("Vladimir Dukelic");
    });

    it("should include publisher information", () => {
      const { container } = render(<DocArticleJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      const publisher = data["publisher"] as Record<string, unknown>;
      expect(publisher["@type"]).toBe("Organization");
      expect(publisher["name"]).toBe("Claude Insider");
    });

    it("should include category as articleSection", () => {
      const { container } = render(<DocArticleJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["articleSection"]).toBe("Basics");
    });

    it("should set isAccessibleForFree to true", () => {
      const { container } = render(<DocArticleJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["isAccessibleForFree"]).toBe(true);
    });

    it("should use provided datePublished", () => {
      const { container } = render(
        <DocArticleJsonLd {...requiredProps} datePublished="2024-01-15T00:00:00Z" />
      );

      const data = parseJsonLd(container);
      expect(data["datePublished"]).toBe("2024-01-15T00:00:00Z");
    });

    it("should use provided dateModified", () => {
      const { container } = render(
        <DocArticleJsonLd {...requiredProps} dateModified="2024-02-20T00:00:00Z" />
      );

      const data = parseJsonLd(container);
      expect(data["dateModified"]).toBe("2024-02-20T00:00:00Z");
    });

    it("should include wordCount when provided", () => {
      const { container } = render(
        <DocArticleJsonLd {...requiredProps} wordCount={1500} />
      );

      const data = parseJsonLd(container);
      expect(data["wordCount"]).toBe(1500);
    });

    it("should not include wordCount when not provided", () => {
      const { container } = render(<DocArticleJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["wordCount"]).toBeUndefined();
    });

    it("should include mainEntityOfPage", () => {
      const { container } = render(<DocArticleJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      const mainEntity = data["mainEntityOfPage"] as Record<string, unknown>;
      expect(mainEntity["@type"]).toBe("WebPage");
    });
  });

  describe("ResourceJsonLd", () => {
    const requiredProps = {
      name: "Claude API",
      description: "Official Claude API documentation",
      slug: "claude-api",
      category: "APIs",
      url: "https://docs.anthropic.com",
    };

    it("should render SoftwareApplication type", () => {
      const { container } = render(<ResourceJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["@type"]).toBe("SoftwareApplication");
    });

    it("should include name", () => {
      const { container } = render(<ResourceJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["name"]).toBe("Claude API");
    });

    it("should include description", () => {
      const { container } = render(<ResourceJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["description"]).toBe("Official Claude API documentation");
    });

    it("should use external URL", () => {
      const { container } = render(<ResourceJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["url"]).toBe("https://docs.anthropic.com");
    });

    it("should default applicationCategory to DeveloperApplication", () => {
      const { container } = render(<ResourceJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["applicationCategory"]).toBe("DeveloperApplication");
    });

    it("should use provided applicationCategory", () => {
      const { container } = render(
        <ResourceJsonLd {...requiredProps} applicationCategory="UtilitiesApplication" />
      );

      const data = parseJsonLd(container);
      expect(data["applicationCategory"]).toBe("UtilitiesApplication");
    });

    it("should default operatingSystem to Any", () => {
      const { container } = render(<ResourceJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["operatingSystem"]).toBe("Any");
    });

    it("should use provided operatingSystem", () => {
      const { container } = render(
        <ResourceJsonLd {...requiredProps} operatingSystem="macOS" />
      );

      const data = parseJsonLd(container);
      expect(data["operatingSystem"]).toBe("macOS");
    });

    it("should include aggregateRating when rating and count provided", () => {
      const { container } = render(
        <ResourceJsonLd {...requiredProps} rating={4.5} ratingCount={120} />
      );

      const data = parseJsonLd(container);
      const rating = data["aggregateRating"] as Record<string, unknown>;
      expect(rating["ratingValue"]).toBe(4.5);
      expect(rating["ratingCount"]).toBe(120);
      expect(rating["bestRating"]).toBe(5);
    });

    it("should not include aggregateRating when only rating provided", () => {
      const { container } = render(<ResourceJsonLd {...requiredProps} rating={4.5} />);

      const data = parseJsonLd(container);
      expect(data["aggregateRating"]).toBeUndefined();
    });

    it("should include offers when provided", () => {
      const { container } = render(
        <ResourceJsonLd
          {...requiredProps}
          offers={{ price: 9.99, priceCurrency: "USD" }}
        />
      );

      const data = parseJsonLd(container);
      const offers = data["offers"] as Record<string, unknown>;
      expect(offers["price"]).toBe(9.99);
      expect(offers["priceCurrency"]).toBe("USD");
    });

    it("should include image URL", () => {
      const { container } = render(<ResourceJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      const imageUrl = data["image"] as string;
      expect(imageUrl).toContain("/api/og/resource");
    });
  });

  describe("BreadcrumbsJsonLd", () => {
    const items = [
      { name: "Home", href: "/" },
      { name: "Docs", href: "/docs" },
      { name: "Getting Started", href: "/docs/getting-started" },
    ];

    it("should render BreadcrumbList type", () => {
      const { container } = render(<BreadcrumbsJsonLd items={items} />);

      const data = parseJsonLd(container);
      expect(data["@type"]).toBe("BreadcrumbList");
    });

    it("should include correct number of items", () => {
      const { container } = render(<BreadcrumbsJsonLd items={items} />);

      const data = parseJsonLd(container);
      const itemList = data["itemListElement"] as Array<Record<string, unknown>>;
      expect(itemList.length).toBe(3);
    });

    it("should prepend SITE_URL to item hrefs", () => {
      const { container } = render(<BreadcrumbsJsonLd items={items} />);

      const data = parseJsonLd(container);
      const itemList = data["itemListElement"] as Array<Record<string, unknown>>;
      expect(itemList[0]["item"]).toBe("https://www.claudeinsider.com/");
      expect(itemList[1]["item"]).toBe("https://www.claudeinsider.com/docs");
    });

    it("should include item names", () => {
      const { container } = render(<BreadcrumbsJsonLd items={items} />);

      const data = parseJsonLd(container);
      const itemList = data["itemListElement"] as Array<Record<string, unknown>>;
      expect(itemList[0]["name"]).toBe("Home");
      expect(itemList[2]["name"]).toBe("Getting Started");
    });

    it("should include positions starting at 1", () => {
      const { container } = render(<BreadcrumbsJsonLd items={items} />);

      const data = parseJsonLd(container);
      const itemList = data["itemListElement"] as Array<Record<string, unknown>>;
      expect(itemList[0]["position"]).toBe(1);
      expect(itemList[1]["position"]).toBe(2);
      expect(itemList[2]["position"]).toBe(3);
    });

    it("should handle single item", () => {
      const { container } = render(
        <BreadcrumbsJsonLd items={[{ name: "Home", href: "/" }]} />
      );

      const data = parseJsonLd(container);
      const itemList = data["itemListElement"] as Array<Record<string, unknown>>;
      expect(itemList.length).toBe(1);
    });
  });

  describe("DocFAQJsonLd", () => {
    const questions = [
      { question: "What is Claude?", answer: "Claude is an AI assistant by Anthropic." },
      { question: "How do I get started?", answer: "Visit claude.ai to begin." },
    ];

    it("should render FAQPage type", () => {
      const { container } = render(<DocFAQJsonLd questions={questions} />);

      const data = parseJsonLd(container);
      expect(data["@type"]).toBe("FAQPage");
    });

    it("should include all questions", () => {
      const { container } = render(<DocFAQJsonLd questions={questions} />);

      const data = parseJsonLd(container);
      const mainEntity = data["mainEntity"] as Array<Record<string, unknown>>;
      expect(mainEntity.length).toBe(2);
    });

    it("should format questions correctly", () => {
      const { container } = render(<DocFAQJsonLd questions={questions} />);

      const data = parseJsonLd(container);
      const mainEntity = data["mainEntity"] as Array<Record<string, unknown>>;
      expect(mainEntity[0]["@type"]).toBe("Question");
      expect(mainEntity[0]["name"]).toBe("What is Claude?");
    });

    it("should format answers correctly", () => {
      const { container } = render(<DocFAQJsonLd questions={questions} />);

      const data = parseJsonLd(container);
      const mainEntity = data["mainEntity"] as Array<Record<string, unknown>>;
      const answer = mainEntity[0]["acceptedAnswer"] as Record<string, unknown>;
      expect(answer["@type"]).toBe("Answer");
      expect(answer["text"]).toBe("Claude is an AI assistant by Anthropic.");
    });

    it("should return null for empty questions array", () => {
      const { container } = render(<DocFAQJsonLd questions={[]} />);

      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      expect(scripts.length).toBe(0);
    });
  });

  describe("PageJsonLd", () => {
    const requiredProps = {
      title: "About Us",
      description: "Learn about Claude Insider",
      path: "/about",
    };

    it("should render WebPage type", () => {
      const { container } = render(<PageJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["@type"]).toBe("WebPage");
    });

    it("should include title as name", () => {
      const { container } = render(<PageJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["name"]).toBe("About Us");
    });

    it("should include description", () => {
      const { container } = render(<PageJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["description"]).toBe("Learn about Claude Insider");
    });

    it("should construct URL from path", () => {
      const { container } = render(<PageJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["url"]).toBe("https://www.claudeinsider.com/about");
      expect(data["@id"]).toBe("https://www.claudeinsider.com/about");
    });

    it("should include isPartOf with WebSite reference", () => {
      const { container } = render(<PageJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      const isPartOf = data["isPartOf"] as Record<string, unknown>;
      expect(isPartOf["@type"]).toBe("WebSite");
      expect(isPartOf["name"]).toBe("Claude Insider");
      expect(isPartOf["url"]).toBe("https://www.claudeinsider.com");
    });

    it("should include datePublished when provided", () => {
      const { container } = render(
        <PageJsonLd {...requiredProps} datePublished="2024-01-01T00:00:00Z" />
      );

      const data = parseJsonLd(container);
      expect(data["datePublished"]).toBe("2024-01-01T00:00:00Z");
    });

    it("should include dateModified when provided", () => {
      const { container } = render(
        <PageJsonLd {...requiredProps} dateModified="2024-03-15T00:00:00Z" />
      );

      const data = parseJsonLd(container);
      expect(data["dateModified"]).toBe("2024-03-15T00:00:00Z");
    });

    it("should not include dates when not provided", () => {
      const { container } = render(<PageJsonLd {...requiredProps} />);

      const data = parseJsonLd(container);
      expect(data["datePublished"]).toBeUndefined();
      expect(data["dateModified"]).toBeUndefined();
    });
  });

  describe("ResourceListJsonLd", () => {
    const resources = [
      { name: "Claude API", slug: "claude-api", description: "API docs", position: 1 },
      { name: "Claude SDK", slug: "claude-sdk", description: "SDK docs", position: 2 },
    ];

    it("should render ItemList type", () => {
      const { container } = render(
        <ResourceListJsonLd
          resources={resources}
          listName="Popular Resources"
          listDescription="Most used resources"
        />
      );

      const data = parseJsonLd(container);
      expect(data["@type"]).toBe("ItemList");
    });

    it("should include list name", () => {
      const { container } = render(
        <ResourceListJsonLd
          resources={resources}
          listName="Popular Resources"
          listDescription="Most used resources"
        />
      );

      const data = parseJsonLd(container);
      expect(data["name"]).toBe("Popular Resources");
    });

    it("should include list description", () => {
      const { container } = render(
        <ResourceListJsonLd
          resources={resources}
          listName="Popular Resources"
          listDescription="Most used resources"
        />
      );

      const data = parseJsonLd(container);
      expect(data["description"]).toBe("Most used resources");
    });

    it("should include numberOfItems", () => {
      const { container } = render(
        <ResourceListJsonLd
          resources={resources}
          listName="Popular Resources"
          listDescription="Most used resources"
        />
      );

      const data = parseJsonLd(container);
      expect(data["numberOfItems"]).toBe(2);
    });

    it("should format list items correctly", () => {
      const { container } = render(
        <ResourceListJsonLd
          resources={resources}
          listName="Popular Resources"
          listDescription="Most used resources"
        />
      );

      const data = parseJsonLd(container);
      const items = data["itemListElement"] as Array<Record<string, unknown>>;
      expect(items.length).toBe(2);
      expect(items[0]["@type"]).toBe("ListItem");
      expect(items[0]["position"]).toBe(1);
      expect(items[0]["name"]).toBe("Claude API");
      expect(items[0]["description"]).toBe("API docs");
    });

    it("should construct URLs from slugs", () => {
      const { container } = render(
        <ResourceListJsonLd
          resources={resources}
          listName="Popular Resources"
          listDescription="Most used resources"
        />
      );

      const data = parseJsonLd(container);
      const items = data["itemListElement"] as Array<Record<string, unknown>>;
      expect(items[0]["url"]).toBe("https://www.claudeinsider.com/resources/claude-api");
      expect(items[1]["url"]).toBe("https://www.claudeinsider.com/resources/claude-sdk");
    });

    it("should handle empty resources array", () => {
      const { container } = render(
        <ResourceListJsonLd
          resources={[]}
          listName="Empty List"
          listDescription="No resources"
        />
      );

      const data = parseJsonLd(container);
      expect(data["numberOfItems"]).toBe(0);
      const items = data["itemListElement"] as Array<Record<string, unknown>>;
      expect(items.length).toBe(0);
    });
  });

  describe("TutorialJsonLd", () => {
    const steps = [
      { name: "Install CLI", text: "Run npm install -g claude-cli" },
      { name: "Configure", text: "Run claude init to configure", url: "https://example.com/configure" },
    ];

    it("should render HowTo type", () => {
      const { container } = render(
        <TutorialJsonLd
          name="Getting Started Tutorial"
          description="Learn to use Claude"
          steps={steps}
        />
      );

      const data = parseJsonLd(container);
      expect(data["@type"]).toBe("HowTo");
    });

    it("should include tutorial name", () => {
      const { container } = render(
        <TutorialJsonLd
          name="Getting Started Tutorial"
          description="Learn to use Claude"
          steps={steps}
        />
      );

      const data = parseJsonLd(container);
      expect(data["name"]).toBe("Getting Started Tutorial");
    });

    it("should include description", () => {
      const { container } = render(
        <TutorialJsonLd
          name="Getting Started Tutorial"
          description="Learn to use Claude"
          steps={steps}
        />
      );

      const data = parseJsonLd(container);
      expect(data["description"]).toBe("Learn to use Claude");
    });

    it("should include totalTime when provided", () => {
      const { container } = render(
        <TutorialJsonLd
          name="Quick Tutorial"
          description="Fast guide"
          totalTime="PT15M"
          steps={steps}
        />
      );

      const data = parseJsonLd(container);
      expect(data["totalTime"]).toBe("PT15M");
    });

    it("should not include totalTime when not provided", () => {
      const { container } = render(
        <TutorialJsonLd
          name="Quick Tutorial"
          description="Fast guide"
          steps={steps}
        />
      );

      const data = parseJsonLd(container);
      expect(data["totalTime"]).toBeUndefined();
    });

    it("should format steps correctly", () => {
      const { container } = render(
        <TutorialJsonLd
          name="Tutorial"
          description="Description"
          steps={steps}
        />
      );

      const data = parseJsonLd(container);
      const stepList = data["step"] as Array<Record<string, unknown>>;
      expect(stepList.length).toBe(2);
      expect(stepList[0]["@type"]).toBe("HowToStep");
      expect(stepList[0]["position"]).toBe(1);
      expect(stepList[0]["name"]).toBe("Install CLI");
      expect(stepList[0]["text"]).toBe("Run npm install -g claude-cli");
    });

    it("should include step URL when provided", () => {
      const { container } = render(
        <TutorialJsonLd
          name="Tutorial"
          description="Description"
          steps={steps}
        />
      );

      const data = parseJsonLd(container);
      const stepList = data["step"] as Array<Record<string, unknown>>;
      expect(stepList[0]["url"]).toBeUndefined();
      expect(stepList[1]["url"]).toBe("https://example.com/configure");
    });

    it("should number steps starting at 1", () => {
      const manySteps = [
        { name: "Step 1", text: "First" },
        { name: "Step 2", text: "Second" },
        { name: "Step 3", text: "Third" },
      ];

      const { container } = render(
        <TutorialJsonLd
          name="Tutorial"
          description="Description"
          steps={manySteps}
        />
      );

      const data = parseJsonLd(container);
      const stepList = data["step"] as Array<Record<string, unknown>>;
      expect(stepList[0]["position"]).toBe(1);
      expect(stepList[1]["position"]).toBe(2);
      expect(stepList[2]["position"]).toBe(3);
    });
  });

  describe("Schema.org Context", () => {
    it("HomeJsonLd includes schema.org context", () => {
      const { container } = render(<HomeJsonLd />);
      const data = parseJsonLd(container);
      expect(data["@context"]).toBe("https://schema.org");
    });

    it("DocArticleJsonLd includes schema.org context", () => {
      const { container } = render(
        <DocArticleJsonLd
          title="Test"
          description="Test"
          slug="test"
          category="Test"
        />
      );
      const data = parseJsonLd(container);
      expect(data["@context"]).toBe("https://schema.org");
    });

    it("PageJsonLd includes schema.org context", () => {
      const { container } = render(
        <PageJsonLd title="Test" description="Test" path="/test" />
      );
      const data = parseJsonLd(container);
      expect(data["@context"]).toBe("https://schema.org");
    });

    it("ResourceListJsonLd includes schema.org context", () => {
      const { container } = render(
        <ResourceListJsonLd
          resources={[]}
          listName="Test"
          listDescription="Test"
        />
      );
      const data = parseJsonLd(container);
      expect(data["@context"]).toBe("https://schema.org");
    });

    it("TutorialJsonLd includes schema.org context", () => {
      const { container } = render(
        <TutorialJsonLd
          name="Test"
          description="Test"
          steps={[{ name: "Step", text: "Do this" }]}
        />
      );
      const data = parseJsonLd(container);
      expect(data["@context"]).toBe("https://schema.org");
    });
  });

  describe("Script Tag Attributes", () => {
    it("should use application/ld+json type", () => {
      const { container } = render(<HomeJsonLd />);
      const script = container.querySelector("script");
      expect(script).toHaveAttribute("type", "application/ld+json");
    });

    it("should contain valid JSON", () => {
      const { container } = render(
        <DocArticleJsonLd
          title="Test Article"
          description="Test description"
          slug="test"
          category="Testing"
        />
      );

      const script = container.querySelector('script[type="application/ld+json"]');
      expect(() => JSON.parse(script?.innerHTML || "")).not.toThrow();
    });
  });
});
