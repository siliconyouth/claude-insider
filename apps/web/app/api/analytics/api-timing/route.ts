import { type NextRequest, NextResponse } from "next/server";

interface ApiTimingData {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  slow: boolean;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ApiTimingData = await request.json();

    // Validate required fields
    if (!data.endpoint || typeof data.duration !== "number") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Log slow requests in development
    if (process.env.NODE_ENV === "development" && data.slow) {
      console.warn(`[Slow API] ${data.method} ${data.endpoint}: ${data.duration}ms`);
    }

    // In production, could aggregate and alert on slow endpoints:
    // await metricsService.trackApiTiming(data);
    // if (data.slow) await alertService.notifySlowEndpoint(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API timing analytics error:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}

// Handle beacon requests
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
