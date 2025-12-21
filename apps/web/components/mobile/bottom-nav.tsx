"use client";

/**
 * Mobile Bottom Navigation
 *
 * App-like bottom navigation bar for mobile devices.
 * Hidden on desktop (md breakpoint and above).
 * Includes safe area padding for notched devices.
 */

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { useAuth } from "@/components/providers/auth-provider";
import { openAIAssistant } from "@/components/unified-chat";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  matchPaths?: string[];
  requiresAuth?: boolean;
  action?: () => void;
}

// Icons
const HomeIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {filled ? (
      <path d="M10.707 2.293a1 1 0 011.586 0l8 8A1 1 0 0119.5 12H19v7a2 2 0 01-2 2h-2a1 1 0 01-1-1v-4a1 1 0 00-1-1h-2a1 1 0 00-1 1v4a1 1 0 01-1 1H7a2 2 0 01-2-2v-7h-.5a1 1 0 01-.793-1.707l8-8z" />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    )}
  </svg>
);

const DocsIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {filled ? (
      <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    )}
  </svg>
);

const ResourcesIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {filled ? (
      <path d="M3.75 3A1.75 1.75 0 002 4.75v3.5C2 9.216 2.784 10 3.75 10h3.5A1.75 1.75 0 009 8.25v-3.5A1.75 1.75 0 007.25 3h-3.5zM3.75 14A1.75 1.75 0 002 15.75v3.5c0 .966.784 1.75 1.75 1.75h3.5A1.75 1.75 0 009 19.25v-3.5A1.75 1.75 0 007.25 14h-3.5zM14.75 3A1.75 1.75 0 0013 4.75v3.5c0 .966.784 1.75 1.75 1.75h3.5A1.75 1.75 0 0020 8.25v-3.5A1.75 1.75 0 0018.25 3h-3.5zM14.75 14a1.75 1.75 0 00-1.75 1.75v3.5c0 .966.784 1.75 1.75 1.75h3.5A1.75 1.75 0 0020 19.25v-3.5a1.75 1.75 0 00-1.75-1.75h-3.5z" />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    )}
  </svg>
);

const ChatIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {filled ? (
      <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    )}
  </svg>
);

const ProfileIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    className="w-6 h-6"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {filled ? (
      <path
        fillRule="evenodd"
        d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
        clipRule="evenodd"
      />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    )}
  </svg>
);

const navItems: NavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: <HomeIcon />,
    activeIcon: <HomeIcon filled />,
    matchPaths: ["/"],
  },
  {
    id: "docs",
    label: "Docs",
    href: "/docs",
    icon: <DocsIcon />,
    activeIcon: <DocsIcon filled />,
    matchPaths: ["/docs"],
  },
  {
    id: "resources",
    label: "Resources",
    href: "/resources",
    icon: <ResourcesIcon />,
    activeIcon: <ResourcesIcon filled />,
    matchPaths: ["/resources"],
  },
  {
    id: "chat",
    label: "Chat",
    href: "#",
    icon: <ChatIcon />,
    activeIcon: <ChatIcon filled />,
    action: () => openAIAssistant(),
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    icon: <ProfileIcon />,
    activeIcon: <ProfileIcon filled />,
    matchPaths: ["/profile", "/settings"],
    requiresAuth: true,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isLoading, showSignIn } = useAuth();

  // Check if a nav item is active
  const isActive = (item: NavItem): boolean => {
    if (item.id === "home") {
      return pathname === "/";
    }
    if (item.matchPaths) {
      return item.matchPaths.some((path) => pathname.startsWith(path));
    }
    return pathname === item.href;
  };

  // Filter items based on auth state
  const visibleItems = navItems.map((item) => {
    if (item.requiresAuth && !user && !isLoading) {
      // Show sign in button that opens auth modal instead of profile
      return {
        ...item,
        label: "Sign In",
        href: "#",
        action: () => showSignIn(),
      };
    }
    return item;
  });

  return (
    <nav
      className={cn(
        // Only show on mobile (hidden on md and above)
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        // Glass morphism background
        "bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-lg",
        // Top border
        "border-t border-gray-200 dark:border-[#262626]",
        // Safe area padding for notched devices
        "pb-[env(safe-area-inset-bottom)]"
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const active = isActive(item);

          // Handle action items (like chat)
          if (item.action) {
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full",
                  "transition-colors duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset rounded-lg"
                )}
                aria-label={item.label}
              >
                <span
                  className={cn(
                    "transition-colors duration-200",
                    active
                      ? "text-blue-600 dark:text-cyan-400"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {active && item.activeIcon ? item.activeIcon : item.icon}
                </span>
                <span
                  className={cn(
                    "text-[10px] mt-1 font-medium transition-colors duration-200",
                    active
                      ? "text-blue-600 dark:text-cyan-400"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full",
                "transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset rounded-lg"
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={cn(
                  "transition-colors duration-200",
                  active
                    ? "text-blue-600 dark:text-cyan-400"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                {active && item.activeIcon ? item.activeIcon : item.icon}
              </span>
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium transition-colors duration-200",
                  active
                    ? "text-blue-600 dark:text-cyan-400"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
