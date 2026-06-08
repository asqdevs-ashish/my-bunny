import { Nav } from "@/components/nav";
import { FloatingChatButton } from "@/components/floating-chat-button";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      {children}
      <FloatingChatButton />
    </>
  );
}
