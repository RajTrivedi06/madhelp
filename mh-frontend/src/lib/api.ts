// src/lib/api.ts
// ---------------------------------------------
// One‑stop helpers for talking to the Flask API
// ---------------------------------------------

// If you set VITE_API_URL in .env, we’ll hit that.
// Otherwise default to localhost:5000 (Flask dev).
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

/** POST a FormData payload and return JSON (throws on error). */
export async function postForm(endpoint: string, data: FormData) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    body: data,
    credentials: "include", // swap to 'omit' if you never send cookies
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Unknown error");
  return json;
}

/** Example auth‑aware fetch (token from localStorage). */
export function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = localStorage.getItem("token");
  return fetch(`${API_URL}${input}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
}
