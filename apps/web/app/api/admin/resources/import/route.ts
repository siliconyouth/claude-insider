/**
 * Batch Import API
 *
 * POST /api/admin/resources/import
 *
 * Imports resources from CSV or JSON files into the discovery queue.
 * Validates entries, checks for duplicates, and queues them for review.
 *
 * Requires admin authentication.
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hasRole } from "@/collections/Users";
import {
  checkRateLimit,
  createRateLimitResponse,
} from "@/lib/rate-limiter";
import { createAuditLog } from "@/lib/audit";

interface ImportEntry {
  url: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  status?: string;
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

/**
 * Parse CSV content into entries
 */
function parseCSV(content: string): ImportEntry[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  if (!headerLine) return [];

  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
  const urlIndex = headers.indexOf("url");

  if (urlIndex === -1) {
    throw new Error("CSV must have a 'url' column");
  }

  const entries: ImportEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line?.trim()) continue;

    // Handle quoted values with commas
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

    const entry: ImportEntry = {
      url: values[urlIndex] || "",
    };

    // Map other columns
    headers.forEach((header, index) => {
      if (header === "url") return;
      const value = values[index]?.trim();
      if (!value) return;

      switch (header) {
        case "title":
          entry.title = value;
          break;
        case "description":
          entry.description = value;
          break;
        case "category":
          entry.category = value;
          break;
        case "tags":
          entry.tags = value.split(";").map((t) => t.trim());
          break;
        case "status":
          entry.status = value;
          break;
        case "priority":
          entry.priority = value;
          break;
      }
    });

    if (entry.url) {
      entries.push(entry);
    }
  }

  return entries;
}

/**
 * Parse JSON content into entries
 */
function parseJSON(content: string): ImportEntry[] {
  const data = JSON.parse(content);

  if (Array.isArray(data)) {
    return data.filter((item) => item && typeof item.url === "string");
  }

  if (data.resources && Array.isArray(data.resources)) {
    return data.resources.filter((item: unknown) =>
      item && typeof item === "object" && "url" in item && typeof (item as { url: unknown }).url === "string"
    );
  }

  throw new Error("JSON must be an array or have a 'resources' array property");
}

/**
 * Validate a URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });

    // Authenticate
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    let user;
    try {
      const authResult = await payload.auth({
        headers: new Headers({ cookie }),
      });
      user = authResult.user;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user || !hasRole(user, ["admin"])) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(user.id, "import");
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Parse request body
    const body = await request.json();
    const { content, format, options = {} } = body as {
      content: string;
      format: "csv" | "json";
      options?: {
        skipDuplicates?: boolean;
        defaultPriority?: string;
        autoApprove?: boolean;
      };
    };

    if (!content || !format) {
      return NextResponse.json(
        { error: "Content and format are required" },
        { status: 400 }
      );
    }

    // Parse content
    let entries: ImportEntry[];
    try {
      if (format === "csv") {
        entries = parseCSV(content);
      } else if (format === "json") {
        entries = parseJSON(content);
      } else {
        return NextResponse.json(
          { error: "Invalid format. Use 'csv' or 'json'" },
          { status: 400 }
        );
      }
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Failed to parse content",
          details: parseError instanceof Error ? parseError.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No valid entries found in content" },
        { status: 400 }
      );
    }

    // Limit batch size
    if (entries.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 entries per import" },
        { status: 400 }
      );
    }

    // Get existing URLs for duplicate detection
    const [existingQueue, existingResources] = await Promise.all([
      payload.find({
        collection: "resource-discovery-queue",
        where: { status: { not_equals: "rejected" } },
        limit: 10000,
      }),
      payload.find({
        collection: "resources",
        limit: 10000,
      }),
    ]);

    const existingUrls = new Set([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...existingQueue.docs.map((d: any) => d.url?.toLowerCase()),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...existingResources.docs.map((d: any) => d.url?.toLowerCase()),
    ]);

    // Process entries
    const result: ImportResult = {
      success: true,
      totalEntries: entries.length,
      imported: 0,
      duplicates: 0,
      errors: 0,
      details: [],
    };

    for (const entry of entries) {
      // Validate URL
      if (!isValidUrl(entry.url)) {
        result.errors++;
        result.details.push({
          url: entry.url,
          status: "error",
          message: "Invalid URL format",
        });
        continue;
      }

      // Check for duplicates
      if (existingUrls.has(entry.url.toLowerCase())) {
        result.duplicates++;
        result.details.push({
          url: entry.url,
          status: "duplicate",
          message: "URL already exists",
        });
        if (options.skipDuplicates !== false) {
          continue;
        }
      }

      // Create queue entry
      try {
        await payload.create({
          collection: "resource-discovery-queue",
          data: {
            url: entry.url,
            title: entry.title || entry.url,
            description: entry.description || "",
            status: options.autoApprove ? "approved" : "pending",
            priority: (entry.priority || options.defaultPriority || "normal") as "high" | "normal" | "low",
            rawData: {
              importedFrom: format,
              originalEntry: entry,
              importedAt: new Date().toISOString(),
            },
          },
        });

        result.imported++;
        result.details.push({
          url: entry.url,
          status: "imported",
        });

        // Add to existing set to prevent duplicates within batch
        existingUrls.add(entry.url.toLowerCase());
      } catch (createError) {
        result.errors++;
        result.details.push({
          url: entry.url,
          status: "error",
          message: createError instanceof Error ? createError.message : "Failed to create",
        });
      }
    }

    // Create audit log
    await createAuditLog({
      action: "import",
      collection: "resource-discovery-queue",
      userId: user.id,
      userEmail: user.email,
      userName: user.name || undefined,
      userRole: user.role || undefined,
      context: {
        notes: `Batch import: ${result.imported} imported, ${result.duplicates} duplicates, ${result.errors} errors`,
        affectedCount: result.imported,
      },
      status: result.errors > 0 ? "partial" : "success",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Import API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to import resources from CSV or JSON",
    description: "Batch import resources into the discovery queue for review",
    parameters: {
      content: "string (required) - Raw CSV or JSON content",
      format: "'csv' | 'json' (required) - Format of the content",
      options: {
        skipDuplicates: "boolean (default: true) - Skip entries that already exist",
        defaultPriority: "'high' | 'normal' | 'low' (default: 'normal')",
        autoApprove: "boolean (default: false) - Automatically approve entries",
      },
    },
    csvFormat: {
      requiredColumns: ["url"],
      optionalColumns: ["title", "description", "category", "tags", "priority"],
      tagsFormat: "Semicolon-separated (e.g., 'claude;mcp;tools')",
    },
    jsonFormat: {
      example: [
        {
          url: "https://github.com/example/repo",
          title: "Example Resource",
          description: "A great resource",
          tags: ["claude", "mcp"],
        },
      ],
    },
    limits: {
      maxEntries: 500,
      rateLimit: "5 imports per hour",
    },
  });
}
