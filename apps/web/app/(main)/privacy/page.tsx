import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy - Claude Insider",
  description: "Privacy Policy for Claude Insider - how we handle your data and protect your privacy.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main id="main-content" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose prose-invert prose-blue max-w-none">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-400 text-sm mb-8">Last updated: December 15, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              This Privacy Policy explains how Claude Insider (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects your information when you visit our website at www.claudeinsider.com (the &quot;Website&quot;). Claude Insider is a personal project operated by Vladimir Dukelic.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              We are committed to protecting your privacy and being transparent about our practices. This policy complies with applicable privacy laws including the EU General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and the Serbian Law on Personal Data Protection.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Controller</h2>
            <p className="text-gray-300 leading-relaxed">
              The data controller responsible for your personal data is:
            </p>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-300">
                <strong>Vladimir Dukelic</strong><br />
                Email: <a href="mailto:vladimir@dukelic.com" className="text-cyan-400 hover:text-cyan-300">vladimir@dukelic.com</a>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">User Accounts &amp; Authentication</h2>
            <p className="text-gray-300 leading-relaxed">
              Claude Insider offers optional user accounts to enhance your experience. Here&apos;s what data we collect when you create an account:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Account Registration Data</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Email address:</strong> Required for account creation and communication</li>
              <li><strong>Password:</strong> Securely hashed using bcrypt (we never store plain-text passwords)</li>
              <li><strong>OAuth data:</strong> If you sign in with Google or GitHub, we receive your name, email, and profile picture from those services</li>
              <li><strong>Username:</strong> A unique identifier you choose for your public profile</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Profile Information (Optional)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Display name:</strong> Your preferred name shown on the site</li>
              <li><strong>Bio:</strong> A short description about yourself</li>
              <li><strong>Avatar:</strong> Profile picture (uploaded or from OAuth provider)</li>
              <li><strong>Social links:</strong> Links to your Twitter, GitHub, LinkedIn, or personal website</li>
              <li><strong>Location:</strong> Optional location information</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Two-Factor Authentication (2FA)</h3>
            <p className="text-gray-300 leading-relaxed">
              If you enable 2FA for enhanced security:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>TOTP secret:</strong> Encrypted secret key for authenticator apps</li>
              <li><strong>Backup codes:</strong> Hashed recovery codes (10 single-use codes)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Connected Accounts (OAuth)</h3>
            <p className="text-gray-300 leading-relaxed">
              You can link multiple OAuth providers (GitHub, Google) to your account:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Provider ID:</strong> Identifier of the OAuth provider (github, google)</li>
              <li><strong>Account ID:</strong> Your unique ID from the OAuth provider</li>
              <li><strong>Connection date:</strong> When you linked the account</li>
              <li><strong>Access tokens:</strong> Securely stored, used only for authentication</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              You can view, connect, or disconnect OAuth providers anytime in <a href="/settings" className="text-cyan-400 hover:text-cyan-300">Settings</a>. We never access your data on connected platforms beyond basic profile information for authentication.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">User Activity Data</h2>
            <p className="text-gray-300 leading-relaxed">
              When you use features requiring an account, we collect:
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm text-gray-300">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Data Type</th>
                    <th className="px-4 py-2 text-left font-semibold">Purpose</th>
                    <th className="px-4 py-2 text-left font-semibold">Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="px-4 py-2">Comments &amp; Replies</td>
                    <td className="px-4 py-2">Community discussion</td>
                    <td className="px-4 py-2">Until deleted by user or moderation</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Favorites &amp; Collections</td>
                    <td className="px-4 py-2">Save and organize content</td>
                    <td className="px-4 py-2">Until deleted by user</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Edit Suggestions</td>
                    <td className="px-4 py-2">Community contributions</td>
                    <td className="px-4 py-2">Indefinitely (for content improvement)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Ratings &amp; Reviews</td>
                    <td className="px-4 py-2">Content quality feedback</td>
                    <td className="px-4 py-2">Until deleted by user</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Reading Lists</td>
                    <td className="px-4 py-2">Track reading progress</td>
                    <td className="px-4 py-2">Until deleted by user</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Following/Followers</td>
                    <td className="px-4 py-2">Social connections</td>
                    <td className="px-4 py-2">Until unfollowed or account deleted</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Achievements</td>
                    <td className="px-4 py-2">Gamification and recognition</td>
                    <td className="px-4 py-2">Until account deleted</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">AI Conversations</td>
                    <td className="px-4 py-2">Save chat history</td>
                    <td className="px-4 py-2">Until deleted by user</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Search History</td>
                    <td className="px-4 py-2">Quick access to past searches</td>
                    <td className="px-4 py-2">Auto-cleaned after 30 days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Notification Preferences</td>
                    <td className="px-4 py-2">Email and in-app notifications</td>
                    <td className="px-4 py-2">Until account deleted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Keep Your Data Safe</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement comprehensive security measures to protect your data:
            </p>

            <div className="grid gap-4 mt-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Database Security</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                  <li><strong>Supabase + PostgreSQL:</strong> Enterprise-grade database with automatic backups</li>
                  <li><strong>Row Level Security (RLS):</strong> Users can only access their own data</li>
                  <li><strong>Encrypted connections:</strong> All database connections use SSL/TLS</li>
                </ul>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Authentication Security</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                  <li><strong>bcrypt hashing:</strong> Passwords are hashed with bcrypt (cost factor 12)</li>
                  <li><strong>OAuth 2.0:</strong> Secure sign-in via Google and GitHub</li>
                  <li><strong>2FA support:</strong> TOTP-based two-factor authentication</li>
                  <li><strong>Secure sessions:</strong> HTTP-only, secure cookies with SameSite protection</li>
                </ul>
              </div>

              <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-violet-400 mb-2">Application Security</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                  <li><strong>HTTPS only:</strong> All connections are encrypted</li>
                  <li><strong>Content Security Policy:</strong> Prevents XSS attacks</li>
                  <li><strong>CSRF protection:</strong> All forms protected against cross-site request forgery</li>
                  <li><strong>Input validation:</strong> All user inputs are validated and sanitized</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Download Your Data</h2>
            <p className="text-gray-300 leading-relaxed">
              You have the right to download all data we have about you. To export your data:
            </p>

            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li>Go to <a href="/settings" className="text-cyan-400 hover:text-cyan-300">Settings</a></li>
                <li>Scroll to the <strong>&quot;Data Management&quot;</strong> section</li>
                <li>Click <strong>&quot;Export All Data&quot;</strong></li>
                <li>A JSON file will download containing:
                  <ul className="list-disc list-inside ml-6 mt-2 text-gray-400">
                    <li>Your profile information</li>
                    <li>Comments and replies</li>
                    <li>Favorites and collections</li>
                    <li>Edit suggestions</li>
                    <li>Ratings and reviews</li>
                    <li>Reading lists and history</li>
                    <li>AI conversation history</li>
                    <li>Achievements</li>
                    <li>Following/followers list</li>
                    <li>Notification preferences</li>
                  </ul>
                </li>
              </ol>
            </div>

            <p className="text-gray-300 leading-relaxed mt-4">
              The export is provided in a machine-readable JSON format for data portability (GDPR Article 20).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Delete Your Account &amp; Data</h2>
            <p className="text-gray-300 leading-relaxed">
              You can permanently delete your account and all associated data at any time:
            </p>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li>Go to <a href="/settings" className="text-cyan-400 hover:text-cyan-300">Settings</a></li>
                <li>Scroll to the <strong>&quot;Data Management&quot;</strong> section</li>
                <li>Click <strong>&quot;Delete Account&quot;</strong></li>
                <li>Enter your email to confirm</li>
                <li>A confirmation email will be sent with a deletion link</li>
                <li>Click the link within <strong>24 hours</strong> to permanently delete your account</li>
              </ol>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">What Gets Deleted</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Your profile and all personal information</li>
              <li>All comments and replies</li>
              <li>All favorites, collections, and reading lists</li>
              <li>All ratings and reviews</li>
              <li>All AI conversation history</li>
              <li>All achievements and progress</li>
              <li>All following/follower relationships</li>
              <li>All notification preferences</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">What May Be Retained</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Edit suggestions:</strong> May be retained anonymously if approved and merged into content</li>
              <li><strong>Anonymized analytics:</strong> Aggregate statistics (no personal identifiers)</li>
              <li><strong>Legal requirements:</strong> Data required to be kept by law</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Note:</strong> Account deletion is irreversible. We recommend exporting your data first.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
            <p className="text-gray-300 leading-relaxed">
              We use <strong>Vercel Analytics</strong>, a privacy-focused analytics service, to understand how visitors use our website.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">What Vercel Analytics Collects</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Page views:</strong> Which pages are visited</li>
              <li><strong>Referrers:</strong> How visitors found our site</li>
              <li><strong>Geographic location:</strong> Country-level only</li>
              <li><strong>Device information:</strong> Device type, browser, OS</li>
              <li><strong>Web Vitals:</strong> Performance metrics</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">What Vercel Analytics Does NOT Collect</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>No cookies:</strong> Cookie-free analytics</li>
              <li><strong>No personal data:</strong> No names, emails, or identifying info</li>
              <li><strong>No IP addresses:</strong> IPs are not stored</li>
              <li><strong>No cross-site tracking:</strong> No tracking across websites</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">AI Voice Assistant &amp; Chat</h2>
            <p className="text-gray-300 leading-relaxed">
              Our AI features use third-party services:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Third-Party AI Services</h3>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-cyan-400">Anthropic (Claude AI)</strong><br />
                Chat messages are sent to Anthropic&apos;s Claude API. Messages are processed in real-time and not used for model training. See <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Anthropic&apos;s Privacy Policy</a>.
              </p>
              <p className="text-gray-300 leading-relaxed">
                <strong className="text-cyan-400">ElevenLabs (Text-to-Speech)</strong><br />
                Voice output is generated by ElevenLabs. See <a href="https://elevenlabs.io/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">ElevenLabs&apos; Privacy Policy</a>.
              </p>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">AI Conversation Storage</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Guests:</strong> Conversations stored in browser localStorage only</li>
              <li><strong>Logged-in users:</strong> Conversations can optionally be saved to your account for access across devices</li>
              <li><strong>Deletion:</strong> You can delete conversations anytime from the assistant or Settings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Local Storage (Non-Authenticated Users)</h2>
            <p className="text-gray-300 leading-relaxed">
              For visitors without accounts, we use browser localStorage. <strong>This data never leaves your device</strong>:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>Theme preference:</strong> Dark/light/system mode</li>
              <li><strong>Voice settings:</strong> TTS voice and auto-speak preferences</li>
              <li><strong>Chat conversations:</strong> AI assistant history</li>
              <li><strong>Search history:</strong> Recent searches from Unified Search Modal (up to 5)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p className="text-gray-300 leading-relaxed">
              We use minimal cookies to enhance your experience:
            </p>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 text-gray-300">Cookie</th>
                    <th className="text-left py-2 text-gray-300">Purpose</th>
                    <th className="text-left py-2 text-gray-300">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-gray-800">
                    <td className="py-2 font-mono text-cyan-400">NEXT_LOCALE</td>
                    <td className="py-2">Stores your selected language preference (18 languages available)</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 font-mono text-cyan-400">better-auth.session_token</td>
                    <td className="py-2">Authentication session (HTTP-only, secure)</td>
                    <td className="py-2">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Managing cookies:</strong> You can delete cookies anytime through your browser settings.
              Deleting the <code className="text-cyan-400">NEXT_LOCALE</code> cookie will reset your language to the default (English).
              Deleting session cookies will sign you out.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Email Communications</h2>
            <p className="text-gray-300 leading-relaxed">
              We may send you emails for:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>Account verification:</strong> Email confirmation when you register</li>
              <li><strong>Password reset:</strong> When you request a password reset</li>
              <li><strong>Account deletion:</strong> Confirmation link for account deletion</li>
              <li><strong>Security alerts:</strong> Important security notifications (e.g., 2FA changes)</li>
              <li><strong>Notifications:</strong> Comment replies, mentions, suggestion updates (configurable)</li>
              <li><strong>Weekly digest:</strong> Optional summary of activity (opt-in)</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              You can manage email preferences in <a href="/settings" className="text-cyan-400 hover:text-cyan-300">Settings</a>. Transactional emails (verification, password reset, security) cannot be disabled.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-gray-300 leading-relaxed">
              Depending on your location, you have the following rights:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Under GDPR (EU/EEA residents)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Access:</strong> Download all your data (Settings → Data Management)</li>
              <li><strong>Rectification:</strong> Update your profile information anytime</li>
              <li><strong>Erasure:</strong> Delete your account and all data</li>
              <li><strong>Portability:</strong> Export data in machine-readable JSON format</li>
              <li><strong>Restriction:</strong> Contact us to restrict processing</li>
              <li><strong>Objection:</strong> Contact us to object to processing</li>
              <li><strong>Complaint:</strong> Lodge a complaint with your local supervisory authority</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Under CCPA (California residents)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of sale (we do NOT sell your data)</li>
              <li>Right to non-discrimination</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Hosting &amp; Data Location</h2>
            <p className="text-gray-300 leading-relaxed">
              Your data is processed by:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>Vercel:</strong> Website hosting (global CDN)</li>
              <li><strong>Supabase:</strong> Database and authentication (AWS infrastructure)</li>
              <li><strong>Resend:</strong> Email delivery</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              These services may process data in the United States. For EU users, appropriate safeguards (Standard Contractual Clauses) are in place.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Children&apos;s Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Our website is not directed at children under 16 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us for deletion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &quot;Last updated&quot; date. For significant changes, we may notify registered users via email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about this Privacy Policy or want to exercise your data rights:
            </p>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-300">
                <strong>Email:</strong>{" "}
                <a href="mailto:vladimir@dukelic.com" className="text-cyan-400 hover:text-cyan-300">
                  vladimir@dukelic.com
                </a>
              </p>
            </div>
            <p className="text-gray-300 leading-relaxed mt-4">
              We will respond within 30 days as required by applicable law.
            </p>
          </section>

          <section className="mb-8 p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong>In short:</strong> If you create an account, we store your profile, comments, favorites, and activity data in a secure PostgreSQL database with Row Level Security. Your password is hashed with bcrypt. You can link multiple OAuth providers (GitHub, Google) and manage them in Settings. You can <strong>download all your data</strong> or <strong>delete your account</strong> anytime from Settings. We use privacy-focused analytics (no cookies, no personal data). AI chat uses Anthropic&apos;s Claude API. We never sell your data. Guest visitors&apos; data stays in their browser only.
            </p>
          </section>
        </article>
      </main>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
