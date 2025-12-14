/**
 * Dashboard Layout
 *
 * Protected admin layout for resource management.
 * Includes sidebar navigation and authentication check.
 */

import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import { cookies } from "next/headers";
import { hasRole } from "@/collections/Users";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";

export const metadata = {
  title: "Resource Dashboard | Claude Insider",
  description: "AI-powered resource discovery and management",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const payload = await getPayload({ config });
  const cookieStore = await cookies();
  const token = cookieStore.get("payload-token")?.value;

  if (!token) {
    redirect("/admin/login?redirect=/dashboard");
  }

  let user;
  try {
    const authResult = await payload.auth({
      headers: new Headers({ cookie: `payload-token=${token}` }),
    });
    user = authResult.user;
  } catch {
    redirect("/admin/login?redirect=/dashboard");
  }

  if (!user || !hasRole(user, ["admin", "moderator"])) {
    redirect("/admin/login?redirect=/dashboard");
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
