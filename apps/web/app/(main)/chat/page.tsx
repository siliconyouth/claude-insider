/**
 * Chat Page
 *
 * Full-screen chat experience with main site navigation.
 * Provides a dedicated page for the AI assistant with header and footer.
 */

import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ChatPageContent } from "@/components/chat/chat-page-content";

export const metadata: Metadata = {
  title: "Chat with AI Assistant | Claude Insider",
  description: "Chat with our AI assistant about Claude Code, Claude AI, and documentation. Get instant answers powered by Claude.",
  openGraph: {
    title: "Chat with AI Assistant | Claude Insider",
    description: "Chat with our AI assistant about Claude Code, Claude AI, and documentation.",
  },
};

export default function ChatPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-[#0a0a0a]">
      <Header />
      <main className="flex-1 flex flex-col">
        <ChatPageContent />
      </main>
      <Footer />
    </div>
  );
}
