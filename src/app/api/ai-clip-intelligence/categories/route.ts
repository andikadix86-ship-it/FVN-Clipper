import { getCategories } from "../../../../modules/ai-clip-intelligence/ai-clip-service";
import { errorResponse, jsonResponse } from "../../../../modules/http/api-response";

export async function GET() {
  try {
    const data = await getCategories();
    return jsonResponse({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
