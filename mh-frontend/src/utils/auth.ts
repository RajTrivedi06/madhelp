// helpers to decode and validate JWT
export function isTokenValid(token?: string): boolean {
  if (!token) return false;
  try {
    const [, payloadB64] = token.split(".");
    const { exp } = JSON.parse(atob(payloadB64));
    return typeof exp === "number" && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
