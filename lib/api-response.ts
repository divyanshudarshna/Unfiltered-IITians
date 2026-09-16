export class ApiResponseError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiResponseError";
  }
}

export async function readApiResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const text = await response.text();
  const isJson = response.headers.get("content-type")?.includes("application/json") ?? false;
  let body: unknown;

  if (isJson && text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new ApiResponseError(`${fallbackMessage}: server returned invalid JSON`, response.status);
    }
  }

  if (!response.ok) {
    const serverMessage =
      body && typeof body === "object"
        ? (body as { details?: unknown; error?: unknown; message?: unknown }).details ??
          (body as { error?: unknown }).error ??
          (body as { message?: unknown }).message
        : null;
    throw new ApiResponseError(
      typeof serverMessage === "string"
        ? serverMessage
        : `${fallbackMessage} (HTTP ${response.status})`,
      response.status,
      body,
    );
  }

  if (!isJson || !text) {
    throw new ApiResponseError(
      `${fallbackMessage}: server returned an unexpected response`,
      response.status,
    );
  }

  return body as T;
}
