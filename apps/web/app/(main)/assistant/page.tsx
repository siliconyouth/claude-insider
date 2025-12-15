import { redirect } from "next/navigation";

// Redirect to the dedicated chat page
// The assistant popup is also available from any page
export default function AssistantPage() {
  redirect("/chat");
}
