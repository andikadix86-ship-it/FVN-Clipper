import { getOpportunities } from "../../../../modules/ai-clip-intelligence/ai-clip-service";
import { errorResponse, jsonResponse } from "../../../../modules/http/api-response";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const data = await getOpportunities({
      keyword: searchParams.get("keyword"),
      category: searchParams.get("category"),
      platform: searchParams.get("platform"),
      status: searchParams.get("status"),
      date: searchParams.get("date"),
      performance: searchParams.get("performance"),
      campaign: searchParams.get("campaign"),
      saved: searchParams.get("saved"),
      limit: searchParams.get("limit"),
      sort: searchParams.get("sort")
    });

    return jsonResponse({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
