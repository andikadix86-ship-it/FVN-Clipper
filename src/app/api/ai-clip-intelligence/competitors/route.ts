import { getCompetitors } from "../../../../modules/ai-clip-intelligence/ai-clip-service";
import { errorResponse, jsonResponse } from "../../../../modules/http/api-response";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const data = await getCompetitors({
      platform: searchParams.get("platform"),
      niche: searchParams.get("niche")
    });

    return jsonResponse({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
