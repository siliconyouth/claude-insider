import { redirect } from "next/navigation";

// The assistant is now available as a popup from any page
// Redirect to homepage where users can open the assistant popup
export default function AssistantPage() {
  redirect("/");
}
