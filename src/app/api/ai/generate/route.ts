import { generateAiFeatureContent } from "../../../../modules/ai/ai-feature-service";
import { errorResponse, jsonResponse } from "../../../../modules/http/api-response";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const data = await generateAiFeatureContent(body);
    return jsonResponse({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
