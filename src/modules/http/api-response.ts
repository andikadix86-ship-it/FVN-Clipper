import { getHttpStatus, toApiErrorPayload } from "./api-error";

export function jsonResponse(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init.headers
    }
  });
}

export function errorResponse(error: unknown) {
  return jsonResponse(toApiErrorPayload(error), { status: getHttpStatus(error) });
}
