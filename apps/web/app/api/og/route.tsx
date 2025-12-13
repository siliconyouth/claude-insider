import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const title = searchParams.get("title") || "Claude Insider";
  const description = searchParams.get("description") || "Tips, Tricks & Documentation for Claude AI";
  const type = searchParams.get("type") || "default";
  const category = searchParams.get("category");
  const badge = searchParams.get("badge");
  const author = searchParams.get("author");

  // Gradient colors based on type
  const gradients = {
    default: ["#7C3AED", "#2563EB", "#06B6D4"],
    article: ["#8B5CF6", "#3B82F6", "#14B8A6"],
    resource: ["#A855F7", "#6366F1", "#0EA5E9"],
    profile: ["#C084FC", "#818CF8", "#38BDF8"],
  };

  const colors = gradients[type as keyof typeof gradients] || gradients.default;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          padding: "60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient blobs */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colors[0]}33 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${colors[2]}33 0%, transparent 70%)`,
            filter: "blur(80px)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Header with logo and badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "40px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Logo icon */}
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "24px", color: "white", fontWeight: "bold" }}>CI</span>
              </div>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  color: "#9CA3AF",
                }}
              >
                Claude Insider
              </span>
            </div>

            {/* Badge or category */}
            {(badge || category) && (
              <div
                style={{
                  padding: "8px 20px",
                  borderRadius: "9999px",
                  background: `linear-gradient(135deg, ${colors[0]}44, ${colors[2]}44)`,
                  border: `1px solid ${colors[1]}66`,
                  color: "#E5E7EB",
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                {badge || category}
              </div>
            )}
          </div>

          {/* Main title */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
            }}
          >
            <h1
              style={{
                fontSize: title.length > 50 ? "48px" : "64px",
                fontWeight: 700,
                background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
                backgroundClip: "text",
                color: "transparent",
                lineHeight: 1.2,
                margin: 0,
                maxWidth: "900px",
              }}
            >
              {title}
            </h1>
          </div>

          {/* Description */}
          {description && (
            <p
              style={{
                fontSize: "24px",
                color: "#9CA3AF",
                margin: "0 0 40px 0",
                maxWidth: "800px",
                lineHeight: 1.4,
              }}
            >
              {description.length > 120 ? description.slice(0, 120) + "..." : description}
            </p>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #262626",
              paddingTop: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {author && (
                <span style={{ fontSize: "18px", color: "#6B7280" }}>By {author}</span>
              )}
            </div>
            <span style={{ fontSize: "18px", color: "#6B7280" }}>claudeinsider.com</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
