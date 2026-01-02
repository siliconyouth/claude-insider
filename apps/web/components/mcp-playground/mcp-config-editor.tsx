"use client";

/**
 * MCP Config Editor Component
 *
 * Monaco Editor wrapper for editing MCP server configurations.
 * Features:
 * - JSON syntax highlighting
 * - Real-time validation markers
 * - Dark theme matching site design
 * - Format on paste/type
 */

import { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { OnChange, OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { cn } from "@/lib/design-system";

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

interface MCPConfigEditorProps {
  value: string;
  onChange: (value: string) => void;
  errors?: Array<{
    line?: number;
    column?: number;
    message: string;
    severity?: "error" | "warning";
  }>;
  className?: string;
  height?: string;
  readOnly?: boolean;
}

/**
 * Skeleton loader while Monaco loads
 */
function EditorSkeleton() {
  // Deterministic widths to satisfy React purity rule
  const lineWidths = [65, 45, 70, 50, 60, 40, 55, 75, 48, 62];

  return (
    <div className="h-[400px] bg-[#1e1e1e] rounded-lg p-4 animate-pulse">
      <div className="space-y-2">
        {lineWidths.map((width, i) => (
          <div
            key={i}
            className="h-4 bg-gray-800 rounded"
            style={{ width: `${width}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function MCPConfigEditor({
  value,
  onChange,
  errors = [],
  className,
  height = "400px",
  readOnly = false,
}: MCPConfigEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  // Handle editor mount
  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure JSON language settings
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [
        {
          uri: "https://claudeinsider.com/schemas/mcp-config.json",
          fileMatch: ["*"],
          schema: {
            type: "object",
            required: ["mcpServers"],
            properties: {
              mcpServers: {
                type: "object",
                additionalProperties: {
                  type: "object",
                  required: ["command"],
                  properties: {
                    command: {
                      type: "string",
                      description: "Command to run (e.g., npx, node, python)",
                    },
                    args: {
                      type: "array",
                      items: { type: "string" },
                      description: "Arguments to pass to the command",
                    },
                    env: {
                      type: "object",
                      additionalProperties: { type: "string" },
                      description: "Environment variables",
                    },
                  },
                },
              },
            },
          },
        },
      ],
    });

    // Focus the editor
    editor.focus();
  }, []);

  // Handle value changes
  const handleChange: OnChange = useCallback(
    (newValue) => {
      if (newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  // Update editor markers when errors change
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model) return;

    // Convert our errors to Monaco markers
    const markers: editor.IMarkerData[] = errors.map((error) => ({
      severity:
        error.severity === "warning"
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Error,
      message: error.message,
      startLineNumber: error.line || 1,
      startColumn: error.column || 1,
      endLineNumber: error.line || 1,
      endColumn: (error.column || 1) + 10,
    }));

    monaco.editor.setModelMarkers(model, "mcp-validator", markers);
  }, [errors]);

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden border ui-border",
        "bg-[#1e1e1e]", // Monaco VS Dark background
        className
      )}
    >
      <MonacoEditor
        height={height}
        language="json"
        theme="vs-dark"
        value={value}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          folding: true,
          foldingStrategy: "indentation",
          formatOnPaste: true,
          formatOnType: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          readOnly,
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          padding: { top: 16, bottom: 16 },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          quickSuggestions: {
            strings: true,
            other: true,
            comments: false,
          },
        }}
      />
    </div>
  );
}
