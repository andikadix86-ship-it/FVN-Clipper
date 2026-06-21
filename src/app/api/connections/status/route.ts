import { getConnectionStatus } from "../../../../modules/connections/connection-status";
import { errorResponse, jsonResponse } from "../../../../modules/http/api-response";

export async function GET() {
  try {
    const data = await getConnectionStatus();
    return jsonResponse({ success: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}
