import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const title = searchParams.get("title") || "Claude Insider";
  const description =
    searchParams.get("description") ||
    "Tips, Tricks & Documentation for Claude AI";
  const type = searchParams.get("type") || "default";
  const category = searchParams.get("category");
  const badge = searchParams.get("badge");
  const author = searchParams.get("author");

  // Brand colors matching the website design system
  // violet-600: #7c3aed, blue-600: #2563eb, cyan-600: #06b6d4
  const brandGradient = ["#7c3aed", "#2563eb", "#06b6d4"];

  // Type-specific accent colors (subtle variations)
  const typeAccents = {
    default: brandGradient,
    article: ["#8B5CF6", "#3B82F6", "#14B8A6"],
    resource: ["#A855F7", "#6366F1", "#0EA5E9"],
    profile: ["#C084FC", "#818CF8", "#38BDF8"],
  };

  const accentColors =
    typeAccents[type as keyof typeof typeAccents] || typeAccents.default;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          padding: "60px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient blobs - matching website hero */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-150px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${brandGradient[0]}25 0%, transparent 70%)`,
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-200px",
            left: "-150px",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${brandGradient[2]}20 0%, transparent 70%)`,
            filter: "blur(100px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "800px",
            height: "400px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${brandGradient[1]}10 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />

        {/* Content container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            position: "relative",
            zIndex: 1,
            justifyContent: "space-between",
          }}
        >
          {/* Header with logo - matching website header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Logo icon - exact match to website header */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: `linear-gradient(135deg, ${brandGradient[0]}, ${brandGradient[1]}, ${brandGradient[2]})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                <span
                  style={{
                    fontSize: "26px",
                    color: "white",
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                  }}
                >
                  Ci
                </span>
              </div>
              {/* Wordmark - matching website header font */}
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: 600,
                  color: "white",
                  letterSpacing: "-0.3px",
                }}
              >
                Claude Insider
              </span>
            </div>

            {/* Badge or category pill */}
            {(badge || category) && (
              <div
                style={{
                  padding: "10px 24px",
                  borderRadius: "9999px",
                  background: `linear-gradient(135deg, ${accentColors[0]}30, ${accentColors[2]}30)`,
                  border: `1px solid ${accentColors[1]}50`,
                  color: "#E5E7EB",
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                {badge || category}
              </div>
            )}
          </div>

          {/* Center content - Hero section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            {/* Main title with gradient - matching website hero */}
            <h1
              style={{
                fontSize: title.length > 40 ? "56px" : "72px",
                fontWeight: 700,
                background: `linear-gradient(135deg, ${brandGradient[0]}, ${brandGradient[1]}, ${brandGradient[2]})`,
                backgroundClip: "text",
                color: "transparent",
                lineHeight: 1.15,
                margin: 0,
                letterSpacing: "-1px",
                maxWidth: "1000px",
              }}
            >
              {title}
            </h1>

            {/* Description - matching website subheadline */}
            {description && (
              <p
                style={{
                  fontSize: "26px",
                  color: "#9CA3AF",
                  margin: "24px 0 0 0",
                  maxWidth: "800px",
                  lineHeight: 1.5,
                  letterSpacing: "-0.2px",
                }}
              >
                {description.length > 100
                  ? description.slice(0, 100) + "..."
                  : description}
              </p>
            )}
          </div>

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
                <span style={{ fontSize: "18px", color: "#6B7280" }}>
                  By {author}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: "20px",
                color: "#6B7280",
                fontWeight: 500,
              }}
            >
              claudeinsider.com
            </span>
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
