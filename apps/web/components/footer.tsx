import Link from "next/link";

const APP_VERSION = "0.15.0";
const BUILD_DATE = "2025-12-09";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const buildId = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";

  return (
    <footer className="border-t border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <span>&copy; {currentYear}</span>
          <a
            href="https://github.com/siliconyouth/claude-insider"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Vladimir Dukelic
          </a>
          <span className="text-gray-700">·</span>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <span className="text-gray-700">·</span>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
          <span className="text-gray-700">·</span>
          <Link href="/disclaimer" className="hover:text-white transition-colors">
            Disclaimer
          </Link>
          <span className="text-gray-700">·</span>
          <Link href="/accessibility" className="hover:text-white transition-colors">
            Accessibility
          </Link>
          <span className="text-gray-700">·</span>
          <Link href="/changelog" className="hover:text-white transition-colors">
            Changelog
          </Link>
          <span className="text-gray-700">·</span>
          <span>v{APP_VERSION}-{buildId}</span>
        </div>
      </div>
    </footer>
  );
}
