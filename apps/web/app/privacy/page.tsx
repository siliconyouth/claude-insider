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
        <article className="prose prose-invert prose-orange max-w-none">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-400 text-sm mb-8">Last updated: December 9, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              This Privacy Policy explains how Claude Insider (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) handles information when you visit our website at www.claudeinsider.com (the &quot;Website&quot;). Claude Insider is a personal project operated by Vladimir Dukelic.
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
                Email: <a href="mailto:vladimir@dukelic.com" className="text-orange-400 hover:text-orange-300">vladimir@dukelic.com</a>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
            <p className="text-gray-300 leading-relaxed">
              We use <strong>Vercel Analytics</strong>, a privacy-focused analytics service, to understand how visitors use our website. This helps us improve the content and user experience.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">What Vercel Analytics Collects</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Page views:</strong> Which pages are visited</li>
              <li><strong>Referrers:</strong> How visitors found our site (e.g., search engine, direct link)</li>
              <li><strong>Geographic location:</strong> Country-level only (not city or precise location)</li>
              <li><strong>Device information:</strong> Device type (desktop, mobile, tablet), browser, and operating system</li>
              <li><strong>Web Vitals:</strong> Performance metrics (page load time, interactivity, visual stability)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">What Vercel Analytics Does NOT Collect</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>No cookies:</strong> Vercel Analytics is cookie-free</li>
              <li><strong>No personal data:</strong> No names, emails, or identifying information</li>
              <li><strong>No IP addresses:</strong> IP addresses are not stored or logged</li>
              <li><strong>No cross-site tracking:</strong> Your activity is not tracked across other websites</li>
              <li><strong>No fingerprinting:</strong> No browser or device fingerprinting techniques</li>
              <li><strong>No data selling:</strong> Analytics data is never sold to third parties</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Privacy Compliance</h3>
            <p className="text-gray-300 leading-relaxed">
              Vercel Analytics is designed to be privacy-compliant:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>GDPR compliant:</strong> No consent banner required as no personal data is collected</li>
              <li><strong>CCPA compliant:</strong> No personal information is sold or shared</li>
              <li><strong>Cookie-free:</strong> No cookie consent needed</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              For more information, see{" "}
              <a
                href="https://vercel.com/docs/analytics/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300"
              >
                Vercel Analytics Privacy Policy
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">AI Voice Assistant</h2>
            <p className="text-gray-300 leading-relaxed">
              Our website features an AI Voice Assistant that provides an interactive way to explore documentation. Here&apos;s how your data is handled when using this feature:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">What Data Is Processed</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Chat messages:</strong> Your questions and the assistant&apos;s responses are processed to provide answers</li>
              <li><strong>Voice input:</strong> When using speech-to-text, your voice is converted to text using your browser&apos;s Web Speech API (processed locally by your browser)</li>
              <li><strong>Text-to-speech:</strong> Assistant responses can be read aloud using ElevenLabs TTS API</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Third-Party AI Services</h3>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-orange-400">Anthropic (Claude AI)</strong><br />
                Your chat messages are sent to Anthropic&apos;s Claude API for processing. Anthropic processes your messages in accordance with their{" "}
                <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">Privacy Policy</a>.
                Messages are used to generate responses only and are not used to train models when using the API.
              </p>
              <p className="text-gray-300 leading-relaxed">
                <strong className="text-orange-400">ElevenLabs (Text-to-Speech)</strong><br />
                When you use the voice output feature, text is sent to ElevenLabs for speech synthesis. ElevenLabs processes this data in accordance with their{" "}
                <a href="https://elevenlabs.io/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">Privacy Policy</a>.
              </p>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">Data Retention</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Chat history:</strong> Stored only in your browser&apos;s memory during the session; cleared when you close the page or click &quot;Clear&quot;</li>
              <li><strong>Voice preference:</strong> Your selected voice is saved to localStorage for convenience</li>
              <li><strong>No server storage:</strong> We do not store your conversations on our servers</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Speech Recognition</h3>
            <p className="text-gray-300 leading-relaxed">
              Voice input uses your browser&apos;s built-in Web Speech API. This means:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Speech processing may be handled by your browser vendor (Google, Apple, Microsoft, etc.)</li>
              <li>We do not receive or store your audio recordings</li>
              <li>You can use the assistant in text-only mode by typing instead of speaking</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Local Storage</h2>
            <p className="text-gray-300 leading-relaxed">
              We use your browser&apos;s local storage to enhance your experience with the following features:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Data We Store Locally</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Theme preference:</strong> Your chosen display mode (dark, light, or system)</li>
              <li><strong>Search history:</strong> Your recent search queries (up to 5 items) for quick access</li>
              <li><strong>Language preference:</strong> Your selected language for future i18n support</li>
              <li><strong>Voice preference:</strong> Your selected TTS voice for the AI assistant</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Important Privacy Notes</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>All data is stored <strong>only on your device</strong></li>
              <li>Data is <strong>never transmitted</strong> to our servers</li>
              <li>You can clear this data anytime through your browser settings</li>
              <li>None of this data contains personally identifiable information</li>
              <li>Search history can be cleared directly from the search interface</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Storage Keys Used</h3>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <ul className="space-y-1 text-gray-300 font-mono text-sm">
                <li>• <code className="text-orange-400">theme</code> - Theme preference</li>
                <li>• <code className="text-orange-400">claude-insider-search-history</code> - Recent searches</li>
                <li>• <code className="text-orange-400">claude-insider-locale</code> - Language preference</li>
                <li>• <code className="text-orange-400">claude-insider-voice</code> - TTS voice preference</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Hosting Provider</h2>
            <p className="text-gray-300 leading-relaxed">
              Our website is hosted by Vercel Inc. When you visit our website, Vercel may automatically collect certain technical information as part of standard web hosting, including:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>IP address (for security and to serve content)</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Date and time of access</li>
              <li>Pages visited</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              This data is processed by Vercel in accordance with their{" "}
              <a
                href="https://vercel.com/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300"
              >
                Privacy Policy
              </a>
              . We do not have access to individual-level data collected by Vercel.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Security Measures</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement the following security measures to protect your browsing experience:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>HTTPS only:</strong> All connections are encrypted</li>
              <li><strong>Content Security Policy:</strong> Prevents XSS attacks and unauthorized scripts</li>
              <li><strong>X-Frame-Options:</strong> Prevents clickjacking attacks</li>
              <li><strong>Permissions Policy:</strong> Restricts feature access; microphone is enabled only for voice assistant (self)</li>
              <li><strong>No FLoC:</strong> We opt out of Google&apos;s Federated Learning of Cohorts tracking</li>
              <li><strong>API Security:</strong> All API communications with third-party services use encrypted connections</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-gray-300 leading-relaxed">
              Depending on your location, you may have certain rights regarding your personal data:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Under GDPR (EU/EEA residents)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Under CCPA (California residents)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information (we do not sell data)</li>
              <li>Right to non-discrimination for exercising your rights</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Under Serbian Law on Personal Data Protection</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Right to be informed about data processing</li>
              <li>Right to access your personal data</li>
              <li>Right to rectification and erasure</li>
              <li>Right to restrict processing</li>
              <li>Right to lodge a complaint with the Commissioner for Information of Public Importance and Personal Data Protection</li>
            </ul>

            <p className="text-gray-300 leading-relaxed mt-6">
              Since we do not collect personal data, these rights are generally not applicable. However, if you believe we hold any of your personal data or have any privacy concerns, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Children&apos;s Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Our website is not directed at children under 16 years of age. We do not knowingly collect personal information from children. Since we do not collect any personal data, no special measures are required.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
            <p className="text-gray-300 leading-relaxed">
              Our website is hosted on Vercel&apos;s global infrastructure. As we do not collect personal data, there are no concerns regarding international data transfers from our end. Vercel&apos;s data handling practices are described in their privacy policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated &quot;Last updated&quot; date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-300">
                <strong>Email:</strong>{" "}
                <a href="mailto:vladimir@dukelic.com" className="text-orange-400 hover:text-orange-300">
                  vladimir@dukelic.com
                </a>
              </p>
            </div>
            <p className="text-gray-300 leading-relaxed mt-4">
              We will respond to your inquiry as soon as possible and within the timeframes required by applicable law (typically within 30 days).
            </p>
          </section>

          <section className="mb-8 p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong>In short:</strong> We respect your privacy. We use cookie-free, privacy-focused analytics (Vercel Analytics) that collects only anonymous usage data. We don&apos;t collect personal information, we don&apos;t use cookies, we don&apos;t track you across sites, and we don&apos;t sell any data. Your preferences (theme, search history, language, voice) are stored locally on your device. The AI Voice Assistant uses Anthropic&apos;s Claude for chat and ElevenLabs for text-to-speech; chat history is session-only and not stored on our servers. Speech recognition uses your browser&apos;s built-in API.
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
