import { setOpportunitySaved } from "../../../../../../modules/ai-clip-intelligence/ai-clip-service";
import { errorResponse, jsonResponse } from "../../../../../../modules/http/api-response";

interface RouteContext {
  params: {
    id: string;
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = await readJsonBody(request);
    const data = await setOpportunitySaved(context.params.id, typeof body.saved === "boolean" ? body.saved : undefined);

    if (!data) {
      return jsonResponse({ data: null, error: "Opportunity not found" }, { status: 404 });
    }

    return jsonResponse({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

async function readJsonBody(request: Request): Promise<{ saved?: boolean }> {
  try {
    return (await request.json()) as { saved?: boolean };
  } catch {
    return {};
  }
}
