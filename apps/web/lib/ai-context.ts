/**
 * AI Context System
 *
 * Tracks user location and provides contextual information for the AI assistant.
 */

export interface AIContext {
  // Page context
  page: {
    path: string;
    title: string;
    section?: string;
    category?: string;
  };
  // Content context (what the user is looking at)
  content?: {
    type: "code" | "heading" | "paragraph" | "resource" | "setting" | "feature";
    title?: string;
    text?: string;
    code?: string;
    language?: string;
    metadata?: Record<string, string>;
  };
  // Navigation context
  breadcrumbs?: string[];
  // Related topics for follow-up
  relatedTopics?: string[];
}

/**
 * Generate a contextual question for the AI assistant
 */
export function generateContextualQuestion(context: AIContext, userQuestion?: string): string {
  const parts: string[] = [];

  // Add page context
  parts.push(`[Context: User is on "${context.page.title}" page (${context.page.path})]`);

  if (context.page.section) {
    parts.push(`[Section: ${context.page.section}]`);
  }

  if (context.page.category) {
    parts.push(`[Category: ${context.page.category}]`);
  }

  // Add content context
  if (context.content) {
    switch (context.content.type) {
      case "code":
        parts.push(`[Code Block (${context.content.language || "unknown"}):]`);
        if (context.content.code) {
          parts.push("```" + (context.content.language || ""));
          parts.push(context.content.code.slice(0, 500)); // Limit code length
          if (context.content.code.length > 500) parts.push("... (truncated)");
          parts.push("```");
        }
        break;
      case "heading":
        parts.push(`[Heading: "${context.content.title}"]`);
        break;
      case "resource":
        parts.push(`[Resource: "${context.content.title}"]`);
        if (context.content.metadata) {
          Object.entries(context.content.metadata).forEach(([key, value]) => {
            parts.push(`[${key}: ${value}]`);
          });
        }
        break;
      case "setting":
        parts.push(`[Setting: "${context.content.title}"]`);
        if (context.content.text) {
          parts.push(`[Description: ${context.content.text}]`);
        }
        break;
      case "feature":
        parts.push(`[Feature: "${context.content.title}"]`);
        break;
      default:
        if (context.content.text) {
          parts.push(`[Selected text: "${context.content.text.slice(0, 200)}"]`);
        }
    }
  }

  // Add breadcrumbs for navigation context
  if (context.breadcrumbs && context.breadcrumbs.length > 0) {
    parts.push(`[Navigation: ${context.breadcrumbs.join(" > ")}]`);
  }

  // Add user's actual question
  if (userQuestion) {
    parts.push("");
    parts.push(`User's question: ${userQuestion}`);
  }

  return parts.join("\n");
}

/**
 * Generate suggested follow-up questions based on context
 */
export function generateSuggestedQuestions(context: AIContext): string[] {
  const suggestions: string[] = [];

  if (context.content?.type === "code") {
    suggestions.push("Explain this code step by step");
    suggestions.push("How can I modify this for my use case?");
    suggestions.push("What are common issues with this approach?");
    suggestions.push("Show me an alternative implementation");
  } else if (context.content?.type === "setting") {
    suggestions.push("What does this setting do?");
    suggestions.push("What's the recommended value?");
    suggestions.push("How do I configure this in my environment?");
    suggestions.push("What happens if I change this?");
  } else if (context.content?.type === "resource") {
    suggestions.push("How do I get started with this?");
    suggestions.push("What are the alternatives?");
    suggestions.push("Show me example usage");
    suggestions.push("What are the pros and cons?");
  } else if (context.content?.type === "heading") {
    suggestions.push(`Tell me more about ${context.content.title}`);
    suggestions.push("Give me a practical example");
    suggestions.push("What are common mistakes to avoid?");
    suggestions.push("How does this relate to other topics?");
  } else {
    // Generic suggestions based on page
    suggestions.push("Explain this in simpler terms");
    suggestions.push("Give me a practical example");
    suggestions.push("What should I know first?");
    suggestions.push("What are the best practices?");
  }

  return suggestions;
}

/**
 * Extract context from a DOM element
 */
export function extractContextFromElement(element: HTMLElement, pageContext: AIContext["page"]): AIContext {
  const context: AIContext = { page: pageContext };

  // Check if it's a code block
  const codeBlock = element.closest("pre");
  if (codeBlock) {
    const codeElement = codeBlock.querySelector("code");
    const language = codeElement?.className.match(/language-(\w+)/)?.[1] || "";
    context.content = {
      type: "code",
      code: codeElement?.textContent || codeBlock.textContent || "",
      language,
    };
    return context;
  }

  // Check if it's a heading
  if (element.matches("h1, h2, h3, h4, h5, h6")) {
    context.content = {
      type: "heading",
      title: element.textContent?.trim() || "",
    };
    return context;
  }

  // Check if it's a resource card
  const resourceCard = element.closest("[data-resource]");
  if (resourceCard) {
    context.content = {
      type: "resource",
      title: resourceCard.getAttribute("data-resource-title") || "",
      metadata: {
        category: resourceCard.getAttribute("data-resource-category") || "",
        url: resourceCard.getAttribute("data-resource-url") || "",
      },
    };
    return context;
  }

  // Check if it's a setting/option
  const settingElement = element.closest("[data-setting]");
  if (settingElement) {
    context.content = {
      type: "setting",
      title: settingElement.getAttribute("data-setting-name") || "",
      text: settingElement.getAttribute("data-setting-description") || "",
    };
    return context;
  }

  // Default to paragraph/text
  const text = element.textContent?.trim() || "";
  if (text) {
    context.content = {
      type: "paragraph",
      text: text.slice(0, 500),
    };
  }

  return context;
}

/**
 * Get page context from current location
 */
export function getPageContext(): AIContext["page"] {
  if (typeof window === "undefined") {
    return { path: "/", title: "Claude Insider" };
  }

  const path = window.location.pathname;
  const title = document.title.replace(" - Claude Insider", "").trim();

  // Extract category from path
  const pathParts = path.split("/").filter(Boolean);
  const category = pathParts[0] || undefined;

  // Get current section from heading
  const headings = document.querySelectorAll("h1, h2");
  let section: string | undefined;
  headings.forEach((h) => {
    const rect = h.getBoundingClientRect();
    if (rect.top < 200 && rect.top > -100) {
      section = h.textContent?.trim();
    }
  });

  return { path, title, category, section };
}
