/* src/lib/api.ts */
// A unified helper for authenticated and unauthenticated API calls
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  // 1) Retrieve the exact same key LandingPage sets
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token — please log in");
  }

  // 2) Build headers including the required Bearer prefix
  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  // 3) Perform the fetch against your Flask backend
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  // 4) Handle errors in a consistent way
  if (!res.ok) {
    let err: any;
    try {
      err = await res.json();
    } catch {
      err = { error: res.statusText };
    }
    throw new Error(err.msg || err.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// Public form-based POST (e.g. signup / login)
export async function postForm<T = any>(
  path: string,
  data: FormData
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    body: data,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorBody.error || `HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}

// Authenticated GET helper
export async function authGet<T = unknown>(path: string) {
  return authFetch<T>(path, { method: "GET" });
}
