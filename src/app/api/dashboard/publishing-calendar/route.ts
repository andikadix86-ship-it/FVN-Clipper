import { getPublishingCalendar } from "../../../../modules/dashboard/dashboard-service";
import { errorResponse, jsonResponse } from "../../../../modules/http/api-response";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const data = await getPublishingCalendar({
      platform: searchParams.get("platform"),
      status: searchParams.get("status"),
      date: searchParams.get("date")
    });

    return jsonResponse({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
