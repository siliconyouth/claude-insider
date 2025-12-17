import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Inbox } from "@/components/messaging";
import { updatePresence } from "@/app/actions/presence";
import { Header } from '@/components/header';

export const metadata = {
  title: "Messages | Claude Insider",
  description: "Your direct messages and conversations",
};

export default async function InboxPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/");
  }

  // Set user as online when they visit inbox
  await updatePresence("online");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white dark:bg-[#0a0a0a]">
      <Header />
      {/* min-h-0 is critical: allows flex child to shrink below content size */}
      <div className="flex-1 min-h-0">
        <Inbox currentUserId={session.user.id} />
      </div>
      {/* Footer intentionally omitted - chat interface takes full height */}
    </div>
  );
}
