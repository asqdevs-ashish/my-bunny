import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";
import { getApiUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const userData = await getApiUser(request);
  if (!userData) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const currentUser = await resolveCurrentUser(userData);
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
