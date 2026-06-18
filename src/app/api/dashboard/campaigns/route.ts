import { getDashboardCampaigns } from "../../../../modules/dashboard/dashboard-service";
import { errorResponse, jsonResponse } from "../../../../modules/http/api-response";

export async function GET() {
  try {
    const data = await getDashboardCampaigns();
    return jsonResponse({ data });
  } catch (error) {
    return errorResponse(error);
  }
}
