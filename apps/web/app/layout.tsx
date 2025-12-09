import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Claude Insider - Tips, Tricks & Documentation for Claude AI",
  description:
    "Your comprehensive resource for Claude AI documentation, tips, tricks, configuration guides, and setup instructions. Built with Claude Code powered by Claude Opus 4.5.",
  keywords: [
    "Claude AI",
    "Claude Code",
    "Anthropic",
    "AI documentation",
    "Claude tips",
    "Claude tricks",
    "Claude configuration",
    "MCP servers",
    "Claude API",
  ],
  authors: [{ name: "Claude Insider" }],
  openGraph: {
    title: "Claude Insider - Tips, Tricks & Documentation for Claude AI",
    description:
      "Your comprehensive resource for Claude AI documentation, tips, tricks, and setup instructions.",
    url: "https://claude-insider.vercel.app",
    siteName: "Claude Insider",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Claude Insider",
    description:
      "Your comprehensive resource for Claude AI documentation, tips, tricks, and setup instructions.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-gray-950 text-gray-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
