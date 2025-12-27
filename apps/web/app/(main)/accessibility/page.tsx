import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Accessibility Statement - Claude Insider",
  description: "Accessibility Statement for Claude Insider - our commitment to making documentation accessible to everyone.",
};

export default function AccessibilityStatementPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main id="main-content" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <article className="ui-prose">
          <h1 className="text-4xl font-bold mb-2 ui-text-heading">Accessibility Statement</h1>
          <p className="ui-text-muted text-sm mb-8">Last updated: December 16, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
            <p className="ui-text-body leading-relaxed">
              Claude Insider is committed to ensuring digital accessibility for people with disabilities. We continually strive to improve the user experience for everyone and apply the relevant accessibility standards to achieve this goal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Conformance Status</h2>
            <p className="ui-text-body leading-relaxed">
              We aim to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>. These guidelines explain how to make web content more accessible for people with disabilities and more user-friendly for everyone.
            </p>
            <p className="ui-text-body leading-relaxed mt-4">
              This website has been designed and developed with accessibility in mind from the start.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Accessibility Features</h2>
            <p className="ui-text-body leading-relaxed">
              We have implemented the following accessibility features on this website:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Navigation</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li><strong>Skip to main content:</strong> A skip link is provided to bypass navigation and go directly to the main content</li>
              <li><strong>Keyboard navigation:</strong> All interactive elements are accessible via keyboard</li>
              <li><strong>Focus indicators:</strong> Visible focus states on all interactive elements</li>
              <li><strong>Consistent navigation:</strong> Navigation is consistent across all pages</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Visual Design</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li><strong>Color contrast:</strong> Text and interactive elements meet WCAG AA contrast requirements</li>
              <li><strong>Theme options:</strong> Dark, light, and system theme modes to accommodate different preferences and needs</li>
              <li><strong>Resizable text:</strong> Content can be resized up to 200% without loss of functionality</li>
              <li><strong>No flashing content:</strong> We avoid content that flashes more than three times per second</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Screen Reader Support</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li><strong>ARIA labels:</strong> Appropriate ARIA labels and roles throughout the website</li>
              <li><strong>Semantic HTML:</strong> Proper heading hierarchy and semantic structure</li>
              <li><strong>Alt text:</strong> Decorative images are hidden from screen readers; meaningful images have descriptions</li>
              <li><strong>Live regions:</strong> Dynamic content changes are announced to screen readers</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Touch Screen Support</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li><strong>ProfileHoverCard:</strong> Touch-friendly user preview cards:
                <ul className="list-disc list-inside ml-6 mt-2 ui-text-secondary">
                  <li>First touch shows the profile preview card</li>
                  <li>Second touch navigates to the full profile</li>
                  <li>Tap outside to dismiss the card</li>
                  <li>Works seamlessly on tablets and mobile devices</li>
                </ul>
              </li>
              <li><strong>Two-touch pattern:</strong> Interactive elements that show previews use a consistent two-touch navigation pattern across the site</li>
              <li><strong>Scroll-friendly:</strong> Touch interactions don&apos;t interfere with scrolling or swiping</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Interactive Components</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li><strong>Unified Search Modal:</strong> Accessible dialog with dual modes:
                <ul className="list-disc list-inside ml-6 mt-2 ui-text-secondary">
                  <li>Quick Mode: Instant fuzzy search for fast navigation</li>
                  <li>AI Mode: Semantic search with Claude for natural language queries</li>
                  <li>Voice search: Speak your query in AI Mode (Web Speech API)</li>
                  <li>Press <code className="ui-bg-skeleton px-1 rounded">Tab</code> inside the modal to switch between Quick and AI modes</li>
                  <li>ARIA live regions announce search results and mode changes</li>
                </ul>
              </li>
              <li><strong>Language selector:</strong> 18-language picker in footer with keyboard navigation</li>
              <li><strong>Code blocks:</strong> Copy buttons with accessible labels and feedback</li>
              <li><strong>Theme toggle:</strong> Accessible toggle with proper labeling</li>
              <li><strong>Mobile menu:</strong> Accessible hamburger menu for mobile navigation</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Unified Chat Window</h3>
            <p className="ui-text-body leading-relaxed">
              Our Unified Chat Window combines AI Assistant and user messaging in an accessible tabbed interface:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li><strong>Keyboard accessible:</strong> Press <code className="ui-bg-skeleton px-1 rounded">Cmd/Ctrl + .</code> to open the chat window from anywhere</li>
              <li><strong>Tab navigation:</strong> Switch between &quot;AI Assistant&quot; and &quot;Messages&quot; tabs using keyboard</li>
              <li><strong>Focus trap:</strong> Focus stays within the chat window when open</li>
              <li><strong>ARIA labels:</strong> All buttons and controls have proper accessible names</li>
              <li><strong>Live regions:</strong> New messages and AI responses are announced to screen readers</li>
              <li><strong>State persistence:</strong> Chat window remembers your last active tab</li>
              <li><strong>Resize support:</strong> Window can be resized without breaking accessibility</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">AI Voice Assistant</h3>
            <p className="ui-text-body leading-relaxed">
              Our AI Voice Assistant is designed with accessibility in mind:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li><strong>Voice input:</strong> Speak your questions instead of typing - helpful for users with motor impairments or those who prefer speech</li>
              <li><strong>Text-to-speech output:</strong> AI responses can be read aloud, beneficial for users with visual impairments or reading difficulties</li>
              <li><strong>Keyboard accessible:</strong> All voice assistant controls can be operated via keyboard</li>
              <li><strong>Visual feedback:</strong> Clear visual indicators show when the assistant is listening, processing, or speaking</li>
              <li><strong>Screen reader compatible:</strong> ARIA live regions announce status changes and responses</li>
              <li><strong>Alternative text input:</strong> Users can always type instead of speaking if preferred</li>
              <li><strong>Stop controls:</strong> Easy-to-access buttons to stop listening or stop TTS playback</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">End-to-End Encrypted Messaging</h3>
            <p className="ui-text-body leading-relaxed">
              Our E2EE messaging features are designed to be accessible:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li><strong>Device verification:</strong> Emoji-based verification displays emoji with alt text and names for screen readers</li>
              <li><strong>Key backup form:</strong> Password input with clear labels and validation messages</li>
              <li><strong>Encryption status:</strong> Visual indicators (lock icons) have accessible text alternatives</li>
              <li><strong>Error messages:</strong> Key management errors are announced via ARIA live regions</li>
              <li><strong>Cloud backup dialog:</strong> Fully keyboard accessible with focus trap</li>
              <li><strong>Device management:</strong> Device list is accessible with proper table semantics</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Donation Forms</h3>
            <p className="ui-text-body leading-relaxed">
              Our donation system is designed to be accessible to all users:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li><strong>PayPal buttons:</strong> Accessible PayPal checkout with keyboard support</li>
              <li><strong>Amount selection:</strong> Radio buttons and custom input with proper labels</li>
              <li><strong>Bank transfer info:</strong> Copy buttons with accessible feedback</li>
              <li><strong>Receipt download:</strong> Download links with clear accessible names</li>
              <li><strong>Donor wall:</strong> Donor list with proper list semantics</li>
              <li><strong>Badge display:</strong> Badge icons have accessible text alternatives</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Keyboard Shortcuts</h2>
            <p className="ui-text-body leading-relaxed">
              The following keyboard shortcuts are available:
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full border ui-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="ui-bg-skeleton">
                    <th className="px-4 py-2 text-left text-sm font-semibold ui-text-heading">Shortcut</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold ui-text-heading">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t ui-border">
                    <td className="px-4 py-2 text-sm ui-text-body"><code className="ui-bg-skeleton px-2 py-1 rounded">Cmd/Ctrl + K</code></td>
                    <td className="px-4 py-2 text-sm ui-text-body">Open Unified Search Modal</td>
                  </tr>
                  <tr className="border-t ui-border ui-bg-skeleton/20">
                    <td className="px-4 py-2 text-sm ui-text-body"><code className="ui-bg-skeleton px-2 py-1 rounded">Cmd/Ctrl + .</code></td>
                    <td className="px-4 py-2 text-sm ui-text-body">Open/Close Unified Chat Window</td>
                  </tr>
                  <tr className="border-t ui-border">
                    <td className="px-4 py-2 text-sm ui-text-body"><code className="ui-bg-skeleton px-2 py-1 rounded">Tab</code> (in search)</td>
                    <td className="px-4 py-2 text-sm ui-text-body">Switch between Quick and AI search modes</td>
                  </tr>
                  <tr className="border-t ui-border ui-bg-skeleton/20">
                    <td className="px-4 py-2 text-sm ui-text-body"><code className="ui-bg-skeleton px-2 py-1 rounded">Tab</code> (in chat)</td>
                    <td className="px-4 py-2 text-sm ui-text-body">Switch between AI Assistant and Messages tabs</td>
                  </tr>
                  <tr className="border-t ui-border">
                    <td className="px-4 py-2 text-sm ui-text-body"><code className="ui-bg-skeleton px-2 py-1 rounded">Escape</code></td>
                    <td className="px-4 py-2 text-sm ui-text-body">Close search/modal/chat</td>
                  </tr>
                  <tr className="border-t ui-border ui-bg-skeleton/20">
                    <td className="px-4 py-2 text-sm ui-text-body"><code className="ui-bg-skeleton px-2 py-1 rounded">Tab</code></td>
                    <td className="px-4 py-2 text-sm ui-text-body">Navigate forward through interactive elements</td>
                  </tr>
                  <tr className="border-t ui-border">
                    <td className="px-4 py-2 text-sm ui-text-body"><code className="ui-bg-skeleton px-2 py-1 rounded">Shift + Tab</code></td>
                    <td className="px-4 py-2 text-sm ui-text-body">Navigate backward through interactive elements</td>
                  </tr>
                  <tr className="border-t ui-border ui-bg-skeleton/20">
                    <td className="px-4 py-2 text-sm ui-text-body"><code className="ui-bg-skeleton px-2 py-1 rounded">Enter</code></td>
                    <td className="px-4 py-2 text-sm ui-text-body">Activate focused element</td>
                  </tr>
                  <tr className="border-t ui-border">
                    <td className="px-4 py-2 text-sm ui-text-body"><code className="ui-bg-skeleton px-2 py-1 rounded">↑ / ↓</code></td>
                    <td className="px-4 py-2 text-sm ui-text-body">Navigate search results or messages</td>
                  </tr>
                  <tr className="border-t ui-border ui-bg-skeleton/20">
                    <td className="px-4 py-2 text-sm ui-text-body"><code className="ui-bg-skeleton px-2 py-1 rounded">Enter</code> (in chat input)</td>
                    <td className="px-4 py-2 text-sm ui-text-body">Send message</td>
                  </tr>
                  <tr className="border-t ui-border">
                    <td className="px-4 py-2 text-sm ui-text-body"><code className="ui-bg-skeleton px-2 py-1 rounded">Shift + Enter</code> (in chat input)</td>
                    <td className="px-4 py-2 text-sm ui-text-body">New line in message</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Technologies Used</h2>
            <p className="ui-text-body leading-relaxed">
              This website is built using:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li>HTML5 with semantic markup</li>
              <li>CSS with responsive design</li>
              <li>JavaScript/React with proper ARIA implementation</li>
              <li>Next.js for server-side rendering and improved performance</li>
              <li>Web Crypto API and IndexedDB for secure local storage</li>
              <li>Web Audio API for sound effects and audio feedback</li>
              <li>Web Speech API for voice input</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Browser and Assistive Technology Compatibility</h2>
            <p className="ui-text-body leading-relaxed">
              This website is designed to be compatible with:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li>Latest versions of Chrome, Firefox, Safari, and Edge</li>
              <li>Screen readers including NVDA, JAWS, and VoiceOver</li>
              <li>Screen magnification software</li>
              <li>Speech recognition software</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Known Limitations</h2>
            <p className="ui-text-body leading-relaxed">
              While we strive for full accessibility, there may be some limitations:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li><strong>Code blocks:</strong> Some complex code examples may be challenging for screen readers; we provide context in surrounding text</li>
              <li><strong>Third-party content:</strong> External links may lead to sites with varying accessibility levels</li>
              <li><strong>PDF documents:</strong> If any PDFs are linked, they may not be fully accessible</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">AI Voice Assistant Limitations</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li><strong>Browser support:</strong> Voice input requires a browser that supports the Web Speech API (Chrome, Edge, Safari). Firefox has limited support</li>
              <li><strong>Speech recognition accuracy:</strong> Voice input accuracy depends on your microphone quality, accent, and background noise</li>
              <li><strong>Language support:</strong> Speech recognition and TTS are currently optimized for English</li>
              <li><strong>Internet required:</strong> The voice assistant requires an internet connection to process speech and generate responses</li>
              <li><strong>AI response quality:</strong> AI-generated responses may contain errors and should be verified</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">E2EE Messaging Limitations</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li><strong>Emoji verification:</strong> Device verification uses emoji sequences; screen readers announce emoji names but the visual comparison may be challenging</li>
              <li><strong>Key backup:</strong> The backup password strength indicator uses color; we also provide text descriptions</li>
              <li><strong>IndexedDB:</strong> Private keys are stored in IndexedDB which may not be accessible via screen readers</li>
              <li><strong>WASM support:</strong> End-to-end encryption requires WebAssembly; we fall back to Web Crypto API where WASM is unavailable</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Donation System Limitations</h3>
            <ul className="list-disc list-inside space-y-2 ui-text-body">
              <li><strong>PayPal SDK:</strong> PayPal&apos;s checkout dialog has its own accessibility considerations outside our control</li>
              <li><strong>Bank transfer:</strong> Copy-to-clipboard feedback may vary by screen reader</li>
            </ul>

            <p className="ui-text-body leading-relaxed mt-4">
              We are continuously working to improve accessibility and address any issues.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Preferences and Data Storage</h2>
            <p className="ui-text-body leading-relaxed">
              Your accessibility-related preferences are stored locally on your device:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li><strong>Theme preference:</strong> Your chosen display mode (dark, light, or system) persists between sessions</li>
              <li><strong>Voice settings:</strong> Your TTS voice selection and auto-speak preference are remembered</li>
              <li><strong>Sound settings:</strong> Your sound effect preferences (volume, categories) are saved</li>
              <li><strong>Chat state:</strong> The Unified Chat Window remembers your last active tab</li>
              <li><strong>All settings stored locally:</strong> None of your preferences or data are sent to our servers unless you&apos;re logged in</li>
            </ul>
            <p className="ui-text-body leading-relaxed mt-4">
              You can clear all locally stored data at any time through your browser settings. See our <a href="/privacy" className="text-blue-400 hover:text-cyan-300">Privacy Policy</a> for complete details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Feedback and Contact</h2>
            <p className="ui-text-body leading-relaxed">
              We welcome your feedback on the accessibility of Claude Insider. If you encounter any accessibility barriers or have suggestions for improvement, please contact us:
            </p>
            <div className="ui-bg-card border ui-border rounded-lg p-4 mt-4">
              <p className="text-gray-300">
                <strong>Email:</strong>{" "}
                <a href="mailto:vladimir@dukelic.com" className="text-blue-400 hover:text-cyan-300">
                  vladimir@dukelic.com
                </a>
              </p>
            </div>
            <p className="ui-text-body leading-relaxed mt-4">
              We aim to respond to accessibility feedback within 5 business days and will work to address any issues as quickly as possible.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Enforcement Procedures</h2>
            <p className="ui-text-body leading-relaxed">
              If you are not satisfied with our response to your accessibility concern, you may contact the relevant authorities in your jurisdiction:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 ui-text-body">
              <li><strong>EU/EEA:</strong> Contact your national equality body or digital accessibility authority</li>
              <li><strong>United States:</strong> File a complaint with the U.S. Department of Justice or relevant state agency</li>
              <li><strong>Serbia:</strong> Contact the Commissioner for the Protection of Equality (Poverenik za zaštitu ravnopravnosti)</li>
            </ul>
          </section>

          <section className="mb-8 p-6 ui-bg-card border ui-border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <p className="ui-text-body leading-relaxed">
              <strong>In short:</strong> We&apos;ve built Claude Insider with accessibility in mind. We support keyboard navigation, screen readers, high contrast, multiple themes, and an AI Voice Assistant with voice input/output for hands-free interaction.
            </p>
            <p className="ui-text-body leading-relaxed mt-3">
              <strong>New features:</strong> Our Unified Chat Window (Cmd/Ctrl + .) is fully keyboard accessible with ARIA support. E2EE messaging includes accessible device verification and key backup forms. Donation forms use proper labels and feedback.
            </p>
            <p className="ui-text-body leading-relaxed mt-3">
              If you find any issues, please let us know at vladimir@dukelic.com.
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
