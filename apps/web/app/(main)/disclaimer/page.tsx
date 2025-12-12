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
        <article className="prose prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Disclaimer</h1>
          <p className="text-gray-400 text-sm mb-8">Last updated: December 12, 2025</p>

          <section className="mb-8 p-6 bg-violet-500/10 border border-violet-500/30 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-violet-400">Important Notice</h2>
            <p className="text-gray-300 leading-relaxed">
              Claude Insider is an <strong>unofficial, independent project</strong> and is <strong>not affiliated with, endorsed by, sponsored by, or officially connected to Anthropic, PBC</strong> or any of its subsidiaries, affiliates, or related companies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">No Official Affiliation</h2>
            <p className="text-gray-300 leading-relaxed">
              This website is a personal project created by Vladimir Dukelic to provide documentation, tips, and resources for users of Claude AI products. It is operated independently and has no official relationship with Anthropic.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>&quot;Claude&quot;, &quot;Claude AI&quot;, &quot;Claude Code&quot;, and related marks are trademarks of Anthropic, PBC</li>
              <li>This website does not represent Anthropic&apos;s official views or positions</li>
              <li>For official Claude documentation, please visit <a href="https://docs.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-cyan-300">docs.anthropic.com</a></li>
              <li>For official support, please contact Anthropic directly through their official channels</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information Accuracy</h2>
            <p className="text-gray-300 leading-relaxed">
              While we strive to provide accurate and up-to-date information, we make no representations or warranties about:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li><strong>Accuracy:</strong> The information may contain errors, inaccuracies, or omissions</li>
              <li><strong>Completeness:</strong> The documentation may not cover all features or use cases</li>
              <li><strong>Timeliness:</strong> Claude AI products evolve rapidly; information may become outdated</li>
              <li><strong>Reliability:</strong> Code examples and configurations may not work in all environments</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Always refer to official Anthropic documentation for the most current and authoritative information.</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Educational Purpose Only</h2>
            <p className="text-gray-300 leading-relaxed">
              The content on this website is provided for <strong>educational and informational purposes only</strong>. It should not be construed as:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Professional, technical, or expert advice</li>
              <li>Official product documentation or support</li>
              <li>A guarantee of specific outcomes or results</li>
              <li>Legal, financial, or business advice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Use at Your Own Risk</h2>
            <p className="text-gray-300 leading-relaxed">
              Any actions you take based on the information on this website are at your own risk. We disclaim all liability for:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Any errors or omissions in the content</li>
              <li>Any loss or damage arising from the use of information on this website</li>
              <li>Any issues arising from implementing code examples or configurations</li>
              <li>Any decisions made based on the content of this website</li>
              <li>Any incompatibility with current or future versions of Claude AI products</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">AI Voice Assistant Disclaimer</h2>
            <p className="text-gray-300 leading-relaxed">
              This website includes an AI Voice Assistant feature powered by third-party services. Important disclaimers regarding this feature:
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">AI-Generated Responses</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>Responses are generated by Claude AI (Anthropic) and may contain inaccuracies</li>
              <li>The assistant may &quot;hallucinate&quot; or provide incorrect information</li>
              <li>Responses should be verified against official documentation</li>
              <li>The assistant is not a substitute for professional advice</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">Third-Party Services</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong>Anthropic:</strong> We are not affiliated with Anthropic. Using the assistant involves Anthropic&apos;s API and their terms</li>
              <li><strong>ElevenLabs:</strong> Text-to-speech is provided by ElevenLabs. Voice output may not perfectly match written text</li>
              <li><strong>Browser Speech API:</strong> Voice input quality depends on your browser and device capabilities</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">No Guarantees</h3>
            <p className="text-gray-300 leading-relaxed">
              We make no guarantees regarding:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 text-gray-300">
              <li>Availability or uptime of the AI assistant</li>
              <li>Quality or accuracy of AI responses</li>
              <li>Quality or availability of text-to-speech output</li>
              <li>Compatibility with your browser or device</li>
              <li>Privacy practices of third-party API providers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Code Examples</h2>
            <p className="text-gray-300 leading-relaxed">
              Code examples, configurations, and technical instructions provided on this website:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Are provided &quot;as is&quot; without warranty of any kind</li>
              <li>May require modification for your specific use case</li>
              <li>May not reflect current API versions or best practices</li>
              <li>Should be reviewed and tested before use in production environments</li>
              <li>May have security implications that you should evaluate</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Always test code in a safe environment before deploying to production.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">External Links</h2>
            <p className="text-gray-300 leading-relaxed">
              This website may contain links to external websites and resources. We:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Have no control over the content of external sites</li>
              <li>Do not endorse or take responsibility for external content</li>
              <li>Cannot guarantee the availability or accuracy of linked resources</li>
              <li>Are not responsible for any transactions you conduct on external sites</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data and Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong>Claude Insider does NOT store your data on any server.</strong> All user data is stored exclusively in your browser&apos;s localStorage:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Chat conversations with the AI assistant</li>
              <li>Theme, voice, and language preferences</li>
              <li>Search history</li>
              <li>Any personalization settings you configure</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>Your data remains on your device only.</strong> We have no access to your conversations, preferences, or any locally stored information. You can delete all your data at any time through your browser settings or the application interface.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              For complete details, see our <a href="/privacy" className="text-blue-400 hover:text-cyan-300">Privacy Policy</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">No Professional Relationship</h2>
            <p className="text-gray-300 leading-relaxed">
              Use of this website does not create any professional, consulting, or advisory relationship between you and the website owner. For professional advice, please consult qualified professionals in the relevant field.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes and Updates</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Modify, update, or remove content at any time without notice</li>
              <li>Change the structure or availability of the website</li>
              <li>Discontinue the website at any time</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              We encourage you to check back regularly for updates and to verify information with official sources.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              To the fullest extent permitted by applicable law, Claude Insider and its owner shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-gray-300">
              <li>Your use of or reliance on any information on this website</li>
              <li>Any errors or omissions in the content</li>
              <li>Any interruption or cessation of the website</li>
              <li>Any viruses or other harmful components transmitted through the website</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about this disclaimer or notice any inaccuracies in our content, please contact us:
            </p>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mt-4">
              <p className="text-gray-300">
                <strong>Email:</strong>{" "}
                <a href="mailto:vladimir@dukelic.com" className="text-blue-400 hover:text-cyan-300">
                  vladimir@dukelic.com
                </a>
              </p>
            </div>
          </section>

          <section className="mb-8 p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong>In short:</strong> Claude Insider is an unofficial, independent resource. We&apos;re not affiliated with Anthropic. Information may be outdated or inaccurate. Always verify with official sources. Use code examples at your own risk. <strong>Your data (chat history, preferences) is stored only in your browser - we keep nothing on our servers.</strong> For official documentation, visit docs.anthropic.com.
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
