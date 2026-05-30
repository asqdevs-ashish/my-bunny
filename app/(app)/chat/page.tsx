import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ChatInterface } from "@/components/chat-interface";

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden px-0 sm:px-4 md:py-5 pb-16 md:pb-0">
        <ChatInterface />
      </main>
    </div>
  );
}
