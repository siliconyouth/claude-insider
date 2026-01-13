/**
 * EditOnGitHub Component Tests
 *
 * Tests for the GitHub edit link component.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditOnGitHub } from "@/components/edit-on-github";

describe("EditOnGitHub", () => {
  const REPO_URL = "https://github.com/siliconyouth/claude-insider";

  describe("Rendering", () => {
    it("should render a link element", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
    });

    it("should display 'Edit this page on GitHub' text", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      expect(screen.getByText("Edit this page on GitHub")).toBeInTheDocument();
    });

    it("should render GitHub icon", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("URL Generation", () => {
    it("should generate correct edit URL", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `${REPO_URL}/edit/main/content/docs/example.mdx`
      );
    });

    it("should handle nested file paths", () => {
      render(<EditOnGitHub filePath="apps/web/content/docs/getting-started/install.mdx" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `${REPO_URL}/edit/main/apps/web/content/docs/getting-started/install.mdx`
      );
    });

    it("should handle root-level files", () => {
      render(<EditOnGitHub filePath="README.md" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", `${REPO_URL}/edit/main/README.md`);
    });

    it("should handle TypeScript files", () => {
      render(<EditOnGitHub filePath="lib/utils.ts" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", `${REPO_URL}/edit/main/lib/utils.ts`);
    });

    it("should handle files with special characters", () => {
      render(<EditOnGitHub filePath="content/docs/what's-new.mdx" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `${REPO_URL}/edit/main/content/docs/what's-new.mdx`
      );
    });
  });

  describe("Link Attributes", () => {
    it("should open in new tab", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("should have noopener noreferrer for security", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("Styling", () => {
    it("should have inline-flex class for layout", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("inline-flex");
    });

    it("should have items-center for alignment", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("items-center");
    });

    it("should have gap for spacing between icon and text", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("gap-2");
    });

    it("should have text-sm for font size", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("text-sm");
    });

    it("should have transition-colors for hover effect", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const link = screen.getByRole("link");
      expect(link).toHaveClass("transition-colors");
    });
  });

  describe("Icon", () => {
    it("should have 4x4 size classes", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const svg = document.querySelector("svg");
      expect(svg).toHaveClass("w-4");
      expect(svg).toHaveClass("h-4");
    });

    it("should have currentColor fill for theming", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const svg = document.querySelector("svg");
      expect(svg).toHaveAttribute("fill", "currentColor");
    });

    it("should have proper viewBox", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const svg = document.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    });
  });

  describe("Accessibility", () => {
    it("should have accessible link text", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const link = screen.getByRole("link", { name: /edit this page on github/i });
      expect(link).toBeInTheDocument();
    });

    it("should have hidden decorative icon", () => {
      render(<EditOnGitHub filePath="content/docs/example.mdx" />);

      const svg = document.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty file path", () => {
      render(<EditOnGitHub filePath="" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", `${REPO_URL}/edit/main/`);
    });

    it("should handle path with leading slash", () => {
      render(<EditOnGitHub filePath="/content/docs/example.mdx" />);

      const link = screen.getByRole("link");
      // Will create URL with double slash - this tests current behavior
      expect(link).toHaveAttribute(
        "href",
        `${REPO_URL}/edit/main//content/docs/example.mdx`
      );
    });

    it("should handle path with spaces", () => {
      render(<EditOnGitHub filePath="content/docs/my file.mdx" />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `${REPO_URL}/edit/main/content/docs/my file.mdx`
      );
    });
  });
});
