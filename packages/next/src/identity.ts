import "server-only";
import { cookies } from "next/headers";
import { createDeviceId } from "@fewchurs/react/core";
import { DEVICE_ID_COOKIE, DEVICE_ID_MAX_AGE } from "./constants";

export { DEVICE_ID_COOKIE, DEVICE_ID_MAX_AGE };

export type DeviceIdResolver = () => string | Promise<string>;

/** The visitor's id, or null when nothing has been stored for them yet. */
export async function readDeviceId(): Promise<string | null> {
  const store = await cookies();
  return store.get(DEVICE_ID_COOKIE)?.value ?? null;
}

/**
 * Reads the cookie, falling back to a fresh id. The value is not persisted here: a server
 * component cannot set cookies, so the route handler stores it on the first request instead.
 */
export async function resolveDeviceId(custom?: DeviceIdResolver): Promise<string> {
  if (custom) return custom();
  return (await readDeviceId()) ?? createDeviceId();
}

export function deviceIdCookie(deviceId: string): {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    sameSite: "lax";
    path: string;
    maxAge: number;
    secure: boolean;
  };
} {
  return {
    name: DEVICE_ID_COOKIE,
    value: deviceId,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: DEVICE_ID_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    },
  };
}

export { createDeviceId };
