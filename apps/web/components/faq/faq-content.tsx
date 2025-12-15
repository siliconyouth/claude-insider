"use client";

/**
 * FAQ Content Component
 *
 * Displays FAQs with:
 * - Category filtering
 * - Expandable answers
 * - Helpful feedback
 * - AI-powered follow-up
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useAskAI } from "../ask-ai";
import {
  getCachedFAQs,
  getFAQsByCategory,
  recordFAQFeedback,
  initializeDefaultFAQs,
  FAQ_CATEGORIES,
  type GeneratedFAQ,
} from "@/lib/faq-generator";

export function FAQContent() {
  const [faqs, setFaqs] = useState<GeneratedFAQ[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());
  const { openWithQuestion } = useAskAI();

  // Load FAQs on mount
  useEffect(() => {
    initializeDefaultFAQs();
     
    setFaqs(getCachedFAQs());
  }, []);

  // Filter FAQs by category
  useEffect(() => {
    if (activeCategory) {
       
      setFaqs(getFAQsByCategory(activeCategory));
    } else {
      setFaqs(getCachedFAQs());
    }
  }, [activeCategory]);

  // Toggle FAQ expansion
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Handle feedback
  const handleFeedback = useCallback((faqId: string, helpful: boolean) => {
    recordFAQFeedback(faqId, helpful);
    setFeedbackGiven((prev) => new Set(prev).add(faqId));
  }, []);

  // Ask AI for more details
  const handleAskMore = useCallback(
    (question: string) => {
      openWithQuestion(`Can you explain more about: ${question}`);
    },
    [openWithQuestion]
  );

  // Group FAQs by category
  const faqsByCategory = faqs.reduce(
    (acc, faq) => {
      const cat = faq.category || "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(faq);
      return acc;
    },
    {} as Record<string, GeneratedFAQ[]>
  );

  const categories = Object.keys(faqsByCategory);

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeCategory === null
              ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
              : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeCategory === cat
                ? "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            {FAQ_CATEGORIES[cat as keyof typeof FAQ_CATEGORIES] || cat}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No FAQs in this category yet.</p>
          </div>
        ) : (
          faqs.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isExpanded={expandedIds.has(faq.id)}
              hasFeedback={feedbackGiven.has(faq.id)}
              onToggle={() => toggleExpand(faq.id)}
              onFeedback={(helpful) => handleFeedback(faq.id, helpful)}
              onAskMore={() => handleAskMore(faq.question)}
            />
          ))
        )}
      </div>

      {/* Still have questions? */}
      <div
        className={cn(
          "mt-12 p-6 rounded-xl text-center",
          "bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-cyan-500/10",
          "border border-violet-500/20"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Still have questions?</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Our AI assistant can help you find answers to any question about Claude AI.
        </p>
        <button
          onClick={() => openWithQuestion("I have a question about Claude Code")}
          className={cn(
            "inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-white",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "shadow-lg shadow-blue-500/25",
            "hover:shadow-xl hover:shadow-blue-500/30",
            "hover:-translate-y-0.5 transition-all"
          )}
        >
          <SparklesIcon className="w-4 h-4" />
          Ask AI Assistant
        </button>
      </div>
    </div>
  );
}

interface FAQItemProps {
  faq: GeneratedFAQ;
  isExpanded: boolean;
  hasFeedback: boolean;
  onToggle: () => void;
  onFeedback: (helpful: boolean) => void;
  onAskMore: () => void;
}

function FAQItem({ faq, isExpanded, hasFeedback, onToggle, onFeedback, onAskMore }: FAQItemProps) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]",
        "transition-all duration-200",
        isExpanded && "ring-2 ring-violet-500/30"
      )}
    >
      {/* Question */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.question}</span>
        <ChevronIcon className={cn("w-5 h-5 text-gray-400 transition-transform", isExpanded && "rotate-180")} />
      </button>

      {/* Answer */}
      {isExpanded && (
        <div className="px-6 pb-4 border-t border-gray-200 dark:border-[#262626]">
          <div className="pt-4 text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-[#262626]">
            {/* Feedback */}
            {hasFeedback ? (
              <span className="text-sm text-gray-500">Thanks for your feedback!</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Was this helpful?</span>
                <button
                  onClick={() => onFeedback(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                  aria-label="Yes, helpful"
                >
                  <ThumbsUpIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onFeedback(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  aria-label="No, not helpful"
                >
                  <ThumbsDownIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Ask more */}
            <button
              onClick={onAskMore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              Ask AI for more
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ThumbsUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
      />
    </svg>
  );
}

function ThumbsDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}
