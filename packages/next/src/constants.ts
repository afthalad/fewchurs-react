import { SDK_VERSION } from "./version";

export const DEVICE_ID_COOKIE = "fewchurs_did";
export const DEVICE_ID_MAX_AGE = 60 * 60 * 24 * 365;
export { SDK_VERSION };
export const SDK_HEADER = `next/${SDK_VERSION}`;
