/**
 * Email Test Section
 *
 * Tests email sending functionality for donation receipts and welcome emails.
 */

import { cn } from "@/lib/design-system";

interface EmailTestResult {
  success: boolean;
  type: string;
  recipient: string;
  error?: string;
  timestamp: string;
}

interface EmailTestSectionProps {
  isLoadingEmailTest: boolean;
  emailTestResult: EmailTestResult | null;
  sendTestEmail: (type: "donation" | "welcome") => void;
}

export function EmailTestSection({
  isLoadingEmailTest,
  emailTestResult,
  sendTestEmail,
}: EmailTestSectionProps) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-blue-500">✉️</span>
        Email Sending Test
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Send test emails to your account to verify email configuration. Requires
        admin role.
      </p>
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={() => sendTestEmail("donation")}
          disabled={isLoadingEmailTest}
          className={cn(
            "px-4 py-2.5 rounded-lg font-medium transition-all",
            "bg-gradient-to-r from-pink-600 to-rose-600",
            "hover:from-pink-700 hover:to-rose-700",
            "text-white shadow-lg shadow-pink-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center gap-2"
          )}
        >
          {isLoadingEmailTest ? (
            <>
              <span className="animate-spin">⏳</span>
              Sending...
            </>
          ) : (
            <>
              <span>💜</span>
              Send Donation Receipt
            </>
          )}
        </button>
        <button
          onClick={() => sendTestEmail("welcome")}
          disabled={isLoadingEmailTest}
          className={cn(
            "px-4 py-2.5 rounded-lg font-medium transition-all",
            "bg-gradient-to-r from-violet-600 to-blue-600",
            "hover:from-violet-700 hover:to-blue-700",
            "text-white shadow-lg shadow-violet-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center gap-2"
          )}
        >
          {isLoadingEmailTest ? (
            <>
              <span className="animate-spin">⏳</span>
              Sending...
            </>
          ) : (
            <>
              <span>👋</span>
              Send Welcome Email
            </>
          )}
        </button>
      </div>
      {emailTestResult && (
        <div
          className={cn(
            "p-4 rounded-lg text-sm",
            emailTestResult.success
              ? "bg-emerald-500/10 border border-emerald-500/30"
              : "bg-red-500/10 border border-red-500/30"
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "text-lg",
                emailTestResult.success ? "text-emerald-400" : "text-red-400"
              )}
            >
              {emailTestResult.success ? "✓" : "✗"}
            </span>
            <div>
              <p
                className={cn(
                  "font-medium",
                  emailTestResult.success ? "text-emerald-300" : "text-red-300"
                )}
              >
                {emailTestResult.success
                  ? "Email sent successfully!"
                  : "Failed to send email"}
              </p>
              <p className="text-gray-400 mt-1">
                {emailTestResult.success
                  ? `${emailTestResult.type === "donation" ? "Donation receipt" : "Welcome email"} sent to ${emailTestResult.recipient}`
                  : emailTestResult.error}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {new Date(emailTestResult.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
