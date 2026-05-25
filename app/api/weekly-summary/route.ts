import { auth } from "@/lib/auth";
import { getWeeklySummaryForUser } from "@/lib/weekly-summary";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = await getWeeklySummaryForUser(session.user.id);
  if (!data) {
    return new Response("Failed to fetch weekly summary", { status: 500 });
  }

  return Response.json(data);
}
