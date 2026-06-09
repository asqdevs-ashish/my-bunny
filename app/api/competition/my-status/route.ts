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
    const bothAgreed = coupleEntry.user1Agreed && coupleEntry.user2Agreed;
    const myNameSuggestion = isUser1 ? coupleEntry.nameSuggestedByUser1 : coupleEntry.nameSuggestedByUser2;
    const partnerNameSuggestion = isUser1 ? coupleEntry.nameSuggestedByUser2 : coupleEntry.nameSuggestedByUser1;

    // Invite/decline info
    const partnerDeclined = isUser1 ? coupleEntry.user2Declined : coupleEntry.user1Declined;
    const iDeclined = isUser1 ? coupleEntry.user1Declined : coupleEntry.user2Declined;
    
    // Pending edit info
    const pendingEdit = coupleEntry.pendingEditField ? {
      field: coupleEntry.pendingEditField,
      value: coupleEntry.pendingEditValue,
      requestedById: coupleEntry.pendingEditRequestedById,
      requestedByName: coupleEntry.pendingEditRequestedById === coupleEntry.user1Id 
        ? (isUser1 ? currentUser.name : user.partner.name)
        : (isUser1 ? user.partner.name : currentUser.name),
      approvedByMe: isUser1 
        ? coupleEntry.pendingEditApprovedByUser1 
        : coupleEntry.pendingEditApprovedByUser2,
      approvedByPartner: isUser1 
        ? coupleEntry.pendingEditApprovedByUser2 
        : coupleEntry.pendingEditApprovedByUser1,
      requestedByMe: coupleEntry.pendingEditRequestedById === currentUser.id,
    } : null;

    // Status: 
    //   "invited"       = partner invited me, I need to respond
    //   "joined_pending" = I invited, waiting for partner
    //   "naming"         = both agreed (legacy, auto-resolved now)
    //   "joined"         = team name locked, in competition
    //   "partner_declined" = partner said no
    //   "i_declined"     = I said no
    let status: string;
    
    if (coupleEntry.teamName) {
      status = "joined";
    } else if (bothAgreed) {
      status = "naming"; // Should auto-resolve now
    } else if (partnerDeclined) {
      status = "partner_declined";
    } else if (iDeclined) {
      status = "i_declined";
    } else if (myAgreed && !partnerAgreed) {
      status = "invite_sent";
    } else if (!myAgreed && partnerAgreed) {
      status = "invited";
    } else {
      status = "joined_pending";
    }

    return Response.json({
      status,
      teamName: coupleEntry.teamName,
      teamImage: coupleEntry.teamImage,
      myAgreed,
      partnerAgreed,
      partnerDeclined,
      myNameSuggestion,
      partnerNameSuggestion,
      partnerName: user.partner.name,
      partnerId: user.partnerId,
      coupleKey,
      isUser1,
      user1Id: coupleEntry.user1Id,
      user2Id: coupleEntry.user2Id,
      pendingEdit,
    });
  } catch (error) {
    console.error("Competition status error:", error);
    return Response.json({ status: "error", error: "Failed to check status" });
  }
}
