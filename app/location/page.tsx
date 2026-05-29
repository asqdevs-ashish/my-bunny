import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LocationClient } from "./client";

export default async function LocationPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <LocationClient userName={session.user.name || "You"} />
    </div>
  );
}
