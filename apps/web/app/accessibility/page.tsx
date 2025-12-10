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
        <article className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Accessibility Statement</h1>
          <p className="text-gray-400 text-sm mb-8">Last updated: December 9, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
            <p className="text-gray-300 leading-relaxed">
              Claude Insider is committed to ensuring digital accessibility for people with disabilities. We continually strive to improve the user experience for everyone and apply the relevant accessibility standards to achieve this goal.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Conformance Status</h2>
            <p className="text-gray-300 leading-relaxed">
              We aim to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>. These guidelines explain how to make web content more accessible for people with disabilities and more user-friendly for everyone.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              This website has been designed and developed with accessibility in mind from the start.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Accessibility Features</h2>
            <p className="text-gray-300 leading-relaxed">
              We have implemented the following accessibility features on this website:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">Navigation</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Skip to main content:</strong> A skip link is provided to bypass navigation and go directly to the main content</li>
              <li><strong>Keyboard navigation:</strong> All interactive elements are accessible via keyboard</li>
              <li><strong>Focus indicators:</strong> Visible focus states on all interactive elements</li>
              <li><strong>Consistent navigation:</strong> Navigation is consistent across all pages</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Visual Design</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Color contrast:</strong> Text and interactive elements meet WCAG AA contrast requirements</li>
              <li><strong>Theme options:</strong> Dark, light, and system theme modes to accommodate different preferences and needs</li>
              <li><strong>Resizable text:</strong> Content can be resized up to 200% without loss of functionality</li>
              <li><strong>No flashing content:</strong> We avoid content that flashes more than three times per second</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Screen Reader Support</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>ARIA labels:</strong> Appropriate ARIA labels and roles throughout the website</li>
              <li><strong>Semantic HTML:</strong> Proper heading hierarchy and semantic structure</li>
              <li><strong>Alt text:</strong> Decorative images are hidden from screen readers; meaningful images have descriptions</li>
              <li><strong>Live regions:</strong> Dynamic content changes are announced to screen readers</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Interactive Components</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Search modal:</strong> Accessible dialog with proper focus management and ARIA attributes</li>
              <li><strong>Code blocks:</strong> Copy buttons with accessible labels and feedback</li>
              <li><strong>Theme toggle:</strong> Accessible toggle with proper labeling</li>
              <li><strong>Mobile menu:</strong> Accessible hamburger menu for mobile navigation</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">AI Voice Assistant</h3>
            <p className="text-gray-300 leading-relaxed">
              Our AI Voice Assistant is designed with accessibility in mind:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>Voice input:</strong> Speak your questions instead of typing - helpful for users with motor impairments or those who prefer speech</li>
              <li><strong>Text-to-speech output:</strong> AI responses can be read aloud, beneficial for users with visual impairments or reading difficulties</li>
              <li><strong>Keyboard accessible:</strong> All voice assistant controls can be operated via keyboard</li>
              <li><strong>Visual feedback:</strong> Clear visual indicators show when the assistant is listening, processing, or speaking</li>
              <li><strong>Screen reader compatible:</strong> ARIA live regions announce status changes and responses</li>
              <li><strong>Alternative text input:</strong> Users can always type instead of speaking if preferred</li>
              <li><strong>Stop controls:</strong> Easy-to-access buttons to stop listening or stop TTS playback</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Keyboard Shortcuts</h2>
            <p className="text-gray-300 leading-relaxed">
              The following keyboard shortcuts are available:
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full border border-gray-800 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-200">Shortcut</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-200">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-800">
                    <td className="px-4 py-2 text-sm text-gray-300"><code className="bg-gray-800 px-2 py-1 rounded">Cmd/Ctrl + K</code></td>
                    <td className="px-4 py-2 text-sm text-gray-300">Open search</td>
                  </tr>
                  <tr className="border-t border-gray-800">
                    <td className="px-4 py-2 text-sm text-gray-300"><code className="bg-gray-800 px-2 py-1 rounded">Escape</code></td>
                    <td className="px-4 py-2 text-sm text-gray-300">Close search/modal</td>
                  </tr>
                  <tr className="border-t border-gray-800">
                    <td className="px-4 py-2 text-sm text-gray-300"><code className="bg-gray-800 px-2 py-1 rounded">Tab</code></td>
                    <td className="px-4 py-2 text-sm text-gray-300">Navigate forward through interactive elements</td>
                  </tr>
                  <tr className="border-t border-gray-800">
                    <td className="px-4 py-2 text-sm text-gray-300"><code className="bg-gray-800 px-2 py-1 rounded">Shift + Tab</code></td>
                    <td className="px-4 py-2 text-sm text-gray-300">Navigate backward through interactive elements</td>
                  </tr>
                  <tr className="border-t border-gray-800">
                    <td className="px-4 py-2 text-sm text-gray-300"><code className="bg-gray-800 px-2 py-1 rounded">Enter</code></td>
                    <td className="px-4 py-2 text-sm text-gray-300">Activate focused element</td>
                  </tr>
                  <tr className="border-t border-gray-800">
                    <td className="px-4 py-2 text-sm text-gray-300"><code className="bg-gray-800 px-2 py-1 rounded">↑ / ↓</code></td>
                    <td className="px-4 py-2 text-sm text-gray-300">Navigate search results</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Technologies Used</h2>
            <p className="text-gray-300 leading-relaxed">
              This website is built using:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>HTML5 with semantic markup</li>
              <li>CSS with responsive design</li>
              <li>JavaScript/React with proper ARIA implementation</li>
              <li>Next.js for server-side rendering and improved performance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Browser and Assistive Technology Compatibility</h2>
            <p className="text-gray-300 leading-relaxed">
              This website is designed to be compatible with:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Latest versions of Chrome, Firefox, Safari, and Edge</li>
              <li>Screen readers including NVDA, JAWS, and VoiceOver</li>
              <li>Screen magnification software</li>
              <li>Speech recognition software</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Known Limitations</h2>
            <p className="text-gray-300 leading-relaxed">
              While we strive for full accessibility, there may be some limitations:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>Code blocks:</strong> Some complex code examples may be challenging for screen readers; we provide context in surrounding text</li>
              <li><strong>Third-party content:</strong> External links may lead to sites with varying accessibility levels</li>
              <li><strong>PDF documents:</strong> If any PDFs are linked, they may not be fully accessible</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">AI Voice Assistant Limitations</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Browser support:</strong> Voice input requires a browser that supports the Web Speech API (Chrome, Edge, Safari). Firefox has limited support</li>
              <li><strong>Speech recognition accuracy:</strong> Voice input accuracy depends on your microphone quality, accent, and background noise</li>
              <li><strong>Language support:</strong> Speech recognition and TTS are currently optimized for English</li>
              <li><strong>Internet required:</strong> The voice assistant requires an internet connection to process speech and generate responses</li>
              <li><strong>AI response quality:</strong> AI-generated responses may contain errors and should be verified</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              We are continuously working to improve accessibility and address any issues.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Feedback and Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              We welcome your feedback on the accessibility of Claude Insider. If you encounter any accessibility barriers or have suggestions for improvement, please contact us:
            </p>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-300">
                <strong>Email:</strong>{" "}
                <a href="mailto:vladimir@dukelic.com" className="text-blue-400 hover:text-cyan-300">
                  vladimir@dukelic.com
                </a>
              </p>
            </div>
            <p className="text-gray-300 leading-relaxed mt-4">
              We aim to respond to accessibility feedback within 5 business days and will work to address any issues as quickly as possible.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Enforcement Procedures</h2>
            <p className="text-gray-300 leading-relaxed">
              If you are not satisfied with our response to your accessibility concern, you may contact the relevant authorities in your jurisdiction:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>EU/EEA:</strong> Contact your national equality body or digital accessibility authority</li>
              <li><strong>United States:</strong> File a complaint with the U.S. Department of Justice or relevant state agency</li>
              <li><strong>Serbia:</strong> Contact the Commissioner for the Protection of Equality (Poverenik za zaštitu ravnopravnosti)</li>
            </ul>
          </section>

          <section className="mb-8 p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong>In short:</strong> We&apos;ve built Claude Insider with accessibility in mind. We support keyboard navigation, screen readers, high contrast, multiple themes, and an AI Voice Assistant with voice input/output for hands-free interaction. If you find any issues, please let us know at vladimir@dukelic.com.
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
