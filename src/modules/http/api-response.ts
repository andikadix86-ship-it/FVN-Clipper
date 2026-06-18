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
  const message = error instanceof Error ? error.message : "Unexpected API error";

  return jsonResponse(
    {
      error: message,
      data: null
    },
    { status: 500 }
  );
}
