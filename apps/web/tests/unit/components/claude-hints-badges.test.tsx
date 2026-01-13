/**
 * ClaudeHintsBadges Component Tests
 *
 * Tests for the Claude hints badges component:
 * - Null hints handling
 * - Score display and color coding
 * - Feature badges
 * - Model badges
 * - Token display
 * - Three variants: inline, compact, detailed
 * - Improvement suggestions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClaudeHintsBadges } from "@/components/prompts/claude-hints-badges";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

describe("ClaudeHintsBadges", () => {
  const mockHints = {
    uses_xml_tags: true,
    uses_thinking_section: true,
    uses_examples: false,
    uses_chain_of_thought: true,
    uses_system_context: false,
    uses_output_format: true,
    structure_score: 85,
    clarity_score: 90,
    specificity_score: 75,
    overall_optimization_score: 83,
    recommended_model: "sonnet" as const,
    estimated_tokens: 1500,
    complexity_level: "moderate" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Null Hints", () => {
    it("should return null when hints is null", () => {
      const { container } = render(<ClaudeHintsBadges hints={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Score Display", () => {
    it("should show score when showScore is true", () => {
      render(<ClaudeHintsBadges hints={mockHints} showScore={true} />);
      expect(screen.getByText("83")).toBeInTheDocument();
    });

    it("should show /100 suffix", () => {
      render(<ClaudeHintsBadges hints={mockHints} showScore={true} />);
      expect(screen.getByText("/100")).toBeInTheDocument();
    });

    it("should not show score when showScore is false", () => {
      render(<ClaudeHintsBadges hints={mockHints} showScore={false} />);
      expect(screen.queryByText("83")).not.toBeInTheDocument();
    });

    it("should not show score when score is 0", () => {
      const noScoreHints = { ...mockHints, overall_optimization_score: 0 };
      render(<ClaudeHintsBadges hints={noScoreHints} showScore={true} />);
      // Score section should not be rendered when score is 0
      expect(screen.queryByText("/100")).not.toBeInTheDocument();
    });
  });

  describe("Score Color Coding", () => {
    it("should have emerald color for score >= 80", () => {
      const { container } = render(
        <ClaudeHintsBadges hints={{ ...mockHints, overall_optimization_score: 85 }} />
      );
      expect(container.querySelector(".text-emerald-500")).toBeInTheDocument();
    });

    it("should have blue color for score 60-79", () => {
      const { container } = render(
        <ClaudeHintsBadges hints={{ ...mockHints, overall_optimization_score: 70 }} />
      );
      expect(container.querySelector(".text-blue-500")).toBeInTheDocument();
    });

    it("should have amber color for score 40-59", () => {
      const { container } = render(
        <ClaudeHintsBadges hints={{ ...mockHints, overall_optimization_score: 50 }} />
      );
      expect(container.querySelector(".text-amber-500")).toBeInTheDocument();
    });

    it("should have red color for score < 40", () => {
      const { container } = render(
        <ClaudeHintsBadges hints={{ ...mockHints, overall_optimization_score: 30 }} />
      );
      expect(container.querySelector(".text-red-500")).toBeInTheDocument();
    });
  });

  describe("Model Badge", () => {
    it("should show Sonnet badge by default", () => {
      render(<ClaudeHintsBadges hints={mockHints} showModel={true} />);
      expect(screen.getByText("Sonnet")).toBeInTheDocument();
    });

    it("should show Opus badge when recommended", () => {
      const opusHints = { ...mockHints, recommended_model: "opus" as const };
      render(<ClaudeHintsBadges hints={opusHints} showModel={true} />);
      expect(screen.getByText("Opus")).toBeInTheDocument();
    });

    it("should show Haiku badge when recommended", () => {
      const haikuHints = { ...mockHints, recommended_model: "haiku" as const };
      render(<ClaudeHintsBadges hints={haikuHints} showModel={true} />);
      expect(screen.getByText("Haiku")).toBeInTheDocument();
    });

    it("should not show model badge when showModel is false", () => {
      render(<ClaudeHintsBadges hints={mockHints} showModel={false} />);
      expect(screen.queryByText("Sonnet")).not.toBeInTheDocument();
    });

    it("should default to Sonnet for unknown model", () => {
      const unknownHints = { ...mockHints, recommended_model: "unknown" };
      render(<ClaudeHintsBadges hints={unknownHints} showModel={true} />);
      expect(screen.getByText("Sonnet")).toBeInTheDocument();
    });
  });

  describe("Feature Badges", () => {
    it("should show active feature badges", () => {
      render(<ClaudeHintsBadges hints={mockHints} showFeatures={true} />);
      // mockHints has 4 active features: xml_tags, thinking_section, chain_of_thought, output_format
      expect(screen.getByTitle("XML Tags")).toBeInTheDocument();
      expect(screen.getByTitle("Thinking")).toBeInTheDocument();
    });

    it("should not show inactive feature badges in compact mode", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="compact" showFeatures={true} />);
      // Examples and Context are false in mockHints
      expect(screen.queryByTitle("Examples")).not.toBeInTheDocument();
      expect(screen.queryByTitle("Context")).not.toBeInTheDocument();
    });

    it("should show max 3 features in compact mode with +N indicator", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="compact" showFeatures={true} />);
      // mockHints has 4 active features, so should show +1
      expect(screen.getByText("+1")).toBeInTheDocument();
    });

    it("should not show feature badges when showFeatures is false", () => {
      render(<ClaudeHintsBadges hints={mockHints} showFeatures={false} />);
      expect(screen.queryByTitle("XML Tags")).not.toBeInTheDocument();
    });
  });

  describe("Inline Variant", () => {
    it("should render inline variant", () => {
      const { container } = render(
        <ClaudeHintsBadges hints={mockHints} variant="inline" />
      );
      expect(container.firstChild).toHaveClass("flex", "items-center");
    });

    it("should show score percentage in inline variant", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="inline" showScore={true} />);
      expect(screen.getByText("83%")).toBeInTheDocument();
    });

    it("should show optimizations count in inline variant", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="inline" showFeatures={true} />);
      expect(screen.getByText("4 optimizations")).toBeInTheDocument();
    });
  });

  describe("Compact Variant", () => {
    it("should render compact variant", () => {
      const { container } = render(
        <ClaudeHintsBadges hints={mockHints} variant="compact" />
      );
      expect(container.firstChild).toHaveClass("flex", "items-center");
    });

    it("should show score with /100 in compact variant", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="compact" showScore={true} />);
      expect(screen.getByText("83")).toBeInTheDocument();
      expect(screen.getByText("/100")).toBeInTheDocument();
    });
  });

  describe("Detailed Variant", () => {
    it("should render detailed variant", () => {
      const { container } = render(
        <ClaudeHintsBadges hints={mockHints} variant="detailed" />
      );
      expect(container.firstChild).toHaveClass("space-y-4");
    });

    it("should show Optimization Score label", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="detailed" showScore={true} />);
      expect(screen.getByText("Optimization Score")).toBeInTheDocument();
    });

    it("should show score breakdown in detailed variant", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="detailed" showScore={true} />);
      expect(screen.getByText("Structure")).toBeInTheDocument();
      expect(screen.getByText("Clarity")).toBeInTheDocument();
      expect(screen.getByText("Specificity")).toBeInTheDocument();
    });

    it("should show structure score value", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="detailed" showScore={true} />);
      expect(screen.getByText("85")).toBeInTheDocument(); // structure_score
    });

    it("should show Claude Best Practices heading in detailed variant", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="detailed" showFeatures={true} />);
      expect(screen.getByText("Claude Best Practices")).toBeInTheDocument();
    });

    it("should show all feature badges in detailed variant", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="detailed" showFeatures={true} />);
      // All 6 features should be visible
      expect(screen.getByText("XML Tags")).toBeInTheDocument();
      expect(screen.getByText("Thinking")).toBeInTheDocument();
      expect(screen.getByText("Examples")).toBeInTheDocument();
      expect(screen.getByText("Chain of Thought")).toBeInTheDocument();
      expect(screen.getByText("Context")).toBeInTheDocument();
      expect(screen.getByText("Output Format")).toBeInTheDocument();
    });

    it("should show Recommended label with model", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="detailed" showModel={true} />);
      expect(screen.getByText("Recommended:")).toBeInTheDocument();
      expect(screen.getByText(/Claude Sonnet/)).toBeInTheDocument();
    });

    it("should show complexity level", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="detailed" />);
      expect(screen.getByText(/Complexity:/)).toBeInTheDocument();
      expect(screen.getByText("moderate")).toBeInTheDocument();
    });
  });

  describe("Token Display", () => {
    it("should show tokens when showTokens is true in detailed variant", () => {
      render(
        <ClaudeHintsBadges hints={mockHints} variant="detailed" showTokens={true} />
      );
      expect(screen.getByText(/1,500 tokens/)).toBeInTheDocument();
    });

    it("should not show tokens when showTokens is false", () => {
      render(
        <ClaudeHintsBadges hints={mockHints} variant="detailed" showTokens={false} />
      );
      expect(screen.queryByText(/tokens/)).not.toBeInTheDocument();
    });

    it("should not show tokens when estimated_tokens is 0", () => {
      const noTokenHints = { ...mockHints, estimated_tokens: 0 };
      render(
        <ClaudeHintsBadges hints={noTokenHints} variant="detailed" showTokens={true} />
      );
      expect(screen.queryByText(/tokens/)).not.toBeInTheDocument();
    });
  });

  describe("Improvement Suggestions", () => {
    const hintsWithSuggestions = {
      ...mockHints,
      improvement_suggestions: [
        {
          type: "add_examples",
          description: "Add 2-3 examples to clarify expected output",
          priority: "high" as const,
        },
        {
          type: "structure_improvement",
          description: "Consider using XML tags for sections",
          priority: "medium" as const,
        },
        {
          type: "minor_tweak",
          description: "Add output format specification",
          priority: "low" as const,
        },
      ],
    };

    it("should show suggestions section in detailed variant", () => {
      render(
        <ClaudeHintsBadges hints={hintsWithSuggestions} variant="detailed" />
      );
      expect(screen.getByText("Suggestions for Improvement")).toBeInTheDocument();
    });

    it("should show all suggestion descriptions", () => {
      render(
        <ClaudeHintsBadges hints={hintsWithSuggestions} variant="detailed" />
      );
      expect(screen.getByText("Add 2-3 examples to clarify expected output")).toBeInTheDocument();
      expect(screen.getByText("Consider using XML tags for sections")).toBeInTheDocument();
      expect(screen.getByText("Add output format specification")).toBeInTheDocument();
    });

    it("should show priority badges", () => {
      render(
        <ClaudeHintsBadges hints={hintsWithSuggestions} variant="detailed" />
      );
      expect(screen.getByText("high")).toBeInTheDocument();
      expect(screen.getByText("medium")).toBeInTheDocument();
      expect(screen.getByText("low")).toBeInTheDocument();
    });

    it("should format suggestion type", () => {
      render(
        <ClaudeHintsBadges hints={hintsWithSuggestions} variant="detailed" />
      );
      expect(screen.getByText("add examples")).toBeInTheDocument();
      expect(screen.getByText("structure improvement")).toBeInTheDocument();
    });

    it("should not show suggestions section when empty", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="detailed" />);
      expect(screen.queryByText("Suggestions for Improvement")).not.toBeInTheDocument();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <ClaudeHintsBadges hints={mockHints} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Default Props", () => {
    it("should default to compact variant", () => {
      const { container } = render(<ClaudeHintsBadges hints={mockHints} />);
      // Compact variant has flex items-center
      expect(container.firstChild).toHaveClass("flex", "items-center");
    });

    it("should show score by default", () => {
      render(<ClaudeHintsBadges hints={mockHints} />);
      expect(screen.getByText("83")).toBeInTheDocument();
    });

    it("should show features by default", () => {
      render(<ClaudeHintsBadges hints={mockHints} />);
      expect(screen.getByTitle("XML Tags")).toBeInTheDocument();
    });

    it("should show model by default", () => {
      render(<ClaudeHintsBadges hints={mockHints} />);
      expect(screen.getByText("Sonnet")).toBeInTheDocument();
    });

    it("should not show tokens by default", () => {
      render(<ClaudeHintsBadges hints={mockHints} variant="detailed" />);
      expect(screen.queryByText(/tokens/)).not.toBeInTheDocument();
    });
  });
});
