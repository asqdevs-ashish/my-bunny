import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { PartnerChatInterface } from "@/components/partner-chat-interface";

export default async function PartnerChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      <Nav />
      <main className="flex-1 flex flex-col min-h-0">
        <PartnerChatInterface fullScreen />
      </main>
    </div>
  );
}
