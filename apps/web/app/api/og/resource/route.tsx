/**
 * Resource OG Image Generation
 *
 * Generates dynamic Open Graph images for resource pages.
 * Displays title, description, category, GitHub stats, enhanced fields, and more.
 *
 * Usage: /api/og/resource?title=...&description=...&category=...&stars=...&pricing=...
 *        &features=feature1|feature2|feature3&audience=Developers&aiEnhanced=true
 */

import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const title = searchParams.get("title") || "Resource";
  const description = searchParams.get("description") || "";
  const category = searchParams.get("category") || "";
  const icon = searchParams.get("icon") || "";
  const stars = parseInt(searchParams.get("stars") || "0");
  const forks = parseInt(searchParams.get("forks") || "0");
  const pricing = searchParams.get("pricing") || "free";
  const platform = searchParams.get("platform") || "";
  const rating = parseFloat(searchParams.get("rating") || "0");
  const isFeatured = searchParams.get("featured") === "true";

  // Enhanced fields (Migration 088)
  const featuresParam = searchParams.get("features") || "";
  const features = featuresParam ? featuresParam.split("|").slice(0, 3) : [];
  const audience = searchParams.get("audience") || "";
  const isAiEnhanced = searchParams.get("aiEnhanced") === "true";

  // Default colors used as fallback
  const defaultColors = ["#7C3AED", "#2563EB", "#06B6D4"];
  const defaultPricingStyle = { bg: "#10B98133", text: "#34D399" };

  // Category-based gradient colors
  const categoryGradients: Record<string, string[]> = {
    official: ["#7C3AED", "#2563EB", "#06B6D4"],
    tools: ["#8B5CF6", "#3B82F6", "#14B8A6"],
    "mcp-servers": ["#A855F7", "#6366F1", "#0EA5E9"],
    rules: ["#C084FC", "#818CF8", "#38BDF8"],
    prompts: ["#E879F9", "#8B5CF6", "#22D3EE"],
    agents: ["#FB923C", "#F97316", "#EAB308"],
    tutorials: ["#34D399", "#10B981", "#06B6D4"],
    sdks: ["#60A5FA", "#3B82F6", "#8B5CF6"],
    showcases: ["#F472B6", "#EC4899", "#A855F7"],
    community: ["#2DD4BF", "#14B8A6", "#06B6D4"],
  };

  const colors = categoryGradients[category] ?? defaultColors;

  // Pricing badge colors
  const pricingStyles: Record<string, { bg: string; text: string }> = {
    free: { bg: "#10B98133", text: "#34D399" },
    freemium: { bg: "#3B82F633", text: "#60A5FA" },
    paid: { bg: "#F9731633", text: "#FB923C" },
    enterprise: { bg: "#8B5CF633", text: "#A78BFA" },
    "open-source": { bg: "#10B98133", text: "#34D399" },
  };

  const pricingStyle = pricingStyles[pricing] ?? defaultPricingStyle;

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
          {/* Header with logo and badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "40px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
              <span style={{ fontSize: "24px", fontWeight: 600, color: "#9CA3AF" }}>
                Claude Insider
              </span>
            </div>

            {/* Badge row */}
            <div style={{ display: "flex", gap: "12px" }}>
              {/* AI Enhanced badge */}
              {isAiEnhanced && (
                <div
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    background: "linear-gradient(135deg, #8B5CF622, #06B6D422)",
                    border: "1px solid #8B5CF666",
                    color: "#A78BFA",
                    fontSize: "14px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#A78BFA">
                    <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
                  </svg>
                  AI Enhanced
                </div>
              )}

              {/* Featured badge */}
              {isFeatured && (
                <div
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    background: "linear-gradient(135deg, #F59E0B22, #EAB30822)",
                    border: "1px solid #F59E0B66",
                    color: "#FCD34D",
                    fontSize: "14px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#FCD34D">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  Featured
                </div>
              )}

              {/* Audience badge */}
              {audience && (
                <div
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    background: "#3B82F622",
                    border: "1px solid #3B82F666",
                    color: "#60A5FA",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  For {audience}
                </div>
              )}

              {/* Category badge */}
              {category && (
                <div
                  style={{
                    padding: "8px 20px",
                    borderRadius: "9999px",
                    background: `linear-gradient(135deg, ${colors[0]}44, ${colors[2]}44)`,
                    border: `1px solid ${colors[1]}66`,
                    color: "#E5E7EB",
                    fontSize: "16px",
                    fontWeight: 500,
                    textTransform: "capitalize",
                  }}
                >
                  {category.replace("-", " ")}
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "32px",
              flex: 1,
            }}
          >
            {/* Icon */}
            {icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={icon}
                alt=""
                width={100}
                height={100}
                style={{
                  borderRadius: "20px",
                  border: "2px solid #262626",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "20px",
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "48px",
                  color: "white",
                  fontWeight: "bold",
                  border: "2px solid #262626",
                }}
              >
                {title.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Title and description */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <h1
                style={{
                  fontSize: title.length > 30 ? "40px" : "52px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  margin: "0 0 16px 0",
                  lineHeight: 1.1,
                  maxWidth: "800px",
                }}
              >
                {title}
              </h1>

              {description && (
                <p
                  style={{
                    fontSize: "22px",
                    color: "#9CA3AF",
                    margin: 0,
                    maxWidth: "750px",
                    lineHeight: 1.4,
                  }}
                >
                  {description.length > 120 ? description.slice(0, 120) + "..." : description}
                </p>
              )}

              {/* Key Features */}
              {features.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "16px",
                  }}
                >
                  {features.map((feature, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        background: "#1f1f1f",
                        border: "1px solid #333",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#34D399">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                      <span style={{ fontSize: "14px", color: "#D1D5DB" }}>
                        {feature.length > 35 ? feature.slice(0, 35) + "..." : feature}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              marginTop: "auto",
              marginBottom: "24px",
            }}
          >
            {/* GitHub Stars */}
            {stars > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FCD34D"
                  strokeWidth="2"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span style={{ fontSize: "20px", color: "#E5E7EB", fontWeight: 600 }}>
                  {formatNumber(stars)}
                </span>
              </div>
            )}

            {/* GitHub Forks */}
            {forks > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                >
                  <path d="M6 3v6M18 3v6M6 21v-6M18 21v-6M6 9a3 3 0 003 3h6a3 3 0 003-3M6 15a3 3 0 013-3h6a3 3 0 013 3" />
                </svg>
                <span style={{ fontSize: "18px", color: "#9CA3AF" }}>
                  {formatNumber(forks)} forks
                </span>
              </div>
            )}

            {/* Rating */}
            {rating > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#FCD34D">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span style={{ fontSize: "18px", color: "#E5E7EB" }}>{rating.toFixed(1)}</span>
              </div>
            )}

            {/* Platform */}
            {platform && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9CA3AF"
                  strokeWidth="2"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span style={{ fontSize: "16px", color: "#9CA3AF", textTransform: "capitalize" }}>
                  {platform}
                </span>
              </div>
            )}

            {/* Pricing badge */}
            <div
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                background: pricingStyle.bg,
                color: pricingStyle.text,
                fontSize: "16px",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {pricing === "open-source" ? "Open Source" : pricing}
            </div>
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
            <span style={{ fontSize: "16px", color: "#6B7280" }}>
              Claude AI Resources & Tools
            </span>
            <span style={{ fontSize: "18px", color: "#6B7280" }}>claudeinsider.com/resources</span>
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
