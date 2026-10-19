const COOKIE_NAME = "fewchurs_did";
const STORAGE_KEY = "fewchurs_device_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function createDeviceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `fw-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function readDeviceId(): string | null {
  if (typeof document === "undefined") return null;
  return readCookie() ?? readStorage();
}

/**
 * Cookie first, storage second: a cookie is the only copy a same-origin server can read, so
 * the board renders with the same identity on both sides and never mismatches on hydration.
 */
export function resolveDeviceId(): string {
  const existing = readDeviceId();
  if (existing) {
    persist(existing);
    return existing;
  }
  const created = createDeviceId();
  persist(created);
  return created;
}

function persist(deviceId: string): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(deviceId)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    // Cookies can be blocked entirely; storage below is the fallback.
  }
  try {
    localStorage.setItem(STORAGE_KEY, deviceId);
  } catch {
    // Private-mode storage throws on write; the cookie or a fresh id per visit still works.
  }
}

function readCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export { COOKIE_NAME as DEVICE_ID_COOKIE };
