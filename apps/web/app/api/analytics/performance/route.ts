import { type NextRequest, NextResponse } from "next/server";

interface PerformanceData {
  type: "performance";
  metric: {
    name: string;
    value: number;
    rating: "good" | "needs-improvement" | "poor";
    delta?: number;
    id?: string;
    navigationType?: string;
  };
  url: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: PerformanceData = await request.json();

    // Validate required fields
    if (!data.metric?.name || typeof data.metric.value !== "number") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // In production, send to analytics service (e.g., BigQuery, InfluxDB, etc.)
    // For now, just log in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] Performance: ${data.metric.name}=${data.metric.value}ms (${data.metric.rating})`);
    }

    // Could store in database or send to external service:
    // await analyticsService.trackPerformance(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Performance analytics error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}

// Handle beacon requests (which might be form data)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
