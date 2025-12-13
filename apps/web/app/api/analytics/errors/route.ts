import { type NextRequest, NextResponse } from "next/server";

interface ErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const report: ErrorReport = await request.json();

    // Validate required fields
    if (!report.message) {
      return NextResponse.json({ error: "Invalid error report" }, { status: 400 });
    }

    // In production, send to error tracking service (e.g., Sentry, LogRocket)
    // For now, log in development
    if (process.env.NODE_ENV === "development") {
      console.error("[Error Report]", {
        message: report.message,
        url: report.url,
        timestamp: report.timestamp,
      });
    }

    // Could send to Sentry or store in database:
    // await Sentry.captureException(new Error(report.message), {
    //   extra: report.metadata,
    //   contexts: { componentStack: report.componentStack }
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reporting failed:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
