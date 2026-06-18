/**
 * Bearer token storage for Sanctum personal-access tokens returned by
 * /auth/login and /auth/register. Persisted in localStorage so the session
 * survives reloads. Kept deliberately tiny and framework-agnostic so it can be
 * imported from the HTTP layer without pulling in React.
 */

const TOKEN_KEY = "neomap.auth.token";

let cached: string | null | undefined;

export function getToken(): string | null {
  if (cached !== undefined) return cached;
  if (typeof window === "undefined") return null;
  cached = window.localStorage.getItem(TOKEN_KEY);
  return cached;
}

export function setToken(token: string): void {
  cached = token;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken(): void {
  cached = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

/** Subscribers notified whenever the token is cleared (e.g. on a 401). */
type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

export function onUnauthorized(listener: Listener): () => void {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export function notifyUnauthorized(): void {
  clearToken();
  for (const listener of unauthorizedListeners) listener();
}
