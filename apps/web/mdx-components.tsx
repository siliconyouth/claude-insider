import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { LazyCodeBlock } from "@/components/lazy-code-block";
import { ContentMeta } from "@/components/content-meta";
import { H1, H2, H3, H4, H5, H6 } from "@/components/mdx/headings";
import {
  InlineResourceLink,
  ResourceEmbed,
  ResourceGrid,
} from "@/components/mdx/InlineResourceLink";
import {
  RelatedResources,
  InlineRelatedResources,
} from "@/components/cross-linking/RelatedResources";

// Custom components for MDX rendering
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings with anchor links and Ask AI buttons
    h1: H1,
    h2: H2,
    h3: H3,
    h4: H4,
    h5: H5,
    h6: H6,

    // Custom link component for internal/external links
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith("http") || href?.startsWith("//");

      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 underline underline-offset-2"
            {...props}
          >
            {children}
            <span className="inline-block ml-1 text-xs">↗</span>
          </a>
        );
      }

      return (
        <Link
          href={href || "#"}
          className="text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 underline underline-offset-2"
          {...props}
        >
          {children}
        </Link>
      );
    },

    // Code blocks with copy button and syntax highlighting (lazy-loaded)
    pre: ({ children }) => {
      // Extract language class from the code element inside pre
      const codeElement = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
      const className = codeElement?.props?.className ?? "";
      return <LazyCodeBlock className={className}>{codeElement?.props?.children}</LazyCodeBlock>;
    },

    // Inline code (not inside pre)
    code: ({ children, className, ...props }) => {
      // If it has a language class, it's a code block (handled by pre)
      // Otherwise it's inline code
      if (className?.includes("language-")) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      return (
        <code
          className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-cyan-300 text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Blockquote/callout styling
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 dark:border-cyan-500 pl-4 my-4 text-gray-800 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-900/50 py-2 rounded-r">
        {children}
      </blockquote>
    ),

    // Table styling
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
        {children}
      </td>
    ),

    // List styling
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-2 my-4 text-gray-800 dark:text-gray-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-2 my-4 text-gray-800 dark:text-gray-300">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,

    // Horizontal rule
    hr: () => <hr className="my-8 border-gray-200 dark:border-gray-800" />,

    // Paragraph
    p: ({ children }) => (
      <p className="my-4 text-gray-800 dark:text-gray-300 leading-relaxed">{children}</p>
    ),

    // Strong/bold
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>
    ),

    // Emphasis/italic
    em: ({ children }) => <em className="italic text-gray-800 dark:text-gray-200">{children}</em>,

    // Content metadata component for sources and generation info
    ContentMeta,

    // Cross-linking components for documentation-resource integration
    // Usage: <ResourceLink id="anthropic-docs">text</ResourceLink>
    ResourceLink: InlineResourceLink,
    // Usage: <Resource id="anthropic-docs" variant="compact" />
    Resource: ResourceEmbed,
    // Usage: <ResourceGrid ids={['res1', 'res2']} columns={2} />
    ResourceGrid,
    // Usage: <RelatedResources resources={[...]} />
    RelatedResources,
    // Usage: <InlineRelatedResources resources={[...]} />
    InlineRelatedResources,

    // Spread any additional components
    ...components,
  };
}
