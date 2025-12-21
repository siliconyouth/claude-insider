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
          <p className="text-gray-400 text-sm mb-8">Last updated: December 16, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              Welcome to Claude Insider. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the website located at www.claudeinsider.com (the &quot;Website&quot;), operated by Vladimir Dukelic (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) from the Republic of Serbia.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              By accessing or using our Website, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Website.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              These Terms are provided in English as the primary language. While translations may be available for convenience, the English version shall prevail in case of any discrepancy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Legal Framework and Jurisdiction</h2>
            <p className="text-gray-300 leading-relaxed">
              This Website operates under a multi-jurisdictional legal framework:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Primary Jurisdiction (Serbia)</h3>
            <p className="text-gray-300 leading-relaxed">
              These Terms are governed by the laws of the Republic of Serbia, including:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Zakon o obligacionim odnosima</strong> (Law on Obligations)</li>
              <li><strong>Zakon o elektronskoj trgovini</strong> (Electronic Commerce Act)</li>
              <li><strong>Zakon o zaštiti potrošača</strong> (Consumer Protection Act)</li>
              <li><strong>Zakon o zaštiti podataka o ličnosti</strong> (Personal Data Protection Act)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 International Compliance</h3>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm text-gray-300 border border-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Jurisdiction</th>
                    <th className="px-4 py-2 text-left font-semibold">Applicable Laws</th>
                    <th className="px-4 py-2 text-left font-semibold">Your Rights Preserved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="px-4 py-2">Serbia (Primary)</td>
                    <td className="px-4 py-2">Serbian civil and consumer law</td>
                    <td className="px-4 py-2">Full domestic rights</td>
                  </tr>
                  <tr className="bg-gray-800/20">
                    <td className="px-4 py-2">European Union / EEA</td>
                    <td className="px-4 py-2">Consumer Rights Directive, Digital Services Act, GDPR</td>
                    <td className="px-4 py-2">Right of withdrawal, transparent terms, local courts</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">United States</td>
                    <td className="px-4 py-2">State consumer protection laws, Section 230</td>
                    <td className="px-4 py-2">State-specific consumer rights</td>
                  </tr>
                  <tr className="bg-gray-800/20">
                    <td className="px-4 py-2">California</td>
                    <td className="px-4 py-2">CCPA/CPRA, Consumers Legal Remedies Act</td>
                    <td className="px-4 py-2">CCPA data rights, specific consumer protections</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Other Jurisdictions</td>
                    <td className="px-4 py-2">Local mandatory consumer protection laws</td>
                    <td className="px-4 py-2">Non-waivable statutory rights preserved</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Dispute Resolution</h3>
            <p className="text-gray-300 leading-relaxed">
              We prefer to resolve disputes amicably. Before initiating legal proceedings:
            </p>
            <ol className="list-decimal list-inside space-y-2 mt-2 text-gray-300">
              <li>Contact us at vladimir@dukelic.com to discuss your concern</li>
              <li>We will respond within 30 days with a proposed resolution</li>
              <li>If unresolved, EU/EEA residents may use the EU Online Dispute Resolution platform at{" "}
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
                  ec.europa.eu/consumers/odr
                </a>
              </li>
              <li>Legal proceedings may be brought in Serbian courts, or for EU/EEA consumers, in your local courts</li>
            </ol>

            <h3 className="text-xl font-semibold mt-6 mb-3">2.4 International Arbitration Option</h3>
            <p className="text-gray-300 leading-relaxed">
              For non-consumer disputes, parties may mutually agree to binding arbitration under the rules of the Belgrade Arbitration Center or an internationally recognized arbitration body. This option does not apply to individual consumers asserting their statutory rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              Claude Insider is a free, open-source documentation website providing information, guides, tips, and resources related to Claude AI products. The Website includes:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>34+ documentation pages covering Claude AI usage</li>
              <li>User accounts with profiles, favorites, and social features</li>
              <li>An AI Voice Assistant powered by Claude AI and ElevenLabs TTS</li>
              <li>End-to-end encrypted direct messaging</li>
              <li>Interactive code playground</li>
              <li>Community features: comments, ratings, suggestions</li>
              <li>1,950+ curated resources</li>
              <li>Donation system supporting the project</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              The Website is provided for educational and informational purposes only.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Important:</strong> Claude Insider is an independent project and is not affiliated with, endorsed by, or officially connected to Anthropic, PBC or any of its subsidiaries or affiliates.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. User Accounts</h2>
            <p className="text-gray-300 leading-relaxed">
              You may create an account to access additional features. By creating an account, you agree to:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Account Registration</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Keep your password secure and confidential</li>
              <li>Be responsible for all activity under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Account Requirements</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>You must be at least 16 years old to create an account (or the age of digital consent in your jurisdiction)</li>
              <li>One person may maintain only one account</li>
              <li>Accounts created by automated means are not permitted</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Account Termination</h3>
            <p className="text-gray-300 leading-relaxed">
              You may delete your account at any time through Settings → Data Management. We may suspend or terminate your account for:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Violation of these Terms</li>
              <li>Abusive behavior toward other users</li>
              <li>Spam or automated misuse</li>
              <li>Any illegal activity</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Upon termination, you may request a copy of your data before deletion (see Data Portability in our{" "}
              <a href="/privacy" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</a>).
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Account Security</h3>
            <p className="text-gray-300 leading-relaxed">
              You are responsible for maintaining the security of your account:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Password:</strong> Use a strong password (8+ characters, including uppercase, lowercase, and numbers)</li>
              <li><strong>Connected accounts:</strong> You may link OAuth providers (GitHub, Google) for convenient sign-in</li>
              <li><strong>Passkeys:</strong> You may register WebAuthn passkeys for passwordless authentication</li>
              <li><strong>2FA:</strong> Enable two-factor authentication for enhanced security</li>
              <li><strong>Multiple login methods:</strong> We recommend having at least two login methods</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. End-to-End Encrypted Messaging</h2>
            <p className="text-gray-300 leading-relaxed">
              Claude Insider offers end-to-end encrypted (E2EE) direct messaging using the Matrix Olm/Megolm protocol. By using this feature, you agree to the following terms:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Key Management Responsibility</h3>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-4">
              <p className="text-gray-300 leading-relaxed">
                <strong className="text-amber-400">Important:</strong> Your private encryption keys are stored only on your device(s). We do not have access to your private keys and cannot decrypt your messages. If you lose all your devices and have not set up cloud key backup, your encrypted messages will be permanently unrecoverable.
              </p>
            </div>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>Device keys:</strong> Each device generates its own key pair. Private keys never leave your device</li>
              <li><strong>You are solely responsible</strong> for backing up your keys and maintaining access to your devices</li>
              <li><strong>Lost keys = lost messages:</strong> We cannot recover encrypted messages if you lose your keys</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Cloud Key Backup</h3>
            <p className="text-gray-300 leading-relaxed">
              You may optionally enable cloud key backup:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Your keys are encrypted with a password you choose using AES-256-GCM</li>
              <li>The encrypted backup is stored on our servers</li>
              <li>We cannot decrypt your backup without your password</li>
              <li><strong>Forgotten password:</strong> If you forget your backup password, we cannot recover your keys</li>
              <li>You may delete your cloud backup at any time from Settings</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Device Verification</h3>
            <p className="text-gray-300 leading-relaxed">
              For maximum security, you should verify your devices:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Compare emoji sequences between devices to confirm authenticity</li>
              <li>Unverified devices may have limited functionality</li>
              <li>You can revoke compromised devices from Settings</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.4 AI Assistant Access to Encrypted Messages</h3>
            <p className="text-gray-300 leading-relaxed">
              By default, the AI Assistant cannot read your encrypted messages. You may optionally grant access:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Explicit consent required:</strong> You must actively opt-in for AI access to each conversation</li>
              <li><strong>Temporary decryption:</strong> Messages are decrypted in memory only when you use AI features</li>
              <li><strong>Revocable:</strong> You can revoke AI access at any time</li>
              <li><strong>Not shared:</strong> AI-processed content is not stored or used for training</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">5.5 E2EE Limitations</h3>
            <p className="text-gray-300 leading-relaxed">
              We disclaim liability for:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Lost messages due to key loss (backup your keys!)</li>
              <li>Security breaches on your personal devices</li>
              <li>Messages sent to unverified or compromised devices</li>
              <li>Third-party device security vulnerabilities</li>
              <li>Metadata (we can see who you message and when, but not content)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Donations and Support</h2>
            <p className="text-gray-300 leading-relaxed">
              Claude Insider is a free, open-source project. We offer optional donations to support continued development.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Donation Methods</h3>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm text-gray-300 border border-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Method</th>
                    <th className="px-4 py-2 text-left font-semibold">Terms</th>
                    <th className="px-4 py-2 text-left font-semibold">Processing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="px-4 py-2">PayPal</td>
                    <td className="px-4 py-2">Subject to{" "}
                      <a href="https://www.paypal.com/legalhub/useragreement-full" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
                        PayPal User Agreement
                      </a>
                    </td>
                    <td className="px-4 py-2">Instant</td>
                  </tr>
                  <tr className="bg-gray-800/20">
                    <td className="px-4 py-2">Bank Transfer</td>
                    <td className="px-4 py-2">Subject to your bank&apos;s terms</td>
                    <td className="px-4 py-2">1-5 business days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Refund Policy</h3>
            <p className="text-gray-300 leading-relaxed">
              Donations are voluntary contributions and are generally non-refundable. However:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Duplicate charges:</strong> We will refund accidental duplicate donations</li>
              <li><strong>Technical errors:</strong> Refunds available for processing errors</li>
              <li><strong>Within 14 days:</strong> EU/EEA consumers may request refunds within 14 days under the right of withdrawal</li>
              <li>Contact vladimir@dukelic.com for refund requests</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Donor Badges and Recognition</h3>
            <p className="text-gray-300 leading-relaxed">
              Donors receive recognition badges based on cumulative contribution:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Bronze:</strong> $10+ cumulative</li>
              <li><strong>Silver:</strong> $50+ cumulative</li>
              <li><strong>Gold:</strong> $100+ cumulative</li>
              <li><strong>Platinum:</strong> $500+ cumulative</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Badges are cosmetic only and do not grant additional rights or privileges. You may opt to remain anonymous on the donor wall.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.4 Tax Disclaimer</h3>
            <p className="text-gray-300 leading-relaxed">
              Claude Insider is not a registered charity. Donations are not tax-deductible. We provide donation receipts for your records, but you are responsible for any tax implications in your jurisdiction. Consult a tax professional if needed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. User Content</h2>
            <p className="text-gray-300 leading-relaxed">
              You may submit content including comments, reviews, suggestions, direct messages, and profile information (&quot;User Content&quot;). By submitting User Content, you agree:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Content Ownership</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>You retain ownership of your User Content</li>
              <li>You grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your User Content on the Website</li>
              <li>This license ends when you delete your content or account (except for content shared with others)</li>
              <li>Encrypted messages are only stored in encrypted form; we have no license to the decrypted content</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Content Standards</h3>
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
              <li>Violate export controls or sanctions</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Moderation</h3>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Review, edit, or remove any User Content (except encrypted messages we cannot access)</li>
              <li>Moderate comments and discussions</li>
              <li>Take action against accounts violating these terms</li>
              <li>Report illegal activity to appropriate authorities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Digital Services Act Compliance (EU)</h2>
            <p className="text-gray-300 leading-relaxed">
              For users in the European Union, we comply with the Digital Services Act (DSA) Regulation (EU) 2022/2065:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.1 Content Moderation</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Transparency:</strong> Our content moderation policies are described in Section 7 (User Content)</li>
              <li><strong>No algorithmic promotion:</strong> We do not use recommendation algorithms that could amplify harmful content</li>
              <li><strong>Human review:</strong> Content flagging is reviewed by human moderators</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Notice and Action</h3>
            <p className="text-gray-300 leading-relaxed">
              If you believe content violates the law or these Terms:
            </p>
            <ol className="list-decimal list-inside space-y-2 mt-2 text-gray-300">
              <li>Email vladimir@dukelic.com with details of the alleged violation</li>
              <li>Include the URL of the content and explanation of the issue</li>
              <li>We will acknowledge receipt within 24 hours</li>
              <li>We will review and act on valid notices without undue delay</li>
            </ol>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.3 Appeal Mechanism</h3>
            <p className="text-gray-300 leading-relaxed">
              If your content is removed or your account is restricted:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>You will receive a notification explaining the reason</li>
              <li>You may appeal within 14 days by emailing vladimir@dukelic.com</li>
              <li>Appeals are reviewed by a different person than the original decision-maker</li>
              <li>We will respond to appeals within 14 days</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.4 Trusted Flaggers</h3>
            <p className="text-gray-300 leading-relaxed">
              We accept reports from EU-designated trusted flaggers. Their reports are processed with priority.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">8.5 Point of Contact</h3>
            <p className="text-gray-300 leading-relaxed">
              For DSA-related matters:
            </p>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-300">
                <strong>Vladimir Dukelic</strong><br />
                Email: <a href="mailto:vladimir@dukelic.com" className="text-cyan-400 hover:text-cyan-300">vladimir@dukelic.com</a><br />
                Response time: Within 24 hours for urgent matters
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Community Guidelines</h2>
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
              <li><strong>Respect encryption:</strong> Do not share others&apos; private messages without consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Data and Privacy</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.1 Data Collection</h3>
            <p className="text-gray-300 leading-relaxed">
              When you create an account, we collect and store your profile information, activity data, and preferences. See our{" "}
              <a href="/privacy" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</a> for complete details.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.2 Data Security</h3>
            <p className="text-gray-300 leading-relaxed">
              We protect your data using:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Secure PostgreSQL database with Row Level Security</li>
              <li>bcrypt password hashing</li>
              <li>HTTPS encryption for all connections</li>
              <li>OAuth 2.0 for social sign-in</li>
              <li>Optional two-factor authentication</li>
              <li>End-to-end encryption for direct messages</li>
              <li>AES-256-GCM encryption for stored API keys</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">10.3 Your Data Rights</h3>
            <p className="text-gray-300 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Access:</strong> Download all your data (Settings → Data Management → Export)</li>
              <li><strong>Correct:</strong> Update your profile information anytime</li>
              <li><strong>Delete:</strong> Permanently delete your account and all data</li>
              <li><strong>Portability:</strong> Export data in JSON format</li>
              <li><strong>Restrict:</strong> Request limitation of processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Intellectual Property and Open Source License</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.1 MIT License with Attribution</h3>
            <p className="text-gray-300 leading-relaxed">
              Claude Insider is open-source software licensed under the MIT License with Attribution requirements:
            </p>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4 font-mono text-sm">
              <p className="text-gray-300">
                Copyright (c) 2025 Vladimir Dukelic (vladimir@dukelic.com)<br /><br />
                Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the &quot;Software&quot;), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:<br /><br />
                The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
              </p>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.2 Attribution Requirements</h3>
            <p className="text-gray-300 leading-relaxed">
              When using, modifying, or distributing this software, you must:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Include the copyright notice and license in any copy of the Software</li>
              <li>Link to the original repository:{" "}
                <a href="https://github.com/siliconyouth/claude-insider" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
                  github.com/siliconyouth/claude-insider
                </a>
              </li>
              <li>Credit the original author: Vladimir Dukelic (vladimir@dukelic.com)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.3 Derivative Works</h3>
            <p className="text-gray-300 leading-relaxed">
              You may create derivative works, but:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Derivatives must include the original copyright notice</li>
              <li>You must clearly indicate modifications from the original</li>
              <li>You may not imply endorsement by the original author</li>
              <li>Derivative project names should be distinct from &quot;Claude Insider&quot;</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.4 Third-Party Trademarks</h3>
            <p className="text-gray-300 leading-relaxed">
              &quot;Claude&quot;, &quot;Anthropic&quot;, and related marks are trademarks of Anthropic, PBC. All other trademarks are property of their respective owners. The MIT License does not grant any trademark rights.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">11.5 No Warranty</h3>
            <p className="text-gray-300 leading-relaxed font-mono text-sm bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. AI Features</h2>

            <h3 className="text-xl font-semibold mt-6 mb-3">12.1 AI Voice Assistant</h3>
            <p className="text-gray-300 leading-relaxed">
              The AI assistant uses:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Anthropic Claude AI:</strong> For chat responses (subject to <a href="https://www.anthropic.com/legal/consumer-terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Anthropic&apos;s Terms</a>)</li>
              <li><strong>ElevenLabs:</strong> For text-to-speech (subject to <a href="https://elevenlabs.io/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">ElevenLabs&apos; Terms</a>)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">12.2 Model Selection</h3>
            <p className="text-gray-300 leading-relaxed">
              You can select your preferred Claude model (Opus 4.5, Sonnet 4, or Haiku) for AI features:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Site API users:</strong> Model selection is based on site credit allocation and may be limited</li>
              <li><strong>Own API key users:</strong> Model selection is based on your Anthropic subscription tier and available models</li>
              <li><strong>Persistence:</strong> Your model preference is saved to your account (for logged-in users) or browser localStorage (for guests)</li>
              <li><strong>Availability:</strong> Model availability may change based on your API key permissions or site credit balance</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">12.3 AI Limitations</h3>
            <p className="text-gray-300 leading-relaxed">
              AI responses may be incorrect, incomplete, or outdated. Do not rely on AI for critical decisions. Always verify with official sources.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">12.4 Code Playground</h3>
            <p className="text-gray-300 leading-relaxed">
              Code executed in the playground runs in a sandboxed browser environment. We are not responsible for any code you execute or its results.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">12.5 Your Own API Key</h3>
            <p className="text-gray-300 leading-relaxed">
              You may optionally provide your own Anthropic API key for AI features. By doing so, you agree:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Your account:</strong> You are responsible for your Anthropic account, billing, and API usage</li>
              <li><strong>Compliance:</strong> You must comply with <a href="https://www.anthropic.com/legal/consumer-terms" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Anthropic&apos;s Terms of Service</a></li>
              <li><strong>Key security:</strong> Keep your API key confidential; you are responsible for any misuse</li>
              <li><strong>Revocation:</strong> You can revoke your API key at Anthropic anytime; we recommend doing so if you suspect unauthorized access</li>
              <li><strong>No liability:</strong> We are not liable for charges, rate limits, or issues with your Anthropic account</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              We encrypt your API key with AES-256-GCM before storage and only use it to make Claude API requests on your behalf. See our <a href="/privacy" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</a> for details on how we protect your key.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Security Monitoring</h2>
            <p className="text-gray-300 leading-relaxed">
              To protect our Website and users, we implement security measures including:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.1 Browser Fingerprinting</h3>
            <p className="text-gray-300 leading-relaxed">
              We use browser fingerprinting technology (FingerprintJS) to identify and protect against automated bots, scrapers, and malicious actors. By using our Website, you acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Your browser&apos;s technical characteristics may be collected to create a unique identifier</li>
              <li>This identifier is used solely for security purposes (bot detection, fraud prevention)</li>
              <li>Fingerprint data is retained for 90 days</li>
              <li>See our <a href="/privacy" className="text-cyan-400 hover:text-cyan-300">Privacy Policy</a> for full details</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.2 Trust Scoring</h3>
            <p className="text-gray-300 leading-relaxed">
              We calculate a trust score (0-100) for visitors based on behavior patterns. Low trust scores may result in:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Additional verification requirements</li>
              <li>Rate limiting of requests</li>
              <li>Limited access to certain features</li>
              <li>Being served honeypot content (fake data designed to waste bot resources)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.3 Honeypot System</h3>
            <p className="text-gray-300 leading-relaxed">
              We deploy honeypot traps to detect and deter automated abuse. If you are a legitimate user, you will never encounter these. Automated systems that interact with honeypots will be flagged and may be blocked.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Prohibited Conduct</h2>
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
              <li>Attempt to defeat or circumvent browser fingerprinting or bot detection</li>
              <li>Use tools to spoof or mask your browser fingerprint for malicious purposes</li>
              <li>Use the service to generate harmful or illegal content</li>
              <li>Attempt to intercept, decrypt, or access others&apos; encrypted messages</li>
              <li>Exploit vulnerabilities in the E2EE implementation</li>
              <li>Use donations to launder money or for illegal purposes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Disclaimer of Warranties</h2>
            <p className="text-gray-300 leading-relaxed">
              THE WEBSITE AND ITS CONTENT ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Accuracy, reliability, or completeness of content</li>
              <li>Uninterrupted, secure, or error-free operation</li>
              <li>That defects will be corrected</li>
              <li>Fitness for any particular purpose</li>
              <li>The security of end-to-end encryption beyond our implementation</li>
              <li>Message delivery or recovery of lost encryption keys</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>EU/EEA consumers:</strong> These disclaimers do not affect your statutory rights under EU consumer protection law, including the Consumer Rights Directive.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              TO THE FULLEST EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Direct, indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, data, use, or goodwill</li>
              <li>Damages from your use of or inability to use the Website</li>
              <li>Damages from User Content or third-party services</li>
              <li>Lost encrypted messages due to key loss</li>
              <li>Third-party payment processor issues</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>EU/EEA consumers:</strong> This limitation does not exclude liability for death, personal injury, fraud, or gross negligence, nor does it affect your statutory rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17. Indemnification</h2>
            <p className="text-gray-300 leading-relaxed">
              You agree to indemnify and hold harmless Vladimir Dukelic and any contributors from claims, damages, losses, or expenses arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Your use of the Website</li>
              <li>Your violation of these Terms</li>
              <li>Your User Content</li>
              <li>Your violation of any third-party rights</li>
              <li>Your misuse of E2EE features</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Note:</strong> This indemnification does not apply to the extent prohibited by local consumer protection law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">18. Modifications to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We may modify these Terms at any time. Changes will be posted with an updated &quot;Last updated&quot; date. For material changes affecting registered users, we will provide notice via email or in-app notification at least 30 days before the changes take effect (for EU users, as required by the DSA). Continued use after changes constitutes acceptance.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              If you disagree with any changes, you may delete your account before the changes take effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">19. Severability</h2>
            <p className="text-gray-300 leading-relaxed">
              If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">20. Contact Information</h2>
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
              <strong>In short:</strong> Claude Insider is free, open-source documentation (MIT License with Attribution) with user accounts, social features, end-to-end encrypted messaging, donations, and AI assistance. You can sign in with email/password, OAuth (GitHub, Google), or passkeys. You can select your preferred Claude model based on your subscription tier. You can optionally add your own Anthropic API key — you remain responsible for your Anthropic account and billing.
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              <strong>E2EE messaging:</strong> Your encryption keys are stored on your device. Back up your keys — we cannot recover lost messages. You can optionally grant AI access to encrypted conversations.
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              <strong>Donations:</strong> Voluntary, generally non-refundable (EU 14-day withdrawal applies). Not tax-deductible. Badges are cosmetic only.
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              <strong>Security:</strong> We use browser fingerprinting to detect bots — legitimate users are never affected. Be respectful in comments and discussions. You can export or delete your data anytime from Settings.
            </p>
            <p className="text-gray-300 leading-relaxed mt-3">
              <strong>Legal:</strong> Serbian law governs these terms, but EU/EEA and California consumer rights are preserved. Content is provided &quot;as is&quot; — always verify with official sources. We&apos;re not affiliated with Anthropic.
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
