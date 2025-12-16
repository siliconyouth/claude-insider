import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy - Claude Insider",
  description: "Privacy Policy for Claude Insider - how we handle your data and protect your privacy across all jurisdictions.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main id="main-content" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose prose-invert prose-blue max-w-none">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-400 text-sm mb-8">Last updated: December 16, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              This Privacy Policy explains how Claude Insider (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects your information when you visit our website at www.claudeinsider.com (the &quot;Website&quot;). Claude Insider is a personal project operated by Vladimir Dukelic from the Republic of Serbia.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              We are committed to protecting your privacy as a fundamental human right, as recognized by Article 12 of the Universal Declaration of Human Rights. This policy complies with applicable privacy laws including the Serbian Law on Personal Data Protection (Zakon o zaštiti podataka o ličnosti), the EU General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA/CPRA), and international privacy frameworks.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Legal Framework</h2>
            <p className="text-gray-300 leading-relaxed">
              Claude Insider operates under a multi-jurisdictional legal framework to ensure all users are protected regardless of their location:
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm text-gray-300">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Jurisdiction</th>
                    <th className="px-4 py-2 text-left font-semibold">Applicable Law</th>
                    <th className="px-4 py-2 text-left font-semibold">Your Rights</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="px-4 py-2">Serbia (Primary)</td>
                    <td className="px-4 py-2">Zakon o zaštiti podataka o ličnosti</td>
                    <td className="px-4 py-2">Full GDPR-equivalent rights</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">European Union/EEA</td>
                    <td className="px-4 py-2">GDPR, ePrivacy Directive</td>
                    <td className="px-4 py-2">8 data subject rights</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">California, USA</td>
                    <td className="px-4 py-2">CCPA/CPRA</td>
                    <td className="px-4 py-2">Right to know, delete, opt-out</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Other US States</td>
                    <td className="px-4 py-2">State consumer laws</td>
                    <td className="px-4 py-2">Applicable state rights</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">International</td>
                    <td className="px-4 py-2">OECD Privacy Guidelines, UN Consumer Protection Guidelines</td>
                    <td className="px-4 py-2">Universal privacy principles</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-300 leading-relaxed mt-4">
              We adhere to the OECD Privacy Principles: Collection Limitation, Data Quality, Purpose Specification, Use Limitation, Security Safeguards, Openness, Individual Participation, and Accountability.
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
                Email: <a href="mailto:vladimir@dukelic.com" className="text-cyan-400 hover:text-cyan-300">vladimir@dukelic.com</a><br />
                Location: Republic of Serbia
              </p>
            </div>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Serbian Supervisory Authority:</strong><br />
              Poverenik za informacije od javnog značaja i zaštitu podataka o ličnosti<br />
              Bulevar kralja Aleksandra 15, 11000 Belgrade, Serbia<br />
              Website: <a href="https://www.poverenik.rs" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">www.poverenik.rs</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Legal Basis for Processing</h2>
            <p className="text-gray-300 leading-relaxed">
              We process your personal data only when we have a valid legal basis. Under Serbian law and GDPR, we rely on the following:
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm text-gray-300">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Processing Activity</th>
                    <th className="px-4 py-2 text-left font-semibold">Legal Basis</th>
                    <th className="px-4 py-2 text-left font-semibold">GDPR Article</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="px-4 py-2">Account creation &amp; management</td>
                    <td className="px-4 py-2">Contract performance</td>
                    <td className="px-4 py-2">Art. 6(1)(b)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Security monitoring, fingerprinting</td>
                    <td className="px-4 py-2">Legitimate interest</td>
                    <td className="px-4 py-2">Art. 6(1)(f)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Marketing emails, newsletters</td>
                    <td className="px-4 py-2">Consent</td>
                    <td className="px-4 py-2">Art. 6(1)(a)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">AI assistant conversations</td>
                    <td className="px-4 py-2">Contract performance</td>
                    <td className="px-4 py-2">Art. 6(1)(b)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Direct messaging (E2EE)</td>
                    <td className="px-4 py-2">Contract performance</td>
                    <td className="px-4 py-2">Art. 6(1)(b)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Donation processing</td>
                    <td className="px-4 py-2">Contract performance</td>
                    <td className="px-4 py-2">Art. 6(1)(b)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Tax receipt generation</td>
                    <td className="px-4 py-2">Legal obligation</td>
                    <td className="px-4 py-2">Art. 6(1)(c)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Analytics (Vercel)</td>
                    <td className="px-4 py-2">Legitimate interest</td>
                    <td className="px-4 py-2">Art. 6(1)(f)</td>
                  </tr>
                </tbody>
              </table>
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
              <li><strong>Multiple devices:</strong> You can add multiple authenticator apps per account</li>
              <li><strong>Device metadata:</strong> Device name and last used timestamp for each authenticator</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Passkeys (WebAuthn)</h3>
            <p className="text-gray-300 leading-relaxed">
              If you register passkeys for passwordless authentication:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Credential ID:</strong> Public identifier for your passkey</li>
              <li><strong>Public key:</strong> Cryptographic public key (private key stays on your device)</li>
              <li><strong>Device type:</strong> Platform (Face ID, Touch ID, Windows Hello) or cross-platform (security key)</li>
              <li><strong>Backup status:</strong> Whether your passkey is backed up to a cloud provider</li>
              <li><strong>Device name:</strong> A friendly name you can set to identify your passkey</li>
              <li><strong>Last used:</strong> Timestamp of last authentication with this passkey</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Passkeys use public-key cryptography. Your private key never leaves your device. We only store the public key for verification.
            </p>

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
            <h2 className="text-2xl font-semibold mb-4">End-to-End Encryption (E2EE)</h2>
            <p className="text-gray-300 leading-relaxed">
              Claude Insider offers end-to-end encrypted messaging using the Matrix Olm/Megolm protocol with Double Ratchet algorithm. Here&apos;s how your encryption data is handled:
            </p>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-emerald-400 mb-2">What We CANNOT See</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                <li>The content of your encrypted messages</li>
                <li>Your private encryption keys</li>
                <li>Your cloud backup password</li>
                <li>Decrypted message history</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">Device Keys</h3>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm text-gray-300">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Data</th>
                    <th className="px-4 py-2 text-left font-semibold">Storage</th>
                    <th className="px-4 py-2 text-left font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="px-4 py-2">Private keys (Curve25519, Ed25519)</td>
                    <td className="px-4 py-2">Your device only (IndexedDB)</td>
                    <td className="px-4 py-2">Decrypt messages, sign data</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Public keys</td>
                    <td className="px-4 py-2">Our servers</td>
                    <td className="px-4 py-2">Allow others to encrypt messages to you</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">One-time prekeys</td>
                    <td className="px-4 py-2">Our servers (consumed on use)</td>
                    <td className="px-4 py-2">Establish secure sessions</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Device ID &amp; metadata</td>
                    <td className="px-4 py-2">Our servers</td>
                    <td className="px-4 py-2">Device management</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-3">Cloud Key Backup</h3>
            <p className="text-gray-300 leading-relaxed">
              You can optionally back up your encryption keys to our servers:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Encryption:</strong> Your backup is encrypted with AES-256-GCM using a password you choose</li>
              <li><strong>We never store your password:</strong> If you forget it, your backup cannot be recovered</li>
              <li><strong>Deletion:</strong> You can delete your backup anytime from Settings</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Device Verification</h3>
            <p className="text-gray-300 leading-relaxed">
              We store device verification status to help you trust your own devices:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>SAS verification records:</strong> Emoji-based verification completion status</li>
              <li><strong>Cross-signing keys:</strong> Public keys for verifying your other devices</li>
              <li><strong>Trust relationships:</strong> Which devices you&apos;ve verified</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">AI Assistant Access to Encrypted Messages</h3>
            <p className="text-gray-300 leading-relaxed">
              With your explicit consent, you can allow our AI assistant to access decrypted message content for features like summarization:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li><strong>Consent required:</strong> AI access is strictly opt-in per conversation</li>
              <li><strong>Consent records:</strong> We store your consent preferences</li>
              <li><strong>Access logs:</strong> We log when AI accesses encrypted content (for your transparency)</li>
              <li><strong>Revocation:</strong> You can revoke AI access anytime</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Direct Messaging</h2>
            <p className="text-gray-300 leading-relaxed">
              When you use direct messaging features (1:1 or group chats), we collect:
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
                    <td className="px-4 py-2">Message content (if not E2EE)</td>
                    <td className="px-4 py-2">Deliver messages</td>
                    <td className="px-4 py-2">Until deleted by user</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Encrypted message blobs (if E2EE)</td>
                    <td className="px-4 py-2">Store/relay encrypted data</td>
                    <td className="px-4 py-2">Until deleted by user</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Message metadata</td>
                    <td className="px-4 py-2">Timestamp, sender, recipient</td>
                    <td className="px-4 py-2">Until conversation deleted</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Typing indicators</td>
                    <td className="px-4 py-2">Real-time typing status</td>
                    <td className="px-4 py-2">Not persisted (real-time only)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Online/presence status</td>
                    <td className="px-4 py-2">Show who is online</td>
                    <td className="px-4 py-2">Real-time + last seen timestamp</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Read receipts</td>
                    <td className="px-4 py-2">Show when messages are read</td>
                    <td className="px-4 py-2">Until conversation deleted</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Group memberships</td>
                    <td className="px-4 py-2">Track group participants &amp; roles</td>
                    <td className="px-4 py-2">Until you leave or group deleted</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Group invitations</td>
                    <td className="px-4 py-2">Pending invites to groups</td>
                    <td className="px-4 py-2">Until accepted/declined/expired</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Donation System</h2>
            <p className="text-gray-300 leading-relaxed">
              If you choose to support Claude Insider through donations, we collect:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">PayPal Donations</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Transaction ID:</strong> PayPal order/capture ID for reference</li>
              <li><strong>Amount &amp; currency:</strong> Donation amount</li>
              <li><strong>Payer email:</strong> As provided by PayPal (for receipts)</li>
              <li><strong>Payer name:</strong> As provided by PayPal</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-2">
              PayPal processes your payment. See <a href="https://www.paypal.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">PayPal&apos;s Privacy Policy</a>.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Bank Transfer Donations</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Reference code:</strong> Unique donation reference</li>
              <li><strong>Amount &amp; currency:</strong> As manually confirmed</li>
              <li><strong>Donor information:</strong> As you provide when notifying us</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Donor Badges &amp; Recognition</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Total donated:</strong> Sum of all donations (for badge tier calculation)</li>
              <li><strong>Badge tier:</strong> Bronze ($10+), Silver ($50+), Gold ($100+), Platinum ($500+)</li>
              <li><strong>Public display:</strong> Optional donor wall listing (you choose visibility)</li>
              <li><strong>Anonymous option:</strong> You can donate anonymously</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Tax Receipts</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Receipt number:</strong> Unique receipt ID (CI-YYYY-NNNNNN format)</li>
              <li><strong>Donor details:</strong> Name, email, address (as provided)</li>
              <li><strong>Donation details:</strong> Amount, date, payment method</li>
              <li><strong>Download tracking:</strong> When you downloaded the receipt</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Retention:</strong> Donation records are retained for 7 years for tax compliance under Serbian law.
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
                  <tr>
                    <td className="px-4 py-2">AI Assistant Settings</td>
                    <td className="px-4 py-2">Model, voice, preferences</td>
                    <td className="px-4 py-2">Until account deleted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Keep Your Data Safe</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement comprehensive security measures to protect your data, in compliance with the Serbian Law on Information Security (Zakon o informacionoj bezbednosti):
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

              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-cyan-400 mb-2">Encryption</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                  <li><strong>E2EE messaging:</strong> Matrix Olm/Megolm with Double Ratchet</li>
                  <li><strong>API key encryption:</strong> AES-256-GCM with unique IVs</li>
                  <li><strong>Cloud backup:</strong> User password-based encryption</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Download Your Data</h2>
            <p className="text-gray-300 leading-relaxed">
              You have the right to download all data we have about you. This right is guaranteed under Serbian law, GDPR Article 20 (data portability), and CCPA. To export your data:
            </p>

            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <ol className="list-decimal list-inside space-y-2 text-gray-300">
                <li>Go to <a href="/settings" className="text-cyan-400 hover:text-cyan-300">Settings</a></li>
                <li>Scroll to the <strong>&quot;Data Management&quot;</strong> section</li>
                <li>Click <strong>&quot;Export All Data&quot;</strong></li>
                <li>A JSON file will download containing all your data</li>
              </ol>
            </div>

            <p className="text-gray-300 leading-relaxed mt-4">
              The export is provided in a machine-readable JSON format for data portability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Delete Your Account &amp; Data</h2>
            <p className="text-gray-300 leading-relaxed">
              You can permanently delete your account and all associated data at any time. This right is guaranteed under Serbian law, GDPR Article 17 (right to erasure), and CCPA:
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
            <p className="text-gray-300 leading-relaxed">
              All personal data including profile, messages, E2EE keys, achievements, and preferences.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">What May Be Retained</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Edit suggestions:</strong> May be retained anonymously if merged into content</li>
              <li><strong>Donation records:</strong> Retained 7 years for tax compliance (Serbian law)</li>
              <li><strong>Security logs:</strong> Retained if related to ongoing security investigations</li>
              <li><strong>Anonymized analytics:</strong> Aggregate statistics (no personal identifiers)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
            <p className="text-gray-300 leading-relaxed">
              We use <strong>Vercel Analytics</strong>, a privacy-focused analytics service:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">What Vercel Analytics Collects</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Page views:</strong> Which pages are visited</li>
              <li><strong>Referrers:</strong> How visitors found our site</li>
              <li><strong>Geographic location:</strong> Country-level only</li>
              <li><strong>Device information:</strong> Device type, browser, OS</li>
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
            <h2 className="text-2xl font-semibold mb-4">Browser Fingerprinting &amp; Security</h2>
            <p className="text-gray-300 leading-relaxed">
              To protect our website from automated abuse, we use browser fingerprinting (FingerprintJS).
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">What We Collect</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Browser characteristics, screen resolution, timezone</li>
              <li>Canvas, audio, WebGL fingerprints</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">How We Use Fingerprints</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Bot detection and security monitoring</li>
              <li>Trust scoring (0-100) for visitors</li>
              <li>Rate limiting and honeypot protection</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Legal Basis</h3>
            <p className="text-gray-300 leading-relaxed">
              Browser fingerprinting is processed under <strong>legitimate interest</strong> (GDPR Article 6(1)(f)) for security purposes. You may object under Article 21 by contacting us.
            </p>

            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Retention:</strong> Fingerprint data is retained for 90 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">AI Voice Assistant &amp; Chat</h2>
            <p className="text-gray-300 leading-relaxed">
              Our AI features use third-party services:
            </p>

            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong className="text-cyan-400">Anthropic (Claude AI)</strong><br />
                Chat messages are sent to Anthropic&apos;s Claude API. See <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">Anthropic&apos;s Privacy Policy</a>.
              </p>
              <p className="text-gray-300 leading-relaxed">
                <strong className="text-cyan-400">ElevenLabs (Text-to-Speech)</strong><br />
                Voice output is generated by ElevenLabs. See <a href="https://elevenlabs.io/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">ElevenLabs&apos; Privacy Policy</a>.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your API Keys</h2>
            <p className="text-gray-300 leading-relaxed">
              If you add your own Anthropic API key:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>Encryption:</strong> AES-256-GCM with unique IV per key</li>
              <li><strong>Storage:</strong> Only encrypted key and last 8 chars (hint) stored</li>
              <li><strong>Usage:</strong> Only used to make Claude API requests on your behalf</li>
              <li><strong>Deletion:</strong> Permanently deleted when you remove it</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
            <p className="text-gray-300 leading-relaxed">
              Your data may be transferred to and processed in countries outside Serbia and the EU/EEA:
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm text-gray-300">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Service</th>
                    <th className="px-4 py-2 text-left font-semibold">Location</th>
                    <th className="px-4 py-2 text-left font-semibold">Safeguard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr>
                    <td className="px-4 py-2">Vercel (Hosting)</td>
                    <td className="px-4 py-2">Global CDN, US headquarters</td>
                    <td className="px-4 py-2">Standard Contractual Clauses</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Supabase (Database)</td>
                    <td className="px-4 py-2">AWS infrastructure</td>
                    <td className="px-4 py-2">Standard Contractual Clauses</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Anthropic (AI)</td>
                    <td className="px-4 py-2">United States</td>
                    <td className="px-4 py-2">Standard Contractual Clauses</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">ElevenLabs (TTS)</td>
                    <td className="px-4 py-2">United States</td>
                    <td className="px-4 py-2">Standard Contractual Clauses</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Resend (Email)</td>
                    <td className="px-4 py-2">United States</td>
                    <td className="px-4 py-2">Standard Contractual Clauses</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">PayPal (Payments)</td>
                    <td className="px-4 py-2">Global</td>
                    <td className="px-4 py-2">BCR, Standard Contractual Clauses</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-gray-300 leading-relaxed mt-4">
              Serbia is recognized by the EU as providing an adequate level of data protection. For transfers to other countries, we rely on Standard Contractual Clauses approved by the European Commission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cookies &amp; Local Storage</h2>
            <p className="text-gray-300 leading-relaxed">
              We use minimal cookies:
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
                    <td className="py-2">Language preference</td>
                    <td className="py-2">1 year</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 font-mono text-cyan-400">better-auth.session_token</td>
                    <td className="py-2">Authentication session</td>
                    <td className="py-2">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Local Storage:</strong> Theme, voice settings, AI history, and fingerprint cache are stored locally and never sent to our servers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-gray-300 leading-relaxed">
              Depending on your location, you have the following rights:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Under Serbian Law &amp; GDPR</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Access (Art. 15):</strong> Download all your data</li>
              <li><strong>Rectification (Art. 16):</strong> Update your information</li>
              <li><strong>Erasure (Art. 17):</strong> Delete your account and data</li>
              <li><strong>Restriction (Art. 18):</strong> Limit processing</li>
              <li><strong>Portability (Art. 20):</strong> Export in machine-readable format</li>
              <li><strong>Objection (Art. 21):</strong> Object to processing</li>
              <li><strong>Automated decisions (Art. 22):</strong> Challenge automated decisions</li>
              <li><strong>Complaint:</strong> Lodge complaint with supervisory authority</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Under CCPA/CPRA (California)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Right to know what personal information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of sale (<strong>We do NOT sell your data</strong>)</li>
              <li>Right to non-discrimination for exercising rights</li>
              <li>Right to correct inaccurate information</li>
              <li>Right to limit use of sensitive personal information</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Supervisory Authorities</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Serbia:</strong> Poverenik za informacije od javnog značaja i zaštitu podataka o ličnosti (<a href="https://www.poverenik.rs" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">www.poverenik.rs</a>)</li>
              <li><strong>EU/EEA:</strong> Your national data protection authority</li>
              <li><strong>US:</strong> FTC, California AG (CCPA), or state attorney general</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Children&apos;s Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Our website is not directed at children. Minimum age requirements:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>Serbia:</strong> 15 years</li>
              <li><strong>EU/EEA:</strong> 16 years (or lower per member state, minimum 13)</li>
              <li><strong>United States:</strong> 13 years (COPPA)</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              We do not knowingly collect personal information from children below these ages. If you believe a child has provided us with personal information, please contact us for deletion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted with an updated date. For significant changes, we will notify registered users via email. Your continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about this Privacy Policy or want to exercise your data rights:
            </p>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-300">
                <strong>Vladimir Dukelic</strong><br />
                Email: <a href="mailto:vladimir@dukelic.com" className="text-cyan-400 hover:text-cyan-300">vladimir@dukelic.com</a>
              </p>
            </div>
            <p className="text-gray-300 leading-relaxed mt-4">
              We will respond within 30 days as required by Serbian law and GDPR.
            </p>
          </section>

          <section className="mb-8 p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong>In short:</strong> Claude Insider operates under Serbian law (GDPR-equivalent), with full compliance for EU and US users. We collect account data, activity, and optionally: encrypted messages (E2EE), donations, and API keys. Private encryption keys never leave your device. We use fingerprinting for security only, never for ads. You can <strong>download</strong> or <strong>delete</strong> all your data anytime. We never sell your data. Serbian law and GDPR govern this policy, with your local consumer rights preserved.
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
