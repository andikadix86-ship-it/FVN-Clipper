import { getAiProviderPublicStatus } from "../../../../../modules/ai/ai-provider";
import { errorResponse, jsonResponse } from "../../../../../modules/http/api-response";

export async function GET() {
  try {
    return jsonResponse({ success: true, data: getAiProviderPublicStatus() });
  } catch (error) {
    return errorResponse(error);
  }
}
