import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

/**
 * Square OG Image (1200x1200)
 * Optimized for WhatsApp, Instagram, and other platforms that prefer square images
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const title = searchParams.get("title") || "Claude Insider";
  const description =
    searchParams.get("description") ||
    "Tips, Tricks & Documentation for Claude AI";

  // Brand colors matching the website design system
  // violet-600: #7c3aed, blue-600: #2563eb, cyan-600: #06b6d4
  const brandGradient = ["#7c3aed", "#2563eb", "#06b6d4"];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          padding: "80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient blobs */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${brandGradient[0]}25 0%, transparent 70%)`,
            filter: "blur(100px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-200px",
            left: "-200px",
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
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${brandGradient[1]}15 0%, transparent 70%)`,
            filter: "blur(80px)",
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
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Logo + Wordmark centered */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginBottom: "60px",
            }}
          >
            {/* Logo icon */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background: `linear-gradient(135deg, ${brandGradient[0]}, ${brandGradient[1]}, ${brandGradient[2]})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(37, 99, 235, 0.3)",
              }}
            >
              <span
                style={{
                  fontSize: "40px",
                  color: "white",
                  fontWeight: 700,
                  letterSpacing: "-1px",
                }}
              >
                Ci
              </span>
            </div>
            {/* Wordmark */}
            <span
              style={{
                fontSize: "42px",
                fontWeight: 600,
                color: "white",
                letterSpacing: "-0.5px",
              }}
            >
              Claude Insider
            </span>
          </div>

          {/* Main title with gradient */}
          <h1
            style={{
              fontSize: title.length > 30 ? "64px" : "80px",
              fontWeight: 700,
              background: `linear-gradient(135deg, ${brandGradient[0]}, ${brandGradient[1]}, ${brandGradient[2]})`,
              backgroundClip: "text",
              color: "transparent",
              lineHeight: 1.15,
              margin: 0,
              letterSpacing: "-2px",
              maxWidth: "1000px",
            }}
          >
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p
              style={{
                fontSize: "32px",
                color: "#9CA3AF",
                margin: "40px 0 0 0",
                maxWidth: "900px",
                lineHeight: 1.4,
                letterSpacing: "-0.3px",
              }}
            >
              {description.length > 80
                ? description.slice(0, 80) + "..."
                : description}
            </p>
          )}

          {/* Footer URL */}
          <div
            style={{
              position: "absolute",
              bottom: "0",
              display: "flex",
              width: "100%",
              justifyContent: "center",
              borderTop: "1px solid #262626",
              paddingTop: "30px",
            }}
          >
            <span
              style={{
                fontSize: "24px",
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
      height: 1200,
    }
  );
}
