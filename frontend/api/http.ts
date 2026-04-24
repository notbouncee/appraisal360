const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
const API_PREFIX = `${API_BASE_URL}/api`;
const ACCESS_TOKEN_KEY = "appraisal360_access_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_PREFIX}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  options?: { query?: Record<string, string | number | boolean | undefined>; body?: unknown; auth?: boolean },
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options?.auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const resp = await fetch(buildUrl(path, options?.query), {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!resp.ok) {
    let detail = "Request failed";
    try {
      const parsed = await resp.json();
      detail = parsed?.detail || parsed?.message || detail;
    } catch {
      // ignore parse failure
    }
    throw new Error(detail);
  }

  if (resp.status === 204) {
    return undefined as T;
  }

  return (await resp.json()) as T;
}

export function apiGet<T>(path: string, query?: Record<string, string | number | boolean | undefined>, auth = false): Promise<T> {
  return request<T>("GET", path, { query, auth });
}

export function apiPost<T>(path: string, body?: unknown, auth = false): Promise<T> {
  return request<T>("POST", path, { body, auth });
}

export function apiPut<T>(path: string, body?: unknown, auth = false): Promise<T> {
  return request<T>("PUT", path, { body, auth });
}

export function apiDelete<T>(path: string, query?: Record<string, string | number | boolean | undefined>, auth = false): Promise<T> {
  return request<T>("DELETE", path, { query, auth });
}
