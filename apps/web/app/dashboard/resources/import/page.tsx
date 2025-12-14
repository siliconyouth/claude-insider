"use client";

/**
 * Batch Import Page
 *
 * Upload CSV or JSON files to import resources into the discovery queue.
 * Features file upload, preview, validation, and import progress tracking.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";

interface ImportEntry {
  url: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  priority?: string;
}

interface ImportResult {
  success: boolean;
  totalEntries: number;
  imported: number;
  duplicates: number;
  errors: number;
  details: {
    url: string;
    status: "imported" | "duplicate" | "error";
    message?: string;
  }[];
}

export default function ImportPage() {
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [preview, setPreview] = useState<ImportEntry[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [options, setOptions] = useState({
    skipDuplicates: true,
    defaultPriority: "normal" as "high" | "normal" | "low",
    autoApprove: false,
  });

  // Parse content and show preview
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setParseError(null);
    setPreview([]);
    setResult(null);

    if (!newContent.trim()) return;

    try {
      let entries: ImportEntry[] = [];

      if (format === "csv") {
        // Parse CSV
        const lines = newContent.trim().split("\n");
        if (lines.length < 2) {
          setParseError("CSV must have at least a header and one data row");
          return;
        }

        const headerLine = lines[0];
        if (!headerLine) {
          setParseError("Invalid CSV header");
          return;
        }

        const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
        const urlIndex = headers.indexOf("url");

        if (urlIndex === -1) {
          setParseError("CSV must have a 'url' column");
          return;
        }

        for (let i = 1; i < Math.min(lines.length, 11); i++) {
          const line = lines[i];
          if (!line?.trim()) continue;

          const values: string[] = [];
          let current = "";
          let inQuotes = false;

          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              values.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          values.push(current.trim());

          const entry: ImportEntry = { url: values[urlIndex] || "" };
          headers.forEach((header, index) => {
            if (header === "url") return;
            const value = values[index]?.trim();
            if (!value) return;

            if (header === "title") entry.title = value;
            if (header === "description") entry.description = value;
            if (header === "category") entry.category = value;
            if (header === "tags") entry.tags = value.split(";").map((t) => t.trim());
            if (header === "priority") entry.priority = value;
          });

          if (entry.url) entries.push(entry);
        }
      } else {
        // Parse JSON
        const data = JSON.parse(newContent);
        const items = Array.isArray(data) ? data : data.resources;
        if (!Array.isArray(items)) {
          setParseError("JSON must be an array or have a 'resources' property");
          return;
        }
        entries = items.slice(0, 10).filter((item) => item?.url);
      }

      setPreview(entries);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse content");
    }
  }, [format]);

  // Handle file upload
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Detect format from extension
      if (file.name.endsWith(".json")) {
        setFormat("json");
      } else if (file.name.endsWith(".csv")) {
        setFormat("csv");
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContent(text);
        handleContentChange(text);
      };
      reader.readAsText(file);
    },
    [handleContentChange]
  );

  // Perform import
  const handleImport = async () => {
    if (!content.trim() || importing) return;

    setImporting(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/resources/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, format, options }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        totalEntries: 0,
        imported: 0,
        duplicates: 0,
        errors: 1,
        details: [
          {
            url: "Import failed",
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          },
        ],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Batch Import
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Import resources from CSV or JSON files into the discovery queue
        </p>
      </div>

      {/* Format Selection & File Upload */}
      <div className={cn(
        "rounded-xl p-6",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]"
      )}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Format tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFormat("csv");
                handleContentChange(content);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                format === "csv"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400"
              )}
            >
              CSV
            </button>
            <button
              onClick={() => {
                setFormat("json");
                handleContentChange(content);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                format === "json"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400"
              )}
            >
              JSON
            </button>
          </div>

          {/* File upload */}
          <label className={cn(
            "cursor-pointer px-4 py-2 rounded-lg",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "text-white text-sm font-medium",
            "hover:opacity-90 transition-opacity"
          )}>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            Upload File
          </label>
        </div>

        {/* Format help */}
        <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-[#0a0a0a]">
          {format === "csv" ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-white">CSV Format:</p>
              <code className="block mt-2 p-2 bg-gray-100 dark:bg-[#1a1a1a] rounded text-xs">
                url,title,description,tags,priority<br />
                https://github.com/example,Example Tool,A great tool,claude;mcp,normal
              </code>
              <p className="mt-2">Required: <code className="text-blue-600">url</code></p>
              <p>Optional: <code>title</code>, <code>description</code>, <code>tags</code> (semicolon-separated), <code>priority</code></p>
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-white">JSON Format:</p>
              <code className="block mt-2 p-2 bg-gray-100 dark:bg-[#1a1a1a] rounded text-xs whitespace-pre">
{`[
  {
    "url": "https://github.com/example",
    "title": "Example Tool",
    "description": "A great tool",
    "tags": ["claude", "mcp"]
  }
]`}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Content Input */}
      <div className={cn(
        "rounded-xl p-6",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]"
      )}>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Paste Content or Upload File
        </label>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleContentChange(e.target.value);
          }}
          placeholder={format === "csv"
            ? "url,title,description\nhttps://github.com/example,Example,A great resource"
            : '[{"url": "https://github.com/example", "title": "Example"}]'
          }
          rows={10}
          className={cn(
            "w-full px-4 py-3 rounded-lg font-mono text-sm",
            "bg-gray-50 dark:bg-[#0a0a0a]",
            "border border-gray-200 dark:border-[#262626]",
            "text-gray-900 dark:text-white",
            "placeholder:text-gray-400 dark:placeholder:text-gray-600",
            "focus:outline-none focus:ring-2 focus:ring-blue-500"
          )}
        />

        {parseError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            ⚠️ {parseError}
          </p>
        )}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className={cn(
          "rounded-xl p-6",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Preview (first 10 entries)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-[#262626]">
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">URL</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Title</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-500 dark:text-gray-400">Tags</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-[#1a1a1a]">
                    <td className="py-2 px-4 max-w-xs truncate text-gray-900 dark:text-white">
                      {entry.url}
                    </td>
                    <td className="py-2 px-4 text-gray-600 dark:text-gray-400">
                      {entry.title || "-"}
                    </td>
                    <td className="py-2 px-4">
                      {entry.tags?.map((tag, j) => (
                        <span
                          key={j}
                          className="inline-block mr-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-cyan-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Options */}
      <div className={cn(
        "rounded-xl p-6",
        "bg-white dark:bg-[#111111]",
        "border border-gray-200 dark:border-[#262626]"
      )}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Import Options
        </h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={options.skipDuplicates}
              onChange={(e) => setOptions({ ...options, skipDuplicates: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Skip duplicate URLs (already in queue or resources)
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={options.autoApprove}
              onChange={(e) => setOptions({ ...options, autoApprove: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Auto-approve all entries (skip review queue)
            </span>
          </label>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 dark:text-gray-300">Default Priority:</span>
            <select
              value={options.defaultPriority}
              onChange={(e) => setOptions({
                ...options,
                defaultPriority: e.target.value as "high" | "normal" | "low",
              })}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm",
                "bg-gray-50 dark:bg-[#0a0a0a]",
                "border border-gray-200 dark:border-[#262626]",
                "text-gray-900 dark:text-white"
              )}
            >
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Import Button */}
      <div className="flex justify-end">
        <button
          onClick={handleImport}
          disabled={!content.trim() || !!parseError || importing}
          className={cn(
            "px-6 py-3 rounded-lg text-sm font-semibold",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "text-white shadow-lg shadow-blue-500/25",
            "hover:-translate-y-0.5 transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          )}
        >
          {importing ? "Importing..." : "Start Import"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className={cn(
          "rounded-xl p-6",
          "bg-white dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]"
        )}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Import Results
          </h2>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#0a0a0a]">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.totalEntries}
              </p>
              <p className="text-sm text-gray-500">Total Entries</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {result.imported}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">Imported</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {result.duplicates}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">Duplicates</p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {result.errors}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">Errors</p>
            </div>
          </div>

          {/* Details */}
          {result.details.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-[#111111]">
                  <tr className="border-b border-gray-200 dark:border-[#262626]">
                    <th className="text-left py-2 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-500">URL</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-500">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.map((detail, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-[#1a1a1a]">
                      <td className="py-2 px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          detail.status === "imported" && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                          detail.status === "duplicate" && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
                          detail.status === "error" && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        )}>
                          {detail.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 max-w-xs truncate text-gray-900 dark:text-white">
                        {detail.url}
                      </td>
                      <td className="py-2 px-4 text-gray-500 dark:text-gray-400">
                        {detail.message || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
