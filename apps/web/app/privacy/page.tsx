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
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong>We do not collect any personal data.</strong> Our website is designed with privacy in mind:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>No cookies:</strong> We do not use cookies or similar tracking technologies</li>
              <li><strong>No analytics:</strong> We do not use any analytics services</li>
              <li><strong>No user accounts:</strong> We do not require registration or collect login information</li>
              <li><strong>No forms:</strong> We do not collect information through contact forms</li>
              <li><strong>No tracking:</strong> We do not track your browsing behavior</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Local Storage</h2>
            <p className="text-gray-300 leading-relaxed">
              We use your browser&apos;s local storage solely to remember your theme preference (dark, light, or system mode). This data:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Is stored only on your device</li>
              <li>Is never transmitted to our servers</li>
              <li>Can be cleared by you at any time through your browser settings</li>
              <li>Contains no personally identifiable information</li>
            </ul>
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
              <strong>In short:</strong> We respect your privacy. We don&apos;t collect your personal data, we don&apos;t use cookies, we don&apos;t track you, and we don&apos;t sell any information. Your theme preference is stored locally on your device. That&apos;s it.
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
