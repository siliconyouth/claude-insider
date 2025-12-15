import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Inbox } from "@/components/messaging";
import { updatePresence } from "@/app/actions/presence";

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
    <div className="h-[calc(100vh-64px)]">
      <Inbox currentUserId={session.user.id} />
    </div>
  );
}
