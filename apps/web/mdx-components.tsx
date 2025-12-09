import type { MDXComponents } from "mdx/types";
import Link from "next/link";

// Custom components for MDX rendering
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings with anchor links
    h1: ({ children, id }) => (
      <h1 id={id} className="group scroll-mt-24">
        {children}
        {id && (
          <a
            href={`#${id}`}
            className="ml-2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Link to this section"
          >
            #
          </a>
        )}
      </h1>
    ),
    h2: ({ children, id }) => (
      <h2 id={id} className="group scroll-mt-24">
        {children}
        {id && (
          <a
            href={`#${id}`}
            className="ml-2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Link to this section"
          >
            #
          </a>
        )}
      </h2>
    ),
    h3: ({ children, id }) => (
      <h3 id={id} className="group scroll-mt-24">
        {children}
        {id && (
          <a
            href={`#${id}`}
            className="ml-2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
            className="text-orange-400 hover:text-orange-300 underline underline-offset-2"
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
          className="text-orange-400 hover:text-orange-300 underline underline-offset-2"
          {...props}
        >
          {children}
        </Link>
      );
    },

    // Code blocks with styling
    pre: ({ children, ...props }) => (
      <pre
        className="relative overflow-x-auto rounded-lg bg-gray-900 border border-gray-800 p-4 my-4"
        {...props}
      >
        {children}
      </pre>
    ),

    // Inline code
    code: ({ children, className, ...props }) => {
      // Check if this is inside a pre (code block) or inline
      const isCodeBlock = className?.includes("language-");

      if (isCodeBlock) {
        return (
          <code className={`${className} text-sm`} {...props}>
            {children}
          </code>
        );
      }

      return (
        <code
          className="px-1.5 py-0.5 rounded bg-gray-800 text-orange-300 text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Blockquote/callout styling
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-orange-500 pl-4 my-4 text-gray-300 italic bg-gray-900/50 py-2 rounded-r">
        {children}
      </blockquote>
    ),

    // Table styling
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-800 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="px-4 py-2 bg-gray-800 text-left text-sm font-semibold text-gray-200 border-b border-gray-700">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-2 text-sm text-gray-300 border-b border-gray-800">
        {children}
      </td>
    ),

    // List styling
    ul: ({ children }) => (
      <ul className="list-disc list-inside space-y-2 my-4 text-gray-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-2 my-4 text-gray-300">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,

    // Horizontal rule
    hr: () => <hr className="my-8 border-gray-800" />,

    // Paragraph
    p: ({ children }) => (
      <p className="my-4 text-gray-300 leading-relaxed">{children}</p>
    ),

    // Strong/bold
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-100">{children}</strong>
    ),

    // Emphasis/italic
    em: ({ children }) => <em className="italic text-gray-200">{children}</em>,

    // Spread any additional components
    ...components,
  };
}
