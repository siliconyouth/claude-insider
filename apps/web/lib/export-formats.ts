/**
 * Export Formats Library
 *
 * Handles data export in multiple formats:
 * - JSON: Native serialization
 * - CSV: Comma-separated values with proper escaping
 * - XLSX: Excel spreadsheet (requires xlsx package)
 *
 * Features:
 * - Streaming support for large datasets
 * - Column mapping and renaming
 * - Data anonymization
 * - Type coercion
 */

// Export format types
export type ExportFormat = "json" | "csv" | "xlsx";

// Export options
export interface ExportOptions {
  /** Format to export as */
  format: ExportFormat;
  /** Column definitions for mapping */
  columns?: ColumnDefinition[];
  /** Whether to anonymize PII */
  anonymize?: boolean;
  /** Fields to anonymize (if anonymize is true) */
  anonymizeFields?: string[];
  /** Include headers in CSV output */
  includeHeaders?: boolean;
  /** Pretty print JSON */
  prettyPrint?: boolean;
  /** Sheet name for XLSX */
  sheetName?: string;
}

// Column definition for mapping
export interface ColumnDefinition {
  /** Field key in the data */
  key: string;
  /** Header label for export */
  label: string;
  /** Transform function */
  transform?: (value: unknown) => string | number | boolean | null;
  /** Width hint for XLSX */
  width?: number;
}

// Export result
export interface ExportResult {
  /** The exported data as a string or buffer */
  data: string | Buffer;
  /** MIME type for the content */
  mimeType: string;
  /** File extension */
  extension: string;
  /** Number of rows exported */
  rowCount: number;
}

// Default anonymization fields
const DEFAULT_ANONYMIZE_FIELDS = [
  "email",
  "name",
  "displayName",
  "phone",
  "address",
  "ip",
  "ipAddress",
];

/**
 * Export data to the specified format
 */
export async function exportData<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions
): Promise<ExportResult> {
  const {
    format,
    columns,
    anonymize = false,
    anonymizeFields = DEFAULT_ANONYMIZE_FIELDS,
    includeHeaders = true,
    prettyPrint = false,
    sheetName = "Export",
  } = options;

  // Process data with column mapping and anonymization
  const processedData = processData(data, columns, anonymize, anonymizeFields);

  // Get headers from columns or first data row
  const headers = columns?.map((c) => c.label) || Object.keys(data[0] || {});

  switch (format) {
    case "json":
      return exportToJSON(processedData, prettyPrint);

    case "csv":
      return exportToCSV(processedData, headers, includeHeaders);

    case "xlsx":
      return exportToXLSX(processedData, headers, sheetName, columns);

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Process data with column mapping and anonymization
 */
function processData<T extends Record<string, unknown>>(
  data: T[],
  columns?: ColumnDefinition[],
  anonymize?: boolean,
  anonymizeFields?: string[]
): Record<string, unknown>[] {
  return data.map((row) => {
    const processed: Record<string, unknown> = {};

    if (columns) {
      // Use column definitions for mapping
      for (const col of columns) {
        let value = getNestedValue(row, col.key);

        // Apply transform if defined
        if (col.transform) {
          value = col.transform(value);
        }

        // Anonymize if needed
        if (anonymize && anonymizeFields?.includes(col.key)) {
          value = anonymizeValue(value, col.key);
        }

        processed[col.label] = value;
      }
    } else {
      // Use all fields from the row
      for (const [key, value] of Object.entries(row)) {
        if (anonymize && anonymizeFields?.includes(key)) {
          processed[key] = anonymizeValue(value, key);
        } else {
          processed[key] = value;
        }
      }
    }

    return processed;
  });
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Anonymize a value based on its type
 */
function anonymizeValue(value: unknown, fieldName: string): string {
  if (value === null || value === undefined) {
    return "[REDACTED]";
  }

  const strValue = String(value);

  // Email: show domain only
  if (fieldName.toLowerCase().includes("email") && strValue.includes("@")) {
    const parts = strValue.split("@");
    return `***@${parts[1]}`;
  }

  // Name: show first letter only
  if (fieldName.toLowerCase().includes("name")) {
    return `${strValue.charAt(0)}***`;
  }

  // IP: mask last octet
  if (fieldName.toLowerCase().includes("ip")) {
    return strValue.replace(/\d+$/, "xxx");
  }

  // Default: mask with asterisks
  return "***";
}

/**
 * Export to JSON format
 */
function exportToJSON(
  data: Record<string, unknown>[],
  prettyPrint: boolean
): ExportResult {
  const jsonString = prettyPrint
    ? JSON.stringify(data, null, 2)
    : JSON.stringify(data);

  return {
    data: jsonString,
    mimeType: "application/json",
    extension: "json",
    rowCount: data.length,
  };
}

/**
 * Export to CSV format
 * Implements RFC 4180 compliant CSV output
 */
function exportToCSV(
  data: Record<string, unknown>[],
  headers: string[],
  includeHeaders: boolean
): ExportResult {
  const rows: string[] = [];

  // Add headers
  if (includeHeaders) {
    rows.push(headers.map(escapeCSVField).join(","));
  }

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      return escapeCSVField(formatValue(value));
    });
    rows.push(values.join(","));
  }

  return {
    data: rows.join("\r\n"),
    mimeType: "text/csv;charset=utf-8",
    extension: "csv",
    rowCount: data.length,
  };
}

/**
 * Escape a field for CSV (RFC 4180)
 */
function escapeCSVField(value: string): string {
  // If the field contains a comma, newline, or quote, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format a value for string output
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Export to XLSX format
 * Note: Requires 'xlsx' package to be installed
 */
async function exportToXLSX(
  data: Record<string, unknown>[],
  headers: string[],
  sheetName: string,
  columns?: ColumnDefinition[]
): Promise<ExportResult> {
  try {
    // Dynamically import xlsx to avoid bundling if not needed
    const XLSX = await import("xlsx");

    // Create worksheet data
    const wsData = [
      headers,
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          // Convert undefined/null to empty string for Excel
          if (value === undefined || value === null) return "";
          // Handle objects
          if (typeof value === "object") return JSON.stringify(value);
          return value;
        })
      ),
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths if defined
    if (columns) {
      ws["!cols"] = columns.map((col) => ({
        wch: col.width || Math.max(col.label.length, 15),
      }));
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return {
      data: buffer,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      extension: "xlsx",
      rowCount: data.length,
    };
  } catch (error) {
    // If xlsx is not installed, fall back to CSV
    console.warn(
      "[Export] XLSX package not available, falling back to CSV:",
      error
    );
    return exportToCSV(data, headers, true);
  }
}

/**
 * Common column definitions for user data export
 */
export const USER_EXPORT_COLUMNS: ColumnDefinition[] = [
  { key: "id", label: "ID", width: 36 },
  { key: "email", label: "Email", width: 30 },
  { key: "name", label: "Name", width: 25 },
  { key: "username", label: "Username", width: 20 },
  { key: "role", label: "Role", width: 12 },
  {
    key: "createdAt",
    label: "Created",
    width: 20,
    transform: (v) => (v ? new Date(v as string).toISOString() : ""),
  },
  { key: "emailVerified", label: "Email Verified", width: 15 },
  { key: "banned", label: "Banned", width: 8 },
];

/**
 * Common column definitions for audit log export
 */
export const AUDIT_LOG_COLUMNS: ColumnDefinition[] = [
  { key: "id", label: "Log ID", width: 10 },
  {
    key: "createdAt",
    label: "Timestamp",
    width: 20,
    transform: (v) => (v ? new Date(v as string).toISOString() : ""),
  },
  { key: "action", label: "Action", width: 15 },
  { key: "userId", label: "User ID", width: 36 },
  { key: "userEmail", label: "User Email", width: 30 },
  { key: "targetType", label: "Target Type", width: 15 },
  { key: "targetId", label: "Target ID", width: 36 },
  {
    key: "details",
    label: "Details",
    width: 50,
    transform: (v) => (v ? JSON.stringify(v) : ""),
  },
  { key: "ipAddress", label: "IP Address", width: 15 },
];

/**
 * Common column definitions for activity export
 */
export const ACTIVITY_EXPORT_COLUMNS: ColumnDefinition[] = [
  { key: "id", label: "Activity ID", width: 10 },
  {
    key: "createdAt",
    label: "Timestamp",
    width: 20,
    transform: (v) => (v ? new Date(v as string).toISOString() : ""),
  },
  { key: "userId", label: "User ID", width: 36 },
  { key: "activityType", label: "Type", width: 20 },
  { key: "resourceType", label: "Resource Type", width: 15 },
  { key: "resourceId", label: "Resource ID", width: 36 },
  {
    key: "metadata",
    label: "Metadata",
    width: 40,
    transform: (v) => (v ? JSON.stringify(v) : ""),
  },
];

/**
 * Utility to stream large exports in chunks
 */
export async function* streamExport<T extends Record<string, unknown>>(
  dataGenerator: AsyncGenerator<T[], void, unknown>,
  options: Omit<ExportOptions, "format"> & { format: "csv" }
): AsyncGenerator<string, void, unknown> {
  const columns = options.columns;
  const headers = columns?.map((c) => c.label) || [];
  let isFirst = true;

  for await (const chunk of dataGenerator) {
    const processed = processData(
      chunk,
      columns,
      options.anonymize,
      options.anonymizeFields
    );

    // Build CSV rows
    const rows: string[] = [];

    // Add headers only on first chunk
    if (isFirst && options.includeHeaders !== false && headers.length > 0) {
      rows.push(headers.map(escapeCSVField).join(","));
      isFirst = false;
    }

    // Add data rows
    for (const row of processed) {
      const values = headers.map((header) =>
        escapeCSVField(formatValue(row[header]))
      );
      rows.push(values.join(","));
    }

    yield rows.join("\r\n") + "\r\n";
  }
}
