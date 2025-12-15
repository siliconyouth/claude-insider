import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Terms of Service - Claude Insider",
  description: "Terms of Service for Claude Insider - the rules and guidelines for using our website.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main id="main-content" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose prose-invert prose-blue max-w-none">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-gray-400 text-sm mb-8">Last updated: December 15, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              Welcome to Claude Insider. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the website located at www.claudeinsider.com (the &quot;Website&quot;), operated by Vladimir Dukelic (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              By accessing or using our Website, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              Claude Insider is a free, open-source documentation website providing information, guides, tips, and resources related to Claude AI products. The Website includes:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>34+ documentation pages covering Claude AI usage</li>
              <li>User accounts with profiles, favorites, and social features</li>
              <li>An AI Voice Assistant powered by Claude AI and ElevenLabs TTS</li>
              <li>Interactive code playground</li>
              <li>Community features: comments, ratings, suggestions</li>
              <li>122+ curated resources</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              The Website is provided for educational and informational purposes only.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Important:</strong> Claude Insider is an independent project and is not affiliated with, endorsed by, or officially connected to Anthropic, PBC or any of its subsidiaries or affiliates.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-gray-300 leading-relaxed">
              You may create an account to access additional features. By creating an account, you agree to:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Account Registration</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Keep your password secure and confidential</li>
              <li>Be responsible for all activity under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Account Requirements</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>You must be at least 16 years old to create an account</li>
              <li>One person may maintain only one account</li>
              <li>Accounts created by automated means are not permitted</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Account Termination</h3>
            <p className="text-gray-300 leading-relaxed">
              You may delete your account at any time through Settings → Data Management. We may suspend or terminate your account for:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Violation of these Terms</li>
              <li>Abusive behavior toward other users</li>
              <li>Spam or automated misuse</li>
              <li>Any illegal activity</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Account Security</h3>
            <p className="text-gray-300 leading-relaxed">
              You are responsible for maintaining the security of your account:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Password:</strong> Use a strong password (8+ characters, including uppercase, lowercase, and numbers)</li>
              <li><strong>Connected accounts:</strong> You may link OAuth providers (GitHub, Google) for convenient sign-in</li>
              <li><strong>Managing connections:</strong> You can connect or disconnect OAuth providers in Settings</li>
              <li><strong>Multiple login methods:</strong> We recommend having at least two login methods (password + OAuth or multiple OAuth providers)</li>
              <li><strong>2FA:</strong> Enable two-factor authentication for enhanced security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
            <p className="text-gray-300 leading-relaxed">
              You may submit content including comments, reviews, suggestions, and profile information (&quot;User Content&quot;). By submitting User Content, you agree:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Content Ownership</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>You retain ownership of your User Content</li>
              <li>You grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your User Content on the Website</li>
              <li>This license ends when you delete your content or account (except for content shared with others)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Content Standards</h3>
            <p className="text-gray-300 leading-relaxed">
              Your User Content must NOT:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Be illegal, harmful, threatening, abusive, or harassing</li>
              <li>Contain hate speech or discrimination</li>
              <li>Include personal information of others without consent</li>
              <li>Be spam, advertising, or promotional material</li>
              <li>Infringe any intellectual property rights</li>
              <li>Contain malware or malicious code</li>
              <li>Impersonate any person or entity</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Moderation</h3>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Review, edit, or remove any User Content</li>
              <li>Moderate comments and discussions</li>
              <li>Take action against accounts violating these terms</li>
              <li>Report illegal activity to appropriate authorities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Community Guidelines</h2>
            <p className="text-gray-300 leading-relaxed">
              When interacting with others on Claude Insider, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>Be respectful:</strong> Treat others with respect and courtesy</li>
              <li><strong>Stay on topic:</strong> Keep discussions relevant to Claude AI and documentation</li>
              <li><strong>Be constructive:</strong> Provide helpful feedback and suggestions</li>
              <li><strong>No harassment:</strong> Do not harass, bully, or intimidate others</li>
              <li><strong>No spam:</strong> Do not post repetitive or promotional content</li>
              <li><strong>Report issues:</strong> Report content that violates these guidelines</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data and Privacy</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Data Collection</h3>
            <p className="text-gray-300 leading-relaxed">
              When you create an account, we collect and store your profile information, activity data, and preferences. See our{" "}
              <a href="/privacy" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</a> for complete details.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Data Security</h3>
            <p className="text-gray-300 leading-relaxed">
              We protect your data using:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Secure PostgreSQL database with Row Level Security</li>
              <li>bcrypt password hashing</li>
              <li>HTTPS encryption for all connections</li>
              <li>OAuth 2.0 for social sign-in</li>
              <li>Optional two-factor authentication</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Your Data Rights</h3>
            <p className="text-gray-300 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Access:</strong> Download all your data (Settings → Data Management → Export)</li>
              <li><strong>Correct:</strong> Update your profile information anytime</li>
              <li><strong>Delete:</strong> Permanently delete your account and all data</li>
              <li><strong>Portability:</strong> Export data in JSON format</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Website Content</h3>
            <p className="text-gray-300 leading-relaxed">
              The documentation and code examples are licensed under MIT License with Attribution. You may use, copy, and modify with proper credit.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Third-Party Trademarks</h3>
            <p className="text-gray-300 leading-relaxed">
              &quot;Claude&quot;, &quot;Anthropic&quot;, and related marks are trademarks of Anthropic, PBC. All other trademarks are property of their respective owners.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. AI Features</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.1 AI Voice Assistant</h3>
            <p className="text-gray-300 leading-relaxed">
              The AI assistant uses:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Anthropic Claude AI:</strong> For chat responses (subject to <a href="https://www.anthropic.com/legal/consumer-terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Anthropic&apos;s Terms</a>)</li>
              <li><strong>ElevenLabs:</strong> For text-to-speech (subject to <a href="https://elevenlabs.io/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">ElevenLabs&apos; Terms</a>)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.2 AI Limitations</h3>
            <p className="text-gray-300 leading-relaxed">
              AI responses may be incorrect, incomplete, or outdated. Do not rely on AI for critical decisions. Always verify with official sources.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Code Playground</h3>
            <p className="text-gray-300 leading-relaxed">
              Code executed in the playground runs in a sandboxed browser environment. We are not responsible for any code you execute or its results.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Prohibited Conduct</h2>
            <p className="text-gray-300 leading-relaxed">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Violate any applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to any part of the Website</li>
              <li>Interfere with or disrupt the Website or servers</li>
              <li>Use automated systems to scrape or extract data (except search engines)</li>
              <li>Create multiple accounts for abusive purposes</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Post spam, malware, or malicious content</li>
              <li>Impersonate others or provide false information</li>
              <li>Circumvent rate limits or security measures</li>
              <li>Use the service to generate harmful or illegal content</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-gray-300 leading-relaxed">
              THE WEBSITE AND ITS CONTENT ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Accuracy, reliability, or completeness of content</li>
              <li>Uninterrupted, secure, or error-free operation</li>
              <li>That defects will be corrected</li>
              <li>Fitness for any particular purpose</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              TO THE FULLEST EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Direct, indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, data, use, or goodwill</li>
              <li>Damages from your use of or inability to use the Website</li>
              <li>Damages from User Content or third-party services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
            <p className="text-gray-300 leading-relaxed">
              You agree to indemnify and hold harmless Vladimir Dukelic and any contributors from claims, damages, losses, or expenses arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Your use of the Website</li>
              <li>Your violation of these Terms</li>
              <li>Your User Content</li>
              <li>Your violation of any third-party rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Modifications to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We may modify these Terms at any time. Changes will be posted with an updated &quot;Last updated&quot; date. For material changes affecting registered users, we will provide notice via email or in-app notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms are governed by the laws of the Republic of Serbia. Any disputes shall be subject to the exclusive jurisdiction of Serbian courts.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>For EU/EEA residents:</strong> Your local consumer protection rights are preserved. You may bring proceedings in your local courts.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>For California residents:</strong> You retain rights under applicable state consumer protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about these Terms:
            </p>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-300">
                <strong>Vladimir Dukelic</strong><br />
                Email: <a href="mailto:vladimir@dukelic.com" className="text-cyan-400 hover:text-cyan-300">vladimir@dukelic.com</a><br />
                GitHub: <a href="https://github.com/siliconyouth/claude-insider" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">github.com/siliconyouth/claude-insider</a>
              </p>
            </div>
          </section>

          <section className="mb-8 p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong>In short:</strong> Claude Insider is free, open-source documentation with user accounts, social features, and AI assistance. You can sign in with email/password or OAuth (GitHub, Google) and manage your connected accounts in Settings. Be respectful in comments and discussions. You can export or delete your data anytime from Settings. We&apos;re not affiliated with Anthropic. Content is provided &quot;as is&quot; — always verify with official sources. Serbian law governs these terms, but your local consumer rights are preserved.
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
