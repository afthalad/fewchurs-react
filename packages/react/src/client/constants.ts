import type { FeatureStatus } from "../types";
import { SDK_VERSION } from "./version";

export { SDK_VERSION };
export const SDK_HEADER = `react/${SDK_VERSION}`;
export const DEFAULT_BASE_URL = "https://www.fewchurs.shop/api/v1";
export const DEFAULT_PAGE_SIZE = 20;

/** Mirrors the server's zod schemas, so the UI can reject input before a round trip. */
export const LIMITS = {
  titleMin: 3,
  titleMax: 100,
  descriptionMax: 1000,
  commentMin: 1,
  commentMax: 1000,
  authorNameMax: 60,
} as const;

/** Deliberately loose: the server owns the real check, this only catches obvious typos. */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What the Roadmap tab asks for, and what it keeps if the server ignores the filter. */
export const ROADMAP_STATUSES: FeatureStatus[] = ["planned", "in_progress", "done"];
