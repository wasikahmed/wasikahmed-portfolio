'use client';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

function readCsrfToken(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export interface AdminFetchError {
  error: string;
}

/**
 * `fetch` for admin API calls — attaches the CSRF header every mutating
 * request needs (see src/server/csrf.ts) so every form doesn't have to
 * remember to read the cookie itself.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = readCsrfToken();
  const headers = new Headers(init.headers);

  // FormData bodies (file uploads) must NOT get an explicit Content-Type —
  // the browser sets its own `multipart/form-data; boundary=...` only when
  // it computes the body itself. Setting it here would strip the boundary
  // and the server would fail to parse the upload at all.
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set(CSRF_HEADER_NAME, token);

  return fetch(input, { ...init, headers, credentials: 'same-origin' });
}

/** Parses a JSON admin API response, throwing a readable message on failure. */
export async function adminFetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await adminFetch(input, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (body as AdminFetchError | null)?.error ?? `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return body as T;
}
