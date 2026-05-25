import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const currentUser = await resolveCurrentUser(session.user);
    if (!currentUser) {
      return Response.json({ linked: false, partner: null });
    }

    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      include: { partner: true },
    });

    if (!user) {
      return Response.json({ linked: false, partner: null });
    }

    return Response.json({
      linked: !!user.partnerId,
      partnerSince: user.partnerSince,
      hasPartnerCode: !!user.partnerCode,
      partner: user.partner
        ? { id: user.partner.id, name: user.partner.name }
        : null,
    });
  } catch (error) {
    console.error("Failed to fetch partner status:", error);
    return new Response("Failed to fetch partner status", { status: 500 });
  }
}
