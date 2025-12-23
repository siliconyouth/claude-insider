/**
 * Highlights Section
 *
 * Displays key technology highlights at the bottom of the homepage.
 * Extracted for code-splitting to reduce initial bundle size.
 *
 * Performance Impact:
 * - ~2KB of JavaScript moved out of initial bundle
 * - 5 highlight cards with SVG icons load on-demand
 */

export function HighlightsSection() {
  return (
    <div className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#111111]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-xl font-semibold text-center mb-10 text-gray-900 dark:text-white">
          Built for the <span className="gradient-text-stripe">Modern Developer</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {/* Claude Opus 4.5 */}
          <div className="group text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:from-violet-500/20 group-hover:to-blue-500/20 transition-all duration-300">
              <svg className="w-6 h-6 text-violet-500 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Claude Opus 4.5</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI-Powered</div>
          </div>

          {/* E2EE Messaging */}
          <div className="group text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:from-emerald-500/20 group-hover:to-cyan-500/20 transition-all duration-300">
              <svg className="w-6 h-6 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">E2EE Messaging</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Matrix Protocol</div>
          </div>

          {/* 42 AI Voices */}
          <div className="group text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-300">
              <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">42 AI Voices</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">ElevenLabs TTS</div>
          </div>

          {/* 1,952+ Resources */}
          <div className="group text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:from-amber-500/20 group-hover:to-orange-500/20 transition-all duration-300">
              <svg className="w-6 h-6 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">1,952+</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Curated Resources</div>
          </div>

          {/* Open Source */}
          <div className="group text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500/10 to-slate-500/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:from-gray-500/20 group-hover:to-slate-500/20 transition-all duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Open Source</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">MIT License</div>
          </div>
        </div>
      </div>
    </div>
  );
}
