import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Inbox } from "@/components/messaging";
import { updatePresence } from "@/app/actions/presence";
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

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
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0a0a]">
      <Header />
      <div className="flex-1">
        <Inbox currentUserId={session.user.id} />
      </div>
      <Footer />
    </div>
  );
}
