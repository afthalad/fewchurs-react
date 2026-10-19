import type {
  Comment,
  CommentPage,
  Feature,
  FeaturePage,
  FeatureStatus,
  FewchursConfig,
} from "../types";

const KNOWN_STATUSES = new Set<string>(["open", "planned", "in_progress", "done", "declined"]);

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function bool(value: unknown): boolean {
  return value === true;
}

export function normalizeStatus(value: unknown): FeatureStatus {
  return typeof value === "string" && KNOWN_STATUSES.has(value)
    ? (value as FeatureStatus)
    : "unknown";
}

// `isMine` is the server's answer once it ships; until then the raw author device id is the
// only signal, so it is compared here and never surfaced on the public type.
function isMine(raw: Record<string, unknown>, ownerKey: string, deviceId: string | null): boolean {
  if (typeof raw.isMine === "boolean") return raw.isMine;
  const owner = raw[ownerKey];
  return typeof owner === "string" && owner.length > 0 && owner === deviceId;
}

export function normalizeFeature(value: unknown, deviceId: string | null): Feature {
  const raw = asRecord(value);
  return {
    id: str(raw.id),
    title: str(raw.title),
    description: str(raw.description),
    status: normalizeStatus(raw.status),
    upvoteCount: num(raw.upvoteCount),
    commentCount: num(raw.commentCount),
    followerCount: num(raw.followerCount),
    hasVoted: bool(raw.hasVoted),
    isFollowing: bool(raw.isFollowing),
    isMine: isMine(raw, "authorDeviceId", deviceId),
    createdAt: str(raw.createdAt),
    updatedAt: str(raw.updatedAt, str(raw.createdAt)),
  };
}

export function normalizeComment(value: unknown, deviceId: string | null): Comment {
  const raw = asRecord(value);
  return {
    id: str(raw.id),
    text: str(raw.text),
    authorName: str(raw.authorName, "App User"),
    isDeveloper: bool(raw.isDeveloper),
    isMine: isMine(raw, "deviceId", deviceId),
    createdAt: str(raw.createdAt),
  };
}

export function normalizeFeaturePage(value: unknown, deviceId: string | null): FeaturePage {
  const raw = asRecord(value);
  const features = Array.isArray(raw.features) ? raw.features : [];
  return {
    features: features.map((feature) => normalizeFeature(feature, deviceId)),
    nextCursor: typeof raw.nextCursor === "string" ? raw.nextCursor : null,
  };
}

export function normalizeCommentPage(value: unknown, deviceId: string | null): CommentPage {
  const raw = asRecord(value);
  const comments = Array.isArray(raw.comments) ? raw.comments : [];
  return {
    comments: comments.map((comment) => normalizeComment(comment, deviceId)),
    nextCursor: typeof raw.nextCursor === "string" ? raw.nextCursor : null,
  };
}

export function normalizeConfig(value: unknown): FewchursConfig {
  const raw = asRecord(value);
  return {
    showBranding: raw.showBranding !== false,
    hideVoteCounts: bool(raw.hideVoteCounts),
    appName: typeof raw.appName === "string" && raw.appName ? raw.appName : null,
  };
}

export function normalizeVote(value: unknown): { upvoteCount: number; hasVoted: boolean } {
  const raw = asRecord(value);
  return { upvoteCount: num(raw.upvoteCount), hasVoted: bool(raw.hasVoted) };
}
