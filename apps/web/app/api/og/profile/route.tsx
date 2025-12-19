/**
 * Profile OG Image Generation
 *
 * Generates dynamic Open Graph images for user profiles.
 * Accepts profile data as query parameters for edge runtime compatibility.
 *
 * Usage: /api/og/profile?name=John&username=john&bio=Developer&location=NYC&avatar=https://...
 */

import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const name = searchParams.get("name") || "User";
  const username = searchParams.get("username") || "";
  const bio = searchParams.get("bio") || "";
  const location = searchParams.get("location") || "";
  const avatar = searchParams.get("avatar") || "";
  const followers = parseInt(searchParams.get("followers") || "0");
  const points = parseInt(searchParams.get("points") || "0");

  // Gradient colors for profile theme
  const colors = ["#C084FC", "#818CF8", "#38BDF8"];

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
          {/* Header with logo */}
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
          </div>

          {/* Profile Section */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "40px",
              flex: 1,
            }}
          >
            {/* Avatar */}
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                width={160}
                height={160}
                style={{
                  borderRadius: "50%",
                  border: "4px solid #262626",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "160px",
                  height: "160px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "64px",
                  color: "white",
                  fontWeight: "bold",
                  border: "4px solid #262626",
                }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* User Info */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {/* Name */}
              <h1
                style={{
                  fontSize: name.length > 20 ? "48px" : "56px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  margin: "0 0 8px 0",
                  lineHeight: 1.1,
                }}
              >
                {name}
              </h1>

              {/* Username */}
              {username && (
                <p
                  style={{
                    fontSize: "28px",
                    color: "#818CF8",
                    margin: "0 0 20px 0",
                  }}
                >
                  @{username}
                </p>
              )}

              {/* Bio */}
              {bio && (
                <p
                  style={{
                    fontSize: "22px",
                    color: "#9CA3AF",
                    margin: "0 0 24px 0",
                    maxWidth: "700px",
                    lineHeight: 1.4,
                  }}
                >
                  {bio.length > 100 ? bio.slice(0, 100) + "..." : bio}
                </p>
              )}

              {/* Stats Row */}
              <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                {/* Location */}
                {location && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6B7280"
                      strokeWidth="2"
                    >
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span style={{ fontSize: "18px", color: "#9CA3AF" }}>{location}</span>
                  </div>
                )}

                {/* Followers */}
                {followers > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6B7280"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" />
                      <path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    <span style={{ fontSize: "18px", color: "#9CA3AF" }}>
                      {followers} {followers === 1 ? "follower" : "followers"}
                    </span>
                  </div>
                )}

                {/* Achievement Points */}
                {points > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6B7280"
                      strokeWidth="2"
                    >
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    <span style={{ fontSize: "18px", color: "#9CA3AF" }}>{points} points</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              borderTop: "1px solid #262626",
              paddingTop: "24px",
            }}
          >
            <span style={{ fontSize: "18px", color: "#6B7280" }}>
              claudeinsider.com{username ? `/users/${username}` : ""}
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
