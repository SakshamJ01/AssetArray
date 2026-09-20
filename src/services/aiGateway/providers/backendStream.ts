/**
 * Shared authenticated backend streaming request helper.
 * All AI providers route through the Asset Array backend proxy
 * (/api/ai/stream) which enforces Bearer-token authentication when
 * AUTH_REQUIRED=true. This helper attaches the session access token,
 * and transparently refreshes + retries once on a 401 response.
 */

export interface BackendStreamRequestOptions {
  backendUrl: string;
  accessToken?: string | null;
  endpoint?: string;
  onUnauthorized?: () => Promise<string | null>;
  signal?: AbortSignal;
  body: Record<string, unknown>;
}

export async function fetchBackendStream(
  opts: BackendStreamRequestOptions
): Promise<Response> {
  const base = opts.endpoint || opts.backendUrl;
  const url = `${base.replace(/\/+$/, "")}/api/ai/stream`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.accessToken) {
    headers.Authorization = `Bearer ${opts.accessToken}`;
  }

  const request = (token: string | null | undefined) => {
    const requestHeaders = { ...headers };
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
    return fetch(url, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(opts.body),
      signal: opts.signal,
    });
  };

  let response = await request(opts.accessToken);

  if (response.status === 401 && opts.onUnauthorized) {
    const refreshed = await opts.onUnauthorized();
    if (refreshed) {
      response = await request(refreshed);
    }
  }

  return response;
}