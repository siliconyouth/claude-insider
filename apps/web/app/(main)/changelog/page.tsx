import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import fs from "fs";
import path from "path";

export const metadata: Metadata = {
  title: "Changelog - Claude Insider",
  description: "Version history and release notes for Claude Insider",
};

interface ChangelogVersion {
  version: string;
  date: string;
  sections: { title: string; items: string[] }[];
}

function parseChangelog(content: string): ChangelogVersion[] {
  const versions: ChangelogVersion[] = [];
  const lines = content.split("\n");

  let currentVersion: ChangelogVersion | null = null;
  let currentSection: { title: string; items: string[] } | null = null;

  for (const line of lines) {
    // Match version headers: ## [x.x.x] - YYYY-MM-DD
    const versionMatch = line.match(/^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})/);
    if (versionMatch && versionMatch[1] && versionMatch[2]) {
      if (currentVersion) {
        if (currentSection) {
          currentVersion.sections.push(currentSection);
        }
        versions.push(currentVersion);
      }
      currentVersion = {
        version: versionMatch[1],
        date: versionMatch[2],
        sections: [],
      };
      currentSection = null;
      continue;
    }

    // Match section headers: ### Added, ### Changed, etc.
    const sectionMatch = line.match(/^### (.+)/);
    if (sectionMatch && sectionMatch[1] && currentVersion) {
      if (currentSection) {
        currentVersion.sections.push(currentSection);
      }
      currentSection = {
        title: sectionMatch[1],
        items: [],
      };
      continue;
    }

    // Match list items: - item
    const itemMatch = line.match(/^- (.+)/);
    if (itemMatch && itemMatch[1] && currentSection) {
      currentSection.items.push(itemMatch[1]);
    }
  }

  // Push the last version and section
  if (currentVersion) {
    if (currentSection) {
      currentVersion.sections.push(currentSection);
    }
    versions.push(currentVersion);
  }

  return versions;
}

function getSectionColor(title: string): string {
  const colors: Record<string, string> = {
    Added: "bg-green-500/10 text-green-400 border-green-500/20",
    Changed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Fixed: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    Removed: "bg-red-500/10 text-red-400 border-red-500/20",
    Security: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    Deprecated: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };
  return colors[title] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

export default function ChangelogPage() {
  // Read CHANGELOG.md from data/ (copied during prebuild for Vercel deployment)
  // On Vercel, only apps/web is deployed, so monorepo root files aren't available
  const changelogPath = path.join(process.cwd(), "data", "CHANGELOG.md");
  let versions: ChangelogVersion[] = [];

  try {
    const content = fs.readFileSync(changelogPath, "utf-8");
    versions = parseChangelog(content);
  } catch {
    // Fallback if file not found
    versions = [];
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main id="main-content" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Changelog</h1>
          <p className="text-gray-400 text-lg">
            All notable changes to Claude Insider are documented here.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            This project adheres to{" "}
            <a
              href="https://semver.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-cyan-300"
            >
              Semantic Versioning
            </a>
            .
          </p>
        </div>

        {versions.length === 0 ? (
          <p className="text-gray-400">No changelog entries found.</p>
        ) : (
          <div className="space-y-12">
            {versions.map((version) => (
              <article
                key={version.version}
                className="relative pl-8 border-l-2 border-gray-800"
              >
                {/* Version dot */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gradient-to-r from-violet-500 to-blue-500" />

                {/* Version header */}
                <header className="mb-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-semibold text-white">
                      v{version.version}
                    </h2>
                    <time
                      dateTime={version.date}
                      className="text-sm text-gray-400 bg-gray-800 px-2 py-0.5 rounded"
                    >
                      {new Date(version.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                </header>

                {/* Sections */}
                <div className="space-y-6">
                  {version.sections.map((section, idx) => (
                    <div key={idx}>
                      <h3
                        className={`inline-block text-sm font-medium px-2 py-1 rounded border mb-3 ${getSectionColor(section.title)}`}
                      >
                        {section.title}
                      </h3>
                      <ul className="space-y-2 text-gray-300">
                        {section.items.map((item, itemIdx) => (
                          <li
                            key={itemIdx}
                            className="flex items-start gap-2 text-sm leading-relaxed"
                          >
                            <span className="text-gray-500 mt-1.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Link to GitHub */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            View the full changelog on{" "}
            <a
              href="https://github.com/siliconyouth/claude-insider/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-cyan-300"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </main>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
