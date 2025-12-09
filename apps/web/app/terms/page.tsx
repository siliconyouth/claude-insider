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
        <article className="prose prose-invert prose-orange max-w-none">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-gray-400 text-sm mb-8">Last updated: December 9, 2025</p>

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
              Claude Insider is a free, open-source documentation website providing information, guides, tips, and resources related to Claude AI products. The Website is provided for educational and informational purposes only.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Important:</strong> Claude Insider is an independent project and is not affiliated with, endorsed by, or officially connected to Anthropic, PBC or any of its subsidiaries or affiliates. &quot;Claude&quot; and related marks are trademarks of Anthropic.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By using this Website, you confirm that:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>You have read and understood these Terms</li>
              <li>You agree to be bound by these Terms</li>
              <li>You have the legal capacity to enter into this agreement</li>
              <li>If acting on behalf of an organization, you have authority to bind that organization to these Terms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Permitted Use</h2>
            <p className="text-gray-300 leading-relaxed">
              You may use our Website for lawful purposes only. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Use the Website in compliance with all applicable laws and regulations</li>
              <li>Not attempt to gain unauthorized access to any part of the Website</li>
              <li>Not use the Website in any way that could damage, disable, or impair its functionality</li>
              <li>Not use automated systems or software to extract data from the Website (except for search engine indexing)</li>
              <li>Not reproduce, duplicate, or copy the Website for commercial purposes without proper attribution as required by our license</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Website Content</h3>
            <p className="text-gray-300 leading-relaxed">
              The content on this Website, including text, documentation, code examples, graphics, and design, is licensed under the MIT License with Attribution. You are free to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Use, copy, modify, and distribute the content</li>
              <li>Use the content for commercial and non-commercial purposes</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Attribution Required:</strong> When using our content, you must provide a link to the original repository (https://github.com/siliconyouth/claude-insider) and credit the author (Vladimir Dukelic).
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Third-Party Trademarks</h3>
            <p className="text-gray-300 leading-relaxed">
              &quot;Claude&quot;, &quot;Anthropic&quot;, and related logos and marks are trademarks of Anthropic, PBC. All other trademarks, service marks, and logos used on this Website are the property of their respective owners. Use of these marks does not imply endorsement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Contributions</h2>
            <p className="text-gray-300 leading-relaxed">
              If you contribute to Claude Insider through GitHub (pull requests, issues, discussions), you agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Your contributions will be licensed under the same MIT License with Attribution</li>
              <li>You have the right to submit the contribution and grant this license</li>
              <li>Your contribution does not infringe any third-party rights</li>
              <li>We may use, modify, or reject your contribution at our discretion</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-gray-300 leading-relaxed">
              THE WEBSITE AND ITS CONTENT ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Warranties of merchantability or fitness for a particular purpose</li>
              <li>Warranties of accuracy, reliability, or completeness of content</li>
              <li>Warranties that the Website will be uninterrupted, secure, or error-free</li>
              <li>Warranties that defects will be corrected</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              The documentation and guides on this Website are for informational purposes only. We make no guarantees about the accuracy or currentness of information, as Claude AI products may change over time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL VLADIMIR DUKELIC, OR ANY CONTRIBUTORS TO THIS PROJECT, BE LIABLE FOR ANY:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Direct, indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
              <li>Damages resulting from your access to or use of (or inability to access or use) the Website</li>
              <li>Damages resulting from any content obtained from the Website</li>
              <li>Damages resulting from unauthorized access to or alteration of your transmissions or data</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              This limitation applies regardless of the legal theory (contract, tort, or otherwise) and even if we have been advised of the possibility of such damages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
            <p className="text-gray-300 leading-relaxed">
              You agree to indemnify and hold harmless Vladimir Dukelic and any contributors from any claims, damages, losses, liabilities, costs, or expenses (including reasonable attorneys&apos; fees) arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Your use of the Website</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Any content you submit or contribute</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Privacy and Analytics</h2>
            <p className="text-gray-300 leading-relaxed">
              Your privacy is important to us. Our use of data is governed by our{" "}
              <a href="/privacy" className="text-orange-400 hover:text-orange-300">Privacy Policy</a>,
              which is incorporated into these Terms by reference.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.1 Analytics</h3>
            <p className="text-gray-300 leading-relaxed">
              We use Vercel Analytics, a privacy-focused analytics service. By using this Website, you acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Anonymous usage data (page views, referrers, country, device type) is collected</li>
              <li>No cookies are used for analytics</li>
              <li>No personal data or IP addresses are stored</li>
              <li>No cross-site tracking occurs</li>
              <li>Data is not sold to third parties</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.2 Local Storage</h3>
            <p className="text-gray-300 leading-relaxed">
              We use browser local storage solely to remember your theme preference (dark/light mode). This data remains on your device and is never transmitted to our servers.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.3 Security</h3>
            <p className="text-gray-300 leading-relaxed">
              We implement security measures including HTTPS encryption, Content Security Policy, and other protective headers to ensure a safe browsing experience.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. External Links</h2>
            <p className="text-gray-300 leading-relaxed">
              The Website may contain links to external websites or resources. We are not responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>The availability or accuracy of such external sites or resources</li>
              <li>The content, products, or services on or available from such sites</li>
              <li>Any damage or loss caused by your use of external sites</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Modifications to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Website with an updated &quot;Last updated&quot; date. Your continued use of the Website after any changes constitutes acceptance of the new Terms.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              We encourage you to review these Terms periodically for any updates.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Termination</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to terminate or restrict your access to the Website at any time, without notice, for any reason, including violation of these Terms. Upon termination, your right to use the Website will immediately cease.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law and Jurisdiction</h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the Republic of Serbia, without regard to its conflict of law provisions.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              Any disputes arising from these Terms or your use of the Website shall be subject to the exclusive jurisdiction of the courts of the Republic of Serbia.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>For EU/EEA residents:</strong> Nothing in these Terms affects your rights under mandatory consumer protection laws in your country of residence. You may also have the right to bring proceedings in your local courts.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>For US residents:</strong> You retain any rights under applicable state consumer protection laws. California residents may have additional rights under the California Consumer Privacy Act (CCPA).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Severability</h2>
            <p className="text-gray-300 leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Entire Agreement</h2>
            <p className="text-gray-300 leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding your use of the Website and supersede any prior agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17. Contact Information</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions or concerns about these Terms of Service, please contact us at:
            </p>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-300">
                <strong>Vladimir Dukelic</strong><br />
                Email: <a href="mailto:vladimir@dukelic.com" className="text-orange-400 hover:text-orange-300">vladimir@dukelic.com</a><br />
                GitHub: <a href="https://github.com/siliconyouth/claude-insider" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">github.com/siliconyouth/claude-insider</a>
              </p>
            </div>
          </section>

          <section className="mb-8 p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong>In short:</strong> Claude Insider is free, open-source documentation. You can use and share it with attribution. We&apos;re not affiliated with Anthropic. The content is provided &quot;as is&quot; without warranties. Serbian law governs these terms, but your local consumer rights are preserved.
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
