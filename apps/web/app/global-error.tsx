"use client";

/**
 * Global Error Boundary
 *
 * Catches client-side errors at the root level, including errors
 * in the root layout. This is a last resort error handler.
 */

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body style={{
        backgroundColor: "#0a0a0a",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, sans-serif",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        margin: 0,
      }}>
        <div style={{
          maxWidth: "500px",
          width: "100%",
          padding: "32px",
          backgroundColor: "#111111",
          border: "1px solid #262626",
          borderRadius: "16px",
          textAlign: "center",
        }}>
          {/* Error Icon */}
          <div style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 24px",
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "white",
            marginBottom: "12px",
          }}>
            Application Error
          </h1>

          {/* Description */}
          <p style={{
            color: "#9ca3af",
            marginBottom: "24px",
            lineHeight: "1.5",
          }}>
            A critical error occurred. Please try refreshing the page.
          </p>

          {/* Error Message */}
          {error.message && (
            <p style={{
              fontSize: "12px",
              color: "#6b7280",
              marginBottom: "24px",
              fontFamily: "monospace",
              backgroundColor: "#0a0a0a",
              padding: "12px",
              borderRadius: "8px",
              wordBreak: "break-word",
            }}>
              {error.message}
            </p>
          )}

          {/* Actions */}
          <div style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
          }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                background: "linear-gradient(to right, #7c3aed, #2563eb, #06b6d4)",
                color: "white",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.25)",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = "/"}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                backgroundColor: "transparent",
                color: "#d1d5db",
                border: "1px solid #333",
                cursor: "pointer",
              }}
            >
              Go Home
            </button>
          </div>

          {/* Error Digest */}
          {error.digest && (
            <p style={{
              marginTop: "24px",
              fontSize: "11px",
              color: "#4b5563",
            }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
