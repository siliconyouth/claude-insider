import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-orange-500 to-amber-600">
                <span className="text-xs font-bold text-white">C</span>
              </div>
              <span className="text-sm text-gray-400">
                Claude Insider
              </span>
            </Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <span className="text-sm text-gray-500">
              Built with Claude Code & Opus 4.5
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-950 rounded"
            >
              Claude AI
            </a>
            <a
              href="https://anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-950 rounded"
            >
              Anthropic
            </a>
            <a
              href="https://github.com/siliconyouth/claude-insider"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-950 rounded"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Copyright and Attribution */}
        <div className="mt-6 pt-6 border-t border-gray-800/50 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <p className="text-sm text-gray-500">
            &copy; {currentYear}{" "}
            <a
              href="https://github.com/siliconyouth/claude-insider"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
            >
              Vladimir Dukelic
            </a>
            . MIT License with Attribution.
          </p>
          <span className="hidden sm:inline text-gray-600">|</span>
          <Link
            href="/privacy"
            className="text-sm text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
          >
            Privacy Policy
          </Link>
          <span className="hidden sm:inline text-gray-600">|</span>
          <Link
            href="/terms"
            className="text-sm text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
          >
            Terms
          </Link>
          <span className="hidden sm:inline text-gray-600">|</span>
          <Link
            href="/disclaimer"
            className="text-sm text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
          >
            Disclaimer
          </Link>
          <span className="hidden sm:inline text-gray-600">|</span>
          <Link
            href="/accessibility"
            className="text-sm text-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded"
          >
            Accessibility
          </Link>
        </div>
      </div>
    </footer>
  );
}
