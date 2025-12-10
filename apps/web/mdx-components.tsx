import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { ContentMeta } from "@/components/content-meta";

// Custom components for MDX rendering
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings with anchor links
    h1: ({ children, id }) => (
      <h1 id={id} className="group scroll-mt-24 text-gray-900 dark:text-white">
        {children}
        {id && (
          <a
            href={`#${id}`}
            className="ml-2 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Link to this section"
          >
            #
          </a>
        )}
      </h1>
    ),
    h2: ({ children, id }) => (
      <h2 id={id} className="group scroll-mt-24 text-gray-900 dark:text-white">
        {children}
        {id && (
          <a
            href={`#${id}`}
            className="ml-2 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Link to this section"
          >
            #
          </a>
        )}
      </h2>
    ),
    h3: ({ children, id }) => (
      <h3 id={id} className="group scroll-mt-24 text-gray-900 dark:text-white">
        {children}
        {id && (
          <a
            href={`#${id}`}
            className="ml-2 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Link to this section"
          >
            #
          </a>
        )}
      </h3>
    ),

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

    // Code blocks with copy button and syntax highlighting
    pre: ({ children }) => {
      // Extract language class from the code element inside pre
      const codeElement = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
      const className = codeElement?.props?.className ?? "";
      return <CodeBlock className={className}>{codeElement?.props?.children}</CodeBlock>;
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
          className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-orange-300 text-sm font-mono"
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

    // Spread any additional components
    ...components,
  };
}
