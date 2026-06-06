import { getApiUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { resolveCurrentUser } from "@/lib/current-user";

export async function GET(req: Request) {
  const userData = await getApiUser(req);
  if (!userData?.id) return new Response("Unauthorized", { status: 401 });

  try {
    const db = prisma;
    if (!db) throw new Error("Database not available");

    const currentUser = await resolveCurrentUser(userData);
    if (!currentUser) {
      return Response.json({ status: "no_partner" });
    }

    // Find active competition
    const competition = await db.competition.findFirst({
      where: { isActive: true },
    });

    if (!competition) {
      return Response.json({ status: "no_competition" });
    }

    // Check if user has a partner
    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      include: { partner: true },
    });

    if (!user?.partnerId || !user?.partner) {
      return Response.json({ status: "no_partner" });
    }

    const [a, b] = [currentUser.id, user.partnerId].sort();
    const coupleKey = `${a}_${b}`;

    // Check competition status
    const coupleEntry = await db.competitionCouple.findUnique({
      where: { coupleKey },
    });

    if (!coupleEntry) {
      return Response.json({
        status: "not_joined",
        partnerName: user.partner.name,
        partnerId: user.partnerId,
        coupleKey,
      });
    }

    const isUser1 = coupleEntry.user1Id === currentUser.id;
    const myAgreed = isUser1 ? coupleEntry.user1Agreed : coupleEntry.user2Agreed;
    const partnerAgreed = isUser1 ? coupleEntry.user2Agreed : coupleEntry.user1Agreed;
    const myNameSuggestion = isUser1 ? coupleEntry.nameSuggestedByUser1 : coupleEntry.nameSuggestedByUser2;
    const partnerNameSuggestion = isUser1 ? coupleEntry.nameSuggestedByUser2 : coupleEntry.nameSuggestedByUser1;

    return Response.json({
      status: coupleEntry.teamName ? "joined" : "naming",
      teamName: coupleEntry.teamName,
      myAgreed,
      partnerAgreed,
      myNameSuggestion,
      partnerNameSuggestion,
      partnerName: user.partner.name,
      partnerId: user.partnerId,
      coupleKey,
      isUser1,
      user1Id: coupleEntry.user1Id,
      user2Id: coupleEntry.user2Id,
    });
  } catch (error) {
    console.error("Competition status error:", error);
    return Response.json({ status: "error", error: "Failed to check status" });
  }
}
