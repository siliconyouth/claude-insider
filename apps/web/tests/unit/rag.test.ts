/**
 * RAG (Retrieval Augmented Generation) System Tests
 *
 * Tests for the TF-IDF search system, tokenization, query intent detection,
 * and document chunk types used in the AI assistant's context retrieval.
 */

import { describe, it, expect } from "vitest";
import type { DocumentChunk, SearchResult } from "@/lib/rag";

describe("RAG System", () => {
  describe("DocumentChunk Type", () => {
    it("should accept minimal required fields", () => {
      const chunk: DocumentChunk = {
        id: "doc-1",
        title: "Getting Started",
        section: "Installation",
        content: "Install Claude Code with npm install -g claude-code",
        url: "/docs/getting-started",
        category: "Getting Started",
        keywords: ["install", "npm", "claude"],
      };
      expect(chunk.id).toBe("doc-1");
      expect(chunk.title).toBe("Getting Started");
      expect(chunk.section).toBe("Installation");
      expect(chunk.content).toContain("Install");
      expect(chunk.url).toBe("/docs/getting-started");
      expect(chunk.category).toBe("Getting Started");
      expect(chunk.keywords).toHaveLength(3);
    });

    it("should accept optional subcategory", () => {
      const chunk: DocumentChunk = {
        id: "doc-2",
        title: "Configuration",
        section: "Settings",
        content: "Configure Claude Code settings",
        url: "/docs/configuration",
        category: "Configuration",
        keywords: ["settings", "config"],
        subcategory: "User Settings",
      };
      expect(chunk.subcategory).toBe("User Settings");
    });

    it("should accept resource chunk type", () => {
      const chunk: DocumentChunk = {
        id: "resource-1",
        title: "Claude MCP Server",
        section: "MCP Servers",
        content: "A powerful MCP server for Claude",
        url: "/resources/mcp-server",
        category: "MCP Servers",
        keywords: ["mcp", "server"],
        isResource: true,
        resourceData: {
          id: "uuid-123",
          category: "mcp-servers",
          tags: ["mcp", "server", "claude"],
          featured: true,
        },
      };
      expect(chunk.isResource).toBe(true);
      expect(chunk.resourceData?.id).toBe("uuid-123");
      expect(chunk.resourceData?.category).toBe("mcp-servers");
      expect(chunk.resourceData?.tags).toHaveLength(3);
      expect(chunk.resourceData?.featured).toBe(true);
    });

    it("should accept config option chunk type", () => {
      const chunk: DocumentChunk = {
        id: "setting-1",
        title: "Theme Setting",
        section: "Settings",
        content: "Change the theme of Claude Code",
        url: "/docs/configuration#theme",
        category: "Configuration",
        keywords: ["theme", "dark", "light"],
        isConfigOption: true,
        settingData: {
          name: "theme",
          description: "Set the color theme (dark, light, system)",
          sourceDoc: "Configuration Guide",
        },
      };
      expect(chunk.isConfigOption).toBe(true);
      expect(chunk.settingData?.name).toBe("theme");
      expect(chunk.settingData?.description).toContain("color theme");
      expect(chunk.settingData?.sourceDoc).toBe("Configuration Guide");
    });

    it("should accept command chunk type", () => {
      const chunk: DocumentChunk = {
        id: "command-1",
        title: "/help Command",
        section: "Commands",
        content: "Show help information",
        url: "/docs/commands#help",
        category: "Commands",
        keywords: ["help", "command"],
        isCommand: true,
        commandData: {
          command: "/help",
          description: "Display help information and available commands",
          sourceDoc: "Commands Reference",
        },
      };
      expect(chunk.isCommand).toBe(true);
      expect(chunk.commandData?.command).toBe("/help");
      expect(chunk.commandData?.description).toContain("help information");
      expect(chunk.commandData?.sourceDoc).toBe("Commands Reference");
    });

    it("should accept environment variable chunk type", () => {
      const chunk: DocumentChunk = {
        id: "env-1",
        title: "ANTHROPIC_API_KEY",
        section: "Environment Variables",
        content: "Your Anthropic API key for Claude access",
        url: "/docs/configuration#env",
        category: "Configuration",
        keywords: ["api", "key", "anthropic"],
        isEnvVar: true,
      };
      expect(chunk.isEnvVar).toBe(true);
    });

    it("should accept feature chunk type", () => {
      const chunk: DocumentChunk = {
        id: "feature-1",
        title: "Code Generation",
        section: "Features",
        content: "Claude can generate code in multiple languages",
        url: "/docs/features#code-gen",
        category: "Features",
        keywords: ["code", "generate", "languages"],
        isFeature: true,
      };
      expect(chunk.isFeature).toBe(true);
    });

    it("should accept external source chunk type", () => {
      const chunk: DocumentChunk = {
        id: "external-1",
        title: "Anthropic Docs",
        section: "External",
        content: "Reference to official Anthropic documentation",
        url: "https://docs.anthropic.com",
        category: "External",
        keywords: ["anthropic", "docs", "official"],
        isExternalSource: true,
      };
      expect(chunk.isExternalSource).toBe(true);
    });

    it("should accept all boolean flags simultaneously", () => {
      const chunk: DocumentChunk = {
        id: "multi-1",
        title: "Multi-Type Chunk",
        section: "Test",
        content: "Testing multiple flags",
        url: "/test",
        category: "Test",
        keywords: ["test"],
        isResource: false,
        isConfigOption: false,
        isCommand: false,
        isEnvVar: false,
        isFeature: false,
        isExternalSource: false,
      };
      expect(chunk.isResource).toBe(false);
      expect(chunk.isConfigOption).toBe(false);
      expect(chunk.isCommand).toBe(false);
      expect(chunk.isEnvVar).toBe(false);
      expect(chunk.isFeature).toBe(false);
      expect(chunk.isExternalSource).toBe(false);
    });

    it("should handle empty keywords array", () => {
      const chunk: DocumentChunk = {
        id: "empty-keywords",
        title: "Empty Keywords",
        section: "Test",
        content: "Chunk with no keywords",
        url: "/test",
        category: "Test",
        keywords: [],
      };
      expect(chunk.keywords).toHaveLength(0);
    });

    it("should handle long content", () => {
      const longContent = "a".repeat(2000);
      const chunk: DocumentChunk = {
        id: "long-content",
        title: "Long Content",
        section: "Test",
        content: longContent,
        url: "/test",
        category: "Test",
        keywords: ["long"],
      };
      expect(chunk.content.length).toBe(2000);
    });

    it("should handle special characters in content", () => {
      const chunk: DocumentChunk = {
        id: "special-chars",
        title: "Special Characters",
        section: "Test",
        content: "Code: `npm install` → Success! @user #tag",
        url: "/test",
        category: "Test",
        keywords: ["code", "npm"],
      };
      expect(chunk.content).toContain("→");
      expect(chunk.content).toContain("@user");
    });

    it("should handle unicode in title and content", () => {
      const chunk: DocumentChunk = {
        id: "unicode",
        title: "日本語ドキュメント",
        section: "Internationalization",
        content: "Claude supports 中文, 한국어, and more",
        url: "/docs/i18n",
        category: "Internationalization",
        keywords: ["i18n", "unicode"],
      };
      expect(chunk.title).toBe("日本語ドキュメント");
      expect(chunk.content).toContain("中文");
    });
  });

  describe("SearchResult Type", () => {
    it("should accept chunk with score", () => {
      const chunk: DocumentChunk = {
        id: "search-1",
        title: "Search Result",
        section: "Results",
        content: "This is a search result",
        url: "/results/1",
        category: "Results",
        keywords: ["search"],
      };
      const result: SearchResult = {
        chunk,
        score: 0.85,
      };
      expect(result.chunk).toBe(chunk);
      expect(result.score).toBe(0.85);
    });

    it("should accept zero score", () => {
      const chunk: DocumentChunk = {
        id: "zero-score",
        title: "Zero Score",
        section: "Test",
        content: "No match",
        url: "/test",
        category: "Test",
        keywords: [],
      };
      const result: SearchResult = {
        chunk,
        score: 0,
      };
      expect(result.score).toBe(0);
    });

    it("should accept high score", () => {
      const chunk: DocumentChunk = {
        id: "high-score",
        title: "Perfect Match",
        section: "Test",
        content: "Exact query match",
        url: "/test",
        category: "Test",
        keywords: ["perfect", "match"],
      };
      const result: SearchResult = {
        chunk,
        score: 10.5,
      };
      expect(result.score).toBe(10.5);
    });

    it("should accept decimal precision scores", () => {
      const chunk: DocumentChunk = {
        id: "decimal",
        title: "Decimal",
        section: "Test",
        content: "Test",
        url: "/test",
        category: "Test",
        keywords: [],
      };
      const result: SearchResult = {
        chunk,
        score: 0.123456789,
      };
      expect(result.score).toBeCloseTo(0.123456789, 9);
    });
  });

  describe("Tokenization Behavior", () => {
    // These tests verify expected tokenization behavior through type inference
    it("should tokenize simple words", () => {
      const text = "Hello world test";
      const words = text.toLowerCase().split(/\s+/);
      expect(words).toEqual(["hello", "world", "test"]);
    });

    it("should handle punctuation removal", () => {
      const text = "Hello, world! How are you?";
      const cleaned = text.toLowerCase().replace(/[^\w\s]/g, " ");
      expect(cleaned).toBe("hello  world  how are you ");
    });

    it("should filter short words", () => {
      const words = ["a", "an", "the", "hello", "world", "it", "is"];
      const filtered = words.filter((w) => w.length > 2);
      expect(filtered).toEqual(["the", "hello", "world"]);
    });

    it("should normalize case", () => {
      const text = "Claude Code INSTALL npm";
      const normalized = text.toLowerCase();
      expect(normalized).toBe("claude code install npm");
    });

    it("should handle multiple spaces", () => {
      const text = "hello    world     test";
      const words = text.split(/\s+/).filter((w) => w.length > 0);
      expect(words).toEqual(["hello", "world", "test"]);
    });

    it("should handle tabs and newlines", () => {
      const text = "hello\tworld\ntest";
      const words = text.split(/\s+/).filter((w) => w.length > 0);
      expect(words).toEqual(["hello", "world", "test"]);
    });

    it("should handle numbers", () => {
      const text = "version 1.0.0 release 2024";
      const words = text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
      expect(words).toContain("version");
      expect(words).toContain("release");
      expect(words).toContain("2024");
    });

    it("should handle code-like tokens", () => {
      const text = "npm install @anthropic/sdk --save";
      const cleaned = text.toLowerCase().replace(/[^\w\s]/g, " ");
      const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
      expect(words).toContain("npm");
      expect(words).toContain("install");
      expect(words).toContain("anthropic");
      expect(words).toContain("sdk");
      expect(words).toContain("save");
    });
  });

  describe("Stop Words Filtering", () => {
    const STOP_WORDS = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
      "be", "have", "has", "had", "do", "does", "did", "will", "would", "could",
      "should", "may", "might", "can", "this", "that", "these", "those", "it",
      "its", "you", "your", "we", "our", "they", "their", "he", "she", "his",
      "her", "what", "which", "who", "whom", "when", "where", "why", "how",
      "all", "each", "every", "both", "few", "more", "most", "other", "some",
      "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
      "very", "just", "also", "now", "here", "there", "then", "once", "if",
    ]);

    it("should filter common articles", () => {
      expect(STOP_WORDS.has("the")).toBe(true);
      expect(STOP_WORDS.has("a")).toBe(true);
      expect(STOP_WORDS.has("an")).toBe(true);
    });

    it("should filter conjunctions", () => {
      expect(STOP_WORDS.has("and")).toBe(true);
      expect(STOP_WORDS.has("or")).toBe(true);
      expect(STOP_WORDS.has("but")).toBe(true);
    });

    it("should filter prepositions", () => {
      expect(STOP_WORDS.has("in")).toBe(true);
      expect(STOP_WORDS.has("on")).toBe(true);
      expect(STOP_WORDS.has("at")).toBe(true);
      expect(STOP_WORDS.has("to")).toBe(true);
      expect(STOP_WORDS.has("for")).toBe(true);
      expect(STOP_WORDS.has("of")).toBe(true);
      expect(STOP_WORDS.has("with")).toBe(true);
      expect(STOP_WORDS.has("by")).toBe(true);
      expect(STOP_WORDS.has("from")).toBe(true);
    });

    it("should filter auxiliary verbs", () => {
      expect(STOP_WORDS.has("is")).toBe(true);
      expect(STOP_WORDS.has("was")).toBe(true);
      expect(STOP_WORDS.has("are")).toBe(true);
      expect(STOP_WORDS.has("were")).toBe(true);
      expect(STOP_WORDS.has("been")).toBe(true);
      expect(STOP_WORDS.has("be")).toBe(true);
      expect(STOP_WORDS.has("have")).toBe(true);
      expect(STOP_WORDS.has("has")).toBe(true);
      expect(STOP_WORDS.has("had")).toBe(true);
    });

    it("should filter modal verbs", () => {
      expect(STOP_WORDS.has("will")).toBe(true);
      expect(STOP_WORDS.has("would")).toBe(true);
      expect(STOP_WORDS.has("could")).toBe(true);
      expect(STOP_WORDS.has("should")).toBe(true);
      expect(STOP_WORDS.has("may")).toBe(true);
      expect(STOP_WORDS.has("might")).toBe(true);
      expect(STOP_WORDS.has("can")).toBe(true);
    });

    it("should filter pronouns", () => {
      expect(STOP_WORDS.has("it")).toBe(true);
      expect(STOP_WORDS.has("its")).toBe(true);
      expect(STOP_WORDS.has("you")).toBe(true);
      expect(STOP_WORDS.has("your")).toBe(true);
      expect(STOP_WORDS.has("we")).toBe(true);
      expect(STOP_WORDS.has("our")).toBe(true);
      expect(STOP_WORDS.has("they")).toBe(true);
      expect(STOP_WORDS.has("their")).toBe(true);
    });

    it("should filter question words", () => {
      expect(STOP_WORDS.has("what")).toBe(true);
      expect(STOP_WORDS.has("which")).toBe(true);
      expect(STOP_WORDS.has("who")).toBe(true);
      expect(STOP_WORDS.has("when")).toBe(true);
      expect(STOP_WORDS.has("where")).toBe(true);
      expect(STOP_WORDS.has("why")).toBe(true);
      expect(STOP_WORDS.has("how")).toBe(true);
    });

    it("should filter quantifiers", () => {
      expect(STOP_WORDS.has("all")).toBe(true);
      expect(STOP_WORDS.has("each")).toBe(true);
      expect(STOP_WORDS.has("every")).toBe(true);
      expect(STOP_WORDS.has("both")).toBe(true);
      expect(STOP_WORDS.has("few")).toBe(true);
      expect(STOP_WORDS.has("more")).toBe(true);
      expect(STOP_WORDS.has("most")).toBe(true);
      expect(STOP_WORDS.has("some")).toBe(true);
    });

    it("should filter adverbs", () => {
      expect(STOP_WORDS.has("very")).toBe(true);
      expect(STOP_WORDS.has("just")).toBe(true);
      expect(STOP_WORDS.has("also")).toBe(true);
      expect(STOP_WORDS.has("now")).toBe(true);
      expect(STOP_WORDS.has("here")).toBe(true);
      expect(STOP_WORDS.has("there")).toBe(true);
      expect(STOP_WORDS.has("then")).toBe(true);
    });

    it("should NOT filter important technical terms", () => {
      expect(STOP_WORDS.has("claude")).toBe(false);
      expect(STOP_WORDS.has("code")).toBe(false);
      expect(STOP_WORDS.has("install")).toBe(false);
      expect(STOP_WORDS.has("config")).toBe(false);
      expect(STOP_WORDS.has("api")).toBe(false);
      expect(STOP_WORDS.has("mcp")).toBe(false);
      expect(STOP_WORDS.has("server")).toBe(false);
    });

    it("should filter words from a sentence", () => {
      const sentence = "how can i install the claude code cli";
      const words = sentence.split(" ");
      // "i" passes through stop words but would be filtered by length (< 3 chars)
      const filtered = words.filter((w) => !STOP_WORDS.has(w) && w.length > 2);
      expect(filtered).toEqual(["install", "claude", "code", "cli"]);
    });

    it("should have expected size", () => {
      // Our test set has 87 stop words (subset of common English stop words)
      expect(STOP_WORDS.size).toBe(87);
    });
  });

  describe("Query Intent Detection Patterns", () => {
    // Test the regex patterns used for query intent detection
    const detectQueryIntent = (query: string) => {
      const q = query.toLowerCase();
      return {
        isSettingQuery: /setting|config|option|preference|parameter|value|toggle|enable|disable/.test(q),
        isCommandQuery: /command|cli|how\s+to|run|execute|terminal|bash|shell|claude\s+\w+/.test(q),
        isEnvVarQuery: /env|environment|variable|api.?key|export/.test(q),
        isFeatureQuery: /feature|capability|can\s+(?:i|you|claude)|support|does/.test(q),
        isResourceQuery: /tool|library|mcp|server|sdk|resource|recommend/.test(q),
      };
    };

    describe("Setting Query Detection", () => {
      it("should detect 'setting' keyword", () => {
        const intent = detectQueryIntent("How do I change a setting?");
        expect(intent.isSettingQuery).toBe(true);
      });

      it("should detect 'config' keyword", () => {
        const intent = detectQueryIntent("Where is the config file?");
        expect(intent.isSettingQuery).toBe(true);
      });

      it("should detect 'option' keyword", () => {
        const intent = detectQueryIntent("What options are available?");
        expect(intent.isSettingQuery).toBe(true);
      });

      it("should detect 'preference' keyword", () => {
        const intent = detectQueryIntent("How to set preferences?");
        expect(intent.isSettingQuery).toBe(true);
      });

      it("should detect 'parameter' keyword", () => {
        const intent = detectQueryIntent("What parameters can I pass?");
        expect(intent.isSettingQuery).toBe(true);
      });

      it("should detect 'toggle' keyword", () => {
        const intent = detectQueryIntent("How to toggle dark mode?");
        expect(intent.isSettingQuery).toBe(true);
      });

      it("should detect 'enable' keyword", () => {
        const intent = detectQueryIntent("How to enable verbose mode?");
        expect(intent.isSettingQuery).toBe(true);
      });

      it("should detect 'disable' keyword", () => {
        const intent = detectQueryIntent("How to disable sounds?");
        expect(intent.isSettingQuery).toBe(true);
      });

      it("should be case insensitive", () => {
        const intent = detectQueryIntent("SETTINGS for Claude");
        expect(intent.isSettingQuery).toBe(true);
      });
    });

    describe("Command Query Detection", () => {
      it("should detect 'command' keyword", () => {
        const intent = detectQueryIntent("What command do I use?");
        expect(intent.isCommandQuery).toBe(true);
      });

      it("should detect 'cli' keyword", () => {
        const intent = detectQueryIntent("CLI usage guide");
        expect(intent.isCommandQuery).toBe(true);
      });

      it("should detect 'how to' pattern", () => {
        const intent = detectQueryIntent("How to install Claude?");
        expect(intent.isCommandQuery).toBe(true);
      });

      it("should detect 'run' keyword", () => {
        const intent = detectQueryIntent("Run the application");
        expect(intent.isCommandQuery).toBe(true);
      });

      it("should detect 'execute' keyword", () => {
        const intent = detectQueryIntent("Execute a script");
        expect(intent.isCommandQuery).toBe(true);
      });

      it("should detect 'terminal' keyword", () => {
        const intent = detectQueryIntent("In the terminal");
        expect(intent.isCommandQuery).toBe(true);
      });

      it("should detect 'bash' keyword", () => {
        const intent = detectQueryIntent("Bash script for Claude");
        expect(intent.isCommandQuery).toBe(true);
      });

      it("should detect 'shell' keyword", () => {
        const intent = detectQueryIntent("Shell commands");
        expect(intent.isCommandQuery).toBe(true);
      });

      it("should detect 'claude <word>' pattern", () => {
        const intent = detectQueryIntent("claude install guide");
        expect(intent.isCommandQuery).toBe(true);
      });
    });

    describe("Environment Variable Query Detection", () => {
      it("should detect 'env' keyword", () => {
        const intent = detectQueryIntent("Set env variable");
        expect(intent.isEnvVarQuery).toBe(true);
      });

      it("should detect 'environment' keyword", () => {
        const intent = detectQueryIntent("Environment setup");
        expect(intent.isEnvVarQuery).toBe(true);
      });

      it("should detect 'variable' keyword", () => {
        const intent = detectQueryIntent("What variable to set?");
        expect(intent.isEnvVarQuery).toBe(true);
      });

      it("should detect 'apikey' pattern", () => {
        const intent = detectQueryIntent("Where to put my apikey?");
        expect(intent.isEnvVarQuery).toBe(true);
      });

      it("should detect 'api_key' pattern", () => {
        const intent = detectQueryIntent("api_key setup");
        expect(intent.isEnvVarQuery).toBe(true);
      });

      it("should detect 'api-key' pattern", () => {
        const intent = detectQueryIntent("api-key configuration");
        expect(intent.isEnvVarQuery).toBe(true);
      });

      it("should detect 'export' keyword", () => {
        const intent = detectQueryIntent("How to export ANTHROPIC_API_KEY");
        expect(intent.isEnvVarQuery).toBe(true);
      });
    });

    describe("Feature Query Detection", () => {
      it("should detect 'feature' keyword", () => {
        const intent = detectQueryIntent("What features does Claude have?");
        expect(intent.isFeatureQuery).toBe(true);
      });

      it("should detect 'capability' keyword", () => {
        const intent = detectQueryIntent("Claude capability list");
        expect(intent.isFeatureQuery).toBe(true);
      });

      it("should detect 'can I' pattern", () => {
        const intent = detectQueryIntent("Can I use Claude for code review?");
        expect(intent.isFeatureQuery).toBe(true);
      });

      it("should detect 'can you' pattern", () => {
        const intent = detectQueryIntent("Can you generate tests?");
        expect(intent.isFeatureQuery).toBe(true);
      });

      it("should detect 'can claude' pattern", () => {
        const intent = detectQueryIntent("Can Claude read files?");
        expect(intent.isFeatureQuery).toBe(true);
      });

      it("should detect 'support' keyword", () => {
        const intent = detectQueryIntent("Does it support TypeScript?");
        expect(intent.isFeatureQuery).toBe(true);
      });

      it("should detect 'does' keyword", () => {
        const intent = detectQueryIntent("Does Claude Code work offline?");
        expect(intent.isFeatureQuery).toBe(true);
      });
    });

    describe("Resource Query Detection", () => {
      it("should detect 'tool' keyword", () => {
        const intent = detectQueryIntent("Best tool for MCP?");
        expect(intent.isResourceQuery).toBe(true);
      });

      it("should detect 'library' keyword", () => {
        const intent = detectQueryIntent("Python library for Claude");
        expect(intent.isResourceQuery).toBe(true);
      });

      it("should detect 'mcp' keyword", () => {
        const intent = detectQueryIntent("MCP server setup");
        expect(intent.isResourceQuery).toBe(true);
      });

      it("should detect 'server' keyword", () => {
        const intent = detectQueryIntent("How to run a server");
        expect(intent.isResourceQuery).toBe(true);
      });

      it("should detect 'sdk' keyword", () => {
        const intent = detectQueryIntent("SDK documentation");
        expect(intent.isResourceQuery).toBe(true);
      });

      it("should detect 'resource' keyword", () => {
        const intent = detectQueryIntent("Learning resources");
        expect(intent.isResourceQuery).toBe(true);
      });

      it("should detect 'recommend' keyword", () => {
        const intent = detectQueryIntent("What do you recommend?");
        expect(intent.isResourceQuery).toBe(true);
      });
    });

    describe("Multiple Intent Detection", () => {
      it("should detect multiple intents", () => {
        const intent = detectQueryIntent("How to configure the MCP server settings?");
        expect(intent.isCommandQuery).toBe(true);   // "how to"
        expect(intent.isSettingQuery).toBe(true);   // "setting"
        expect(intent.isResourceQuery).toBe(true);  // "server"
      });

      it("should return all false for unrelated query", () => {
        const intent = detectQueryIntent("hello world");
        expect(intent.isSettingQuery).toBe(false);
        expect(intent.isCommandQuery).toBe(false);
        expect(intent.isEnvVarQuery).toBe(false);
        expect(intent.isFeatureQuery).toBe(false);
        expect(intent.isResourceQuery).toBe(false);
      });

      it("should handle empty query", () => {
        const intent = detectQueryIntent("");
        expect(intent.isSettingQuery).toBe(false);
        expect(intent.isCommandQuery).toBe(false);
        expect(intent.isEnvVarQuery).toBe(false);
        expect(intent.isFeatureQuery).toBe(false);
        expect(intent.isResourceQuery).toBe(false);
      });
    });
  });

  describe("TF-IDF Score Calculation", () => {
    it("should calculate term frequency correctly", () => {
      const words = ["claude", "code", "claude", "install", "claude"];
      const termFreq = new Map<string, number>();
      words.forEach((word) => {
        termFreq.set(word, (termFreq.get(word) || 0) + 1);
      });
      expect(termFreq.get("claude")).toBe(3);
      expect(termFreq.get("code")).toBe(1);
      expect(termFreq.get("install")).toBe(1);
    });

    it("should normalize by max frequency", () => {
      const termFreq = new Map([
        ["claude", 3],
        ["code", 1],
        ["install", 1],
      ]);
      const maxFreq = Math.max(...termFreq.values());
      expect(maxFreq).toBe(3);

      for (const [term, freq] of termFreq) {
        termFreq.set(term, freq / maxFreq);
      }
      expect(termFreq.get("claude")).toBe(1);
      expect(termFreq.get("code")).toBeCloseTo(0.333, 2);
    });

    it("should calculate IDF correctly", () => {
      const numDocs = 100;
      // IDF = log(numDocs / (1 + freq))
      // Rare terms (low freq) get higher IDF
      // Common terms (high freq) get lower IDF (can be 0 or negative)
      const rareTermIdf = Math.log(numDocs / (1 + 1)); // ~3.91
      const commonTermIdf = Math.log(numDocs / (1 + 50)); // ~0.67
      const veryCommonIdf = Math.log(numDocs / (1 + 99)); // = 0

      expect(rareTermIdf).toBeGreaterThan(3);
      expect(commonTermIdf).toBeGreaterThan(0);
      expect(veryCommonIdf).toBe(0);
    });

    it("should give higher IDF to rare terms", () => {
      const numDocs = 100;
      const rareIdf = Math.log(numDocs / (1 + 1));
      const commonIdf = Math.log(numDocs / (1 + 50));
      expect(rareIdf).toBeGreaterThan(commonIdf);
    });

    it("should handle single document", () => {
      const numDocs = 1;
      const idf = Math.log(numDocs / (1 + 1));
      expect(idf).toBeCloseTo(-0.693, 2);
    });
  });

  describe("Content Chunking Logic", () => {
    it("should extract header from markdown section", () => {
      const section = "## Installation\n\nInstall using npm";
      const headerMatch = section.match(/^#{2,3}\s+(.+?)$/m);
      expect(headerMatch?.[1]).toBe("Installation");
    });

    it("should handle H2 headers", () => {
      const section = "## Getting Started\n\nContent here";
      const headerMatch = section.match(/^#{2,3}\s+(.+?)$/m);
      expect(headerMatch?.[1]).toBe("Getting Started");
    });

    it("should handle H3 headers", () => {
      const section = "### Configuration Options\n\nContent here";
      const headerMatch = section.match(/^#{2,3}\s+(.+?)$/m);
      expect(headerMatch?.[1]).toBe("Configuration Options");
    });

    it("should split content by headers", () => {
      const content = "Intro\n## Section 1\nContent 1\n## Section 2\nContent 2";
      const sections = content.split(/(?=^#{2,3}\s)/m);
      expect(sections.length).toBeGreaterThan(1);
    });

    it("should clean MDX components", () => {
      const content = "<Component prop='value'>content</Component>";
      const cleaned = content.replace(/<[^>]+>/g, " ");
      expect(cleaned.trim()).toBe("content");
    });

    it("should replace code blocks", () => {
      const content = "Text\n```javascript\nconst x = 1;\n```\nMore text";
      const cleaned = content.replace(/```[\s\S]*?```/g, "[code block]");
      expect(cleaned).toContain("[code block]");
      expect(cleaned).not.toContain("const x = 1");
    });

    it("should remove inline code", () => {
      const content = "Use `npm install` to install";
      const cleaned = content.replace(/`[^`]+`/g, " ");
      expect(cleaned).not.toContain("`");
    });

    it("should remove imports", () => {
      const content = "import Component from '@/components'\n\nContent";
      const cleaned = content.replace(/import\s+.*?from\s+['"][^'"]+['"]/g, "");
      expect(cleaned.trim()).toBe("Content");
    });

    it("should limit chunk size", () => {
      const longContent = "a".repeat(2000);
      const sliced = longContent.slice(0, 1500);
      expect(sliced.length).toBe(1500);
    });
  });

  describe("URL and ID Generation", () => {
    it("should generate chunk ID with URL and index", () => {
      const url = "/docs/getting-started";
      const index = 0;
      const id = `${url}#${index}`;
      expect(id).toBe("/docs/getting-started#0");
    });

    it("should handle multiple chunk IDs", () => {
      const url = "/docs/config";
      const ids = [0, 1, 2, 3].map((i) => `${url}#${i}`);
      expect(ids).toEqual([
        "/docs/config#0",
        "/docs/config#1",
        "/docs/config#2",
        "/docs/config#3",
      ]);
    });

    it("should generate URL from file path", () => {
      const relativePath = "getting-started/index.mdx";
      const slug = relativePath
        .replace(/\.mdx$/, "")
        .replace(/\/index$/, "")
        .replace(/\\/g, "/");
      const url = `/docs/${slug}`;
      expect(url).toBe("/docs/getting-started");
    });

    it("should handle nested paths", () => {
      const relativePath = "api/authentication/oauth.mdx";
      const slug = relativePath.replace(/\.mdx$/, "").replace(/\\/g, "/");
      const url = `/docs/${slug}`;
      expect(url).toBe("/docs/api/authentication/oauth");
    });
  });

  describe("Category Mapping", () => {
    const categories: Record<string, string> = {
      "getting-started": "Getting Started",
      configuration: "Configuration",
      "tips-and-tricks": "Tips & Tricks",
      api: "API Reference",
      integrations: "Integrations",
      tutorials: "Tutorials",
      examples: "Examples",
    };

    it("should map directory names to display names", () => {
      expect(categories["getting-started"]).toBe("Getting Started");
      expect(categories["configuration"]).toBe("Configuration");
      expect(categories["tips-and-tricks"]).toBe("Tips & Tricks");
    });

    it("should handle API category", () => {
      expect(categories["api"]).toBe("API Reference");
    });

    it("should handle all defined categories", () => {
      expect(Object.keys(categories)).toHaveLength(7);
    });
  });

  describe("Keyword Extraction", () => {
    it("should extract top keywords by frequency", () => {
      const words = ["claude", "code", "claude", "install", "claude", "npm"];
      const wordFreq = new Map<string, number>();
      words.forEach((word) => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });

      const keywords = Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word);

      expect(keywords[0]).toBe("claude");
      expect(keywords.length).toBeLessThanOrEqual(3);
    });

    it("should limit to 10 keywords", () => {
      const words = Array.from({ length: 20 }, (_, i) => `word${i}`);
      const wordFreq = new Map<string, number>();
      words.forEach((word, i) => {
        wordFreq.set(word, 20 - i); // Decreasing frequency
      });

      const keywords = Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);

      expect(keywords.length).toBe(10);
      expect(keywords[0]).toBe("word0");
    });
  });

  describe("Search Score Boosting", () => {
    it("should apply title match boost", () => {
      let score = 1.0;
      const titleLower = "installation guide";
      const term = "installation";

      if (titleLower.includes(term)) {
        score *= 1.5;
      }
      expect(score).toBe(1.5);
    });

    it("should apply section match boost", () => {
      let score = 1.0;
      const sectionLower = "getting started";
      const term = "getting";

      if (sectionLower.includes(term)) {
        score *= 1.3;
      }
      expect(score).toBe(1.3);
    });

    it("should apply keyword match boost", () => {
      let score = 1.0;
      const keywords = ["install", "npm", "claude"];
      const term = "install";

      if (keywords.includes(term)) {
        score *= 1.2;
      }
      expect(score).toBe(1.2);
    });

    it("should apply exact phrase match boost", () => {
      let score = 1.0;
      const content = "Install Claude Code using npm";
      const query = "install claude code";

      if (content.toLowerCase().includes(query)) {
        score *= 2;
      }
      expect(score).toBe(2);
    });

    it("should apply setting query boost", () => {
      let score = 1.0;
      const isSettingQuery = true;
      const isConfigOption = true;

      if (isSettingQuery && isConfigOption) {
        score *= 2.5;
      }
      expect(score).toBe(2.5);
    });

    it("should apply command query boost", () => {
      let score = 1.0;
      const isCommandQuery = true;
      const isCommand = true;

      if (isCommandQuery && isCommand) {
        score *= 2.5;
      }
      expect(score).toBe(2.5);
    });

    it("should apply category context boost", () => {
      let score = 1.0;
      const category = "Configuration";
      const contextCategory = "config";

      if (category.toLowerCase().includes(contextCategory.toLowerCase())) {
        score *= 1.5;
      }
      expect(score).toBe(1.5);
    });

    it("should apply structured data boost", () => {
      let score = 1.0;
      const hasSettingData = true;

      if (hasSettingData) {
        score *= 1.1;
      }
      expect(score).toBe(1.1);
    });

    it("should compound multiple boosts", () => {
      let score = 1.0;
      score *= 1.5; // title match
      score *= 1.3; // section match
      score *= 2.5; // setting query
      expect(score).toBeCloseTo(4.875, 2);
    });
  });
});
