import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Disclaimer - Claude Insider",
  description: "Disclaimer for Claude Insider - important information about the unofficial nature of this documentation.",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main id="main-content" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <article className="ui-prose">
          <h1 className="text-4xl font-bold mb-2 ui-text-heading">Disclaimer</h1>
          <p className="ui-text-muted text-sm mb-8">Last updated: December 16, 2025</p>

          <section className="mb-8 p-6 bg-violet-500/10 border border-violet-500/30 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-violet-400">Important Notice</h2>
            <p className="ui-text-body leading-relaxed">
              Claude Insider is an <strong>unofficial, independent project</strong> and is <strong>not affiliated with, endorsed by, sponsored by, or officially connected to Anthropic, PBC</strong> or any of its subsidiaries, affiliates, or related companies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">No Official Affiliation</h2>
            <p className="ui-text-body leading-relaxed">
              This website is a personal project created by Vladimir Dukelic to provide documentation, tips, and resources for users of Claude AI products. It is operated independently and has no official relationship with Anthropic.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li>&quot;Claude&quot;, &quot;Claude AI&quot;, &quot;Claude Code&quot;, and related marks are trademarks of Anthropic, PBC</li>
              <li>This website does not represent Anthropic&apos;s official views or positions</li>
              <li>For official Claude documentation, please visit <a href="https://docs.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-cyan-300">docs.anthropic.com</a></li>
              <li>For official support, please contact Anthropic directly through their official channels</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information Accuracy</h2>
            <p className="ui-text-body leading-relaxed">
              While we strive to provide accurate and up-to-date information, we make no representations or warranties about:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li><strong>Accuracy:</strong> The information may contain errors, inaccuracies, or omissions</li>
              <li><strong>Completeness:</strong> The documentation may not cover all features or use cases</li>
              <li><strong>Timeliness:</strong> Claude AI products evolve rapidly; information may become outdated</li>
              <li><strong>Reliability:</strong> Code examples and configurations may not work in all environments</li>
            </ul>
            <p className="ui-text-body leading-relaxed mt-4">
              <strong>Always refer to official Anthropic documentation for the most current and authoritative information.</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Educational Purpose Only</h2>
            <p className="ui-text-body leading-relaxed">
              The content on this website is provided for <strong>educational and informational purposes only</strong>. It should not be construed as:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li>Professional, technical, or expert advice</li>
              <li>Official product documentation or support</li>
              <li>A guarantee of specific outcomes or results</li>
              <li>Legal, financial, or business advice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Use at Your Own Risk</h2>
            <p className="ui-text-body leading-relaxed">
              Any actions you take based on the information on this website are at your own risk. We disclaim all liability for:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li>Any errors or omissions in the content</li>
              <li>Any loss or damage arising from the use of information on this website</li>
              <li>Any issues arising from implementing code examples or configurations</li>
              <li>Any decisions made based on the content of this website</li>
              <li>Any incompatibility with current or future versions of Claude AI products</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">End-to-End Encryption (E2EE) Disclaimer</h2>
            <p className="ui-text-body leading-relaxed">
              Claude Insider offers end-to-end encrypted direct messaging. Important disclaimers regarding this feature:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Key Management</h3>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-4">
              <p className="ui-text-body leading-relaxed">
                <strong className="text-amber-400">Critical Warning:</strong> Your private encryption keys are stored <em>only</em> on your device(s). We cannot access, recover, or reset your encryption keys. If you lose all your devices without having enabled cloud key backup, your encrypted messages will be <strong>permanently and irreversibly lost</strong>.
              </p>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">No Liability for Lost Keys or Messages</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li>We are <strong>not responsible</strong> for lost encryption keys due to device loss, theft, damage, or software issues</li>
              <li>We are <strong>not responsible</strong> for lost or unrecoverable messages resulting from key loss</li>
              <li>We are <strong>not responsible</strong> for forgotten cloud backup passwords — there is no &quot;forgot password&quot; recovery</li>
              <li>We <strong>cannot</strong> decrypt your messages under any circumstances, even by legal request</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Security Limitations</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li><strong>Device security:</strong> E2EE only protects data in transit; if your device is compromised, your messages may be accessed</li>
              <li><strong>Endpoint security:</strong> We cannot guarantee the security of devices you or your contacts use</li>
              <li><strong>Metadata:</strong> While message content is encrypted, metadata (who you message, when, how often) is visible to us</li>
              <li><strong>Implementation:</strong> While we use industry-standard protocols (Matrix Olm/Megolm), no encryption is 100% guaranteed secure</li>
              <li><strong>Third-party devices:</strong> Your contacts&apos; device security affects your communication security</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Cloud Backup Disclaimer</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li>Cloud key backup is encrypted with your password using AES-256-GCM</li>
              <li>A weak password may compromise your backup security</li>
              <li>We cannot recover backups if you forget your password</li>
              <li>You are responsible for keeping your backup password secure</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Direct Messaging Disclaimer</h2>
            <p className="ui-text-body leading-relaxed">
              Claude Insider offers user-to-user direct messaging. Important disclaimers:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">User-Generated Content</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li>We are <strong>not responsible</strong> for the content of messages sent between users</li>
              <li>Messages may contain inaccurate, offensive, or harmful content</li>
              <li>You are solely responsible for the messages you send</li>
              <li>Report abusive users via Settings or by emailing vladimir@dukelic.com</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Message Delivery</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li>We <strong>do not guarantee</strong> message delivery or delivery timing</li>
              <li>Messages may be delayed, lost, or fail to send due to network issues</li>
              <li>Real-time features (typing indicators, presence) may not always be accurate</li>
              <li>Do not rely on our messaging for time-critical or mission-critical communications</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Group Conversations</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li>Group owners and admins control group membership and settings</li>
              <li>We are not responsible for actions taken by group administrators</li>
              <li>Group invitations may be revoked or expired</li>
              <li>You may be removed from groups at the owner&apos;s discretion</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Donation Disclaimer</h2>
            <p className="ui-text-body leading-relaxed">
              Claude Insider accepts voluntary donations to support development. Important disclaimers:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Tax Information</h3>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
              <p className="ui-text-body leading-relaxed">
                <strong className="text-blue-400">Important:</strong> Claude Insider is <strong>not a registered charity or non-profit organization</strong>. Donations to Claude Insider are <strong>not tax-deductible</strong> in any jurisdiction. We provide donation receipts for your records only — these are not tax documents. Consult a qualified tax professional regarding any tax implications.
              </p>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">Receipt Accuracy</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li>Donation receipts are provided for record-keeping purposes only</li>
              <li>While we strive for accuracy, receipt details may contain errors</li>
              <li>You are responsible for maintaining your own financial records</li>
              <li>We do not provide corrected or amended receipts for tax purposes</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Payment Processor Limitations</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li><strong>PayPal:</strong> Subject to PayPal&apos;s terms, fees, and limitations. We are not responsible for PayPal account issues, chargebacks, or disputes</li>
              <li><strong>Bank transfers:</strong> Subject to your bank&apos;s terms, fees, and processing times. International transfers may incur additional fees</li>
              <li><strong>Currency conversion:</strong> Exchange rates and conversion fees are determined by payment processors, not by us</li>
              <li><strong>Failed payments:</strong> We are not responsible for declined payments, insufficient funds, or bank errors</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Refund Limitations</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li>Donations are generally non-refundable voluntary contributions</li>
              <li>Refund processing may take 5-10 business days</li>
              <li>Payment processor fees may not be refundable</li>
              <li>See our <a href="/terms" className="text-blue-400 hover:text-cyan-300">Terms of Service</a> for full refund policy</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Donor Badges</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li>Donor badges are cosmetic recognition only — they grant no additional features, services, or rights</li>
              <li>Badge tiers may be modified, renamed, or discontinued at any time</li>
              <li>Badges do not represent an investment, ownership stake, or equity in Claude Insider</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">AI Voice Assistant Disclaimer</h2>
            <p className="ui-text-body leading-relaxed">
              This website includes an AI Voice Assistant feature powered by third-party services. Important disclaimers regarding this feature:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">AI-Generated Responses</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li>Responses are generated by Claude AI (Anthropic) and may contain inaccuracies</li>
              <li>The assistant may &quot;hallucinate&quot; or provide incorrect information</li>
              <li>Responses should be verified against official documentation</li>
              <li>The assistant is not a substitute for professional advice</li>
              <li>AI responses may not reflect the most current Claude AI features or capabilities</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Third-Party Services</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li><strong>Anthropic:</strong> We are not affiliated with Anthropic. Using the assistant involves Anthropic&apos;s API and their terms</li>
              <li><strong>ElevenLabs:</strong> Text-to-speech is provided by ElevenLabs. Voice output may not perfectly match written text</li>
              <li><strong>Browser Speech API:</strong> Voice input quality depends on your browser and device capabilities</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">AI and Encrypted Messages</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li>By default, AI cannot access your encrypted messages</li>
              <li>If you grant AI access to encrypted conversations, messages are decrypted in memory only</li>
              <li>AI-analyzed content is not stored permanently or used for training</li>
              <li>You can revoke AI access at any time</li>
              <li>AI responses about your encrypted messages may reveal information in an unencrypted response</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">No Guarantees</h3>
            <p className="ui-text-body leading-relaxed">
              We make no guarantees regarding:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 ui-text-body">
              <li>Availability or uptime of the AI assistant</li>
              <li>Quality or accuracy of AI responses</li>
              <li>Quality or availability of text-to-speech output</li>
              <li>Compatibility with your browser or device</li>
              <li>Privacy practices of third-party API providers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Code Examples</h2>
            <p className="ui-text-body leading-relaxed">
              Code examples, configurations, and technical instructions provided on this website:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li>Are provided &quot;as is&quot; without warranty of any kind</li>
              <li>May require modification for your specific use case</li>
              <li>May not reflect current API versions or best practices</li>
              <li>Should be reviewed and tested before use in production environments</li>
              <li>May have security implications that you should evaluate</li>
            </ul>
            <p className="ui-text-body leading-relaxed mt-4">
              Always test code in a safe environment before deploying to production.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">External Links</h2>
            <p className="ui-text-body leading-relaxed">
              This website may contain links to external websites and resources. We:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li>Have no control over the content of external sites</li>
              <li>Do not endorse or take responsibility for external content</li>
              <li>Cannot guarantee the availability or accuracy of linked resources</li>
              <li>Are not responsible for any transactions you conduct on external sites</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data and Privacy</h2>
            <p className="ui-text-body leading-relaxed">
              Claude Insider offers both anonymous and authenticated experiences. Here&apos;s what you should know:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">For Anonymous Users</h3>
            <p className="ui-text-body leading-relaxed">
              If you use Claude Insider without creating an account, your data is stored locally in your browser:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 ui-text-body">
              <li>AI chat conversations (localStorage)</li>
              <li>Theme, voice, and language preferences</li>
              <li>Reading progress and bookmarks</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">For Registered Users</h3>
            <p className="ui-text-body leading-relaxed">
              If you create an account, we store additional data on our servers:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 ui-text-body">
              <li>Profile information (name, username, bio, avatar)</li>
              <li>Comments, reviews, and edit suggestions</li>
              <li>Favorites, collections, and reading lists</li>
              <li>Activity data (logins, sessions)</li>
              <li>Encrypted messages (we cannot read these)</li>
              <li>Donation history and receipts</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Your Data Rights</h3>
            <p className="ui-text-body leading-relaxed">
              As a registered user, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 ui-text-body">
              <li><strong>Export:</strong> Download all your data in JSON format from Settings → Data Management</li>
              <li><strong>Delete:</strong> Permanently delete your account and all associated data</li>
              <li><strong>Control:</strong> Adjust privacy settings for your profile visibility</li>
            </ul>
            <p className="ui-text-body leading-relaxed mt-4">
              For complete details, see our <a href="/privacy" className="text-blue-400 hover:text-cyan-300">Privacy Policy</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">User-Generated Content</h2>
            <p className="ui-text-body leading-relaxed">
              Claude Insider allows registered users to submit content including comments, reviews, and edit suggestions. Regarding this content:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li>You retain ownership of your original content</li>
              <li>Content is moderated and may be removed if it violates our guidelines</li>
              <li>We are not responsible for the accuracy or quality of user-submitted content</li>
              <li>User content does not represent the views of Claude Insider or its owner</li>
              <li>Comments and suggestions may contain inaccurate information—always verify</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Code Playground</h2>
            <p className="ui-text-body leading-relaxed">
              Claude Insider includes an interactive Code Playground feature. Important disclaimers:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li>Code is executed in a sandboxed browser environment</li>
              <li>Python execution is simulated with limited built-in functions</li>
              <li>We cannot guarantee the accuracy of code execution results</li>
              <li>Do not enter sensitive data (API keys, passwords) in the playground</li>
              <li>Shared playground links are publicly accessible—do not share confidential code</li>
              <li>The playground is for learning purposes only, not production use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">No Professional Relationship</h2>
            <p className="ui-text-body leading-relaxed">
              Use of this website does not create any professional, consulting, or advisory relationship between you and the website owner. For professional advice, please consult qualified professionals in the relevant field.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes and Updates</h2>
            <p className="ui-text-body leading-relaxed">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li>Modify, update, or remove content at any time without notice</li>
              <li>Change the structure or availability of the website</li>
              <li>Discontinue the website at any time</li>
            </ul>
            <p className="ui-text-body leading-relaxed mt-4">
              We encourage you to check back regularly for updates and to verify information with official sources.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="ui-text-body leading-relaxed">
              To the fullest extent permitted by applicable law, Claude Insider and its owner shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li>Your use of or reliance on any information on this website</li>
              <li>Any errors or omissions in the content</li>
              <li>Any interruption or cessation of the website</li>
              <li>Any viruses or other harmful components transmitted through the website</li>
              <li>Lost encryption keys or unrecoverable encrypted messages</li>
              <li>Issues with third-party payment processors</li>
              <li>AI-generated inaccuracies or hallucinations</li>
            </ul>
            <p className="ui-text-body leading-relaxed mt-4">
              <strong>EU/EEA consumers:</strong> This limitation does not affect your statutory rights under EU consumer protection law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
            <p className="ui-text-body leading-relaxed">
              This disclaimer is governed by the laws of the Republic of Serbia. For users in other jurisdictions, your local mandatory consumer protection rights are preserved.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li><strong>EU/EEA residents:</strong> Your rights under the Consumer Rights Directive and GDPR are not affected</li>
              <li><strong>California residents:</strong> Your CCPA rights remain in effect</li>
              <li><strong>Other jurisdictions:</strong> Local non-waivable statutory protections apply</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p className="ui-text-body leading-relaxed">
              If you have questions about this disclaimer or notice any inaccuracies in our content, please contact us:
            </p>
            <div className="ui-bg-card border ui-border rounded-lg p-4 mt-4">
              <p className="ui-text-body">
                <strong>Email:</strong>{" "}
                <a href="mailto:vladimir@dukelic.com" className="text-blue-400 hover:text-cyan-300">
                  vladimir@dukelic.com
                </a>
              </p>
            </div>
          </section>

          <section className="mb-8 p-6 ui-bg-card border ui-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <p className="ui-text-body leading-relaxed">
              <strong>In short:</strong> Claude Insider is an unofficial, independent resource. We&apos;re not affiliated with Anthropic. Information may be outdated or inaccurate. Always verify with official sources. Use code examples at your own risk.
            </p>
            <p className="ui-text-body leading-relaxed mt-3">
              <strong>E2EE messaging:</strong> Your encryption keys exist only on your devices. We cannot recover lost keys or messages. Back up your keys — this is your responsibility.
            </p>
            <p className="ui-text-body leading-relaxed mt-3">
              <strong>Donations:</strong> Not tax-deductible. Receipts are for your records only. Badges are cosmetic. Payment processor issues are outside our control.
            </p>
            <p className="ui-text-body leading-relaxed mt-3">
              <strong>AI Assistant:</strong> Responses may be inaccurate. Verify with official docs. AI cannot read encrypted messages unless you explicitly grant access.
            </p>
            <p className="ui-text-body leading-relaxed mt-3">
              <strong>Your data:</strong> Anonymous users have data stored locally in the browser. Registered users have profile and activity data stored on our servers with industry-standard security. You can export or delete all your data at any time from Settings.
            </p>
            <p className="ui-text-body leading-relaxed mt-3">
              For official documentation, visit <a href="https://docs.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-cyan-300">docs.anthropic.com</a>.
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
