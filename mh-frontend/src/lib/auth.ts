import { jwtDecode } from "jwt-decode";

interface JWTPayload {
  exp: number;
  sub: string;
}

export function isTokenValid(token: string): boolean {
  try {
    const { exp } = jwtDecode<JWTPayload>(token);
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
