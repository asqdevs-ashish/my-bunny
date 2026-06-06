import { getWeeklySummaryForUser } from "@/lib/weekly-summary";
import { getApiUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = await getWeeklySummaryForUser(user.id);
  if (!data) {
    return new Response("Failed to fetch weekly summary", { status: 500 });
  }

  return Response.json(data);
}
