// A local stand-in for https://www.fewchurs.com/api/v1, so the examples run without a real key.
// State lives in memory and resets on restart.
//
//   node tools/mock-server.mjs            # http://localhost:4010/v1
//   PORT=5000 node tools/mock-server.mjs

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT ?? 4010);
const now = () => new Date().toISOString();

const features = [
  seed("Dark mode", "Easier on the eyes at night.", "planned", 42),
  seed("Export to CSV", "So I can share reports with my team.", "in_progress", 27),
  seed("Offline support", "Keep working on the train.", "open", 19),
  seed("Keyboard shortcuts", "", "done", 11),
  seed("Calendar sync", "Two-way sync with Google Calendar.", "open", 8),
  seed("Custom themes", "Let us pick an accent colour.", "declined", 3),
];
const votes = new Map(); // featureId -> Set<deviceId>
const followers = new Map(); // featureId -> Set<deviceId>
const comments = new Map(); // featureId -> Comment[]

comments.set(features[0].id, [
  comment("Yes please, my eyes will thank you.", "Sam"),
  comment("On the roadmap for next month.", "Team", true),
]);
features[0].commentCount = 2;

function seed(title, description, status, upvoteCount) {
  const createdAt = new Date(Date.now() - upvoteCount * 3_600_000).toISOString();
  return {
    id: randomUUID().slice(0, 8),
    title,
    description,
    status,
    upvoteCount,
    commentCount: 0,
    followerCount: 0,
    authorDeviceId: "seed",
    createdAt,
    updatedAt: createdAt,
  };
}

function comment(text, authorName, isDeveloper = false, deviceId = "seed") {
  return { id: randomUUID().slice(0, 8), text, authorName, deviceId, isDeveloper, createdAt: now() };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, X-Device-Id, X-Fewchurs-Sdk, Accept-Language",
};

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json", ...CORS });
  res.end(JSON.stringify(body));
}

function fail(res, status, code, message) {
  send(res, status, { error: { code, message } });
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw || "null");
  } catch {
    return null;
  }
}

function withViewer(feature, deviceId) {
  return {
    ...feature,
    hasVoted: votes.get(feature.id)?.has(deviceId) ?? false,
    isFollowing: followers.get(feature.id)?.has(deviceId) ?? false,
    isMine: feature.authorDeviceId === deviceId,
  };
}

function page(items, limit, cursor) {
  const start = cursor ? items.findIndex((item) => item.id === cursor) + 1 : 0;
  const slice = items.slice(start, start + limit);
  const nextCursor = start + limit < items.length ? (slice.at(-1)?.id ?? null) : null;
  return { slice, nextCursor };
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    return res.end();
  }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname.replace(/^\/v1/, "");
  const deviceId = req.headers["x-device-id"];
  console.log(`${req.method} ${url.pathname}${url.search}  device=${deviceId ?? "-"}`);

  if (!String(req.headers.authorization ?? "").startsWith("Bearer ")) {
    return fail(res, 401, "invalid_key", "Invalid or inactive API key.");
  }

  if (req.method === "GET" && path === "/config") {
    return send(res, 200, { showBranding: true, hideVoteCounts: false, appName: "Mock App" });
  }

  if (!deviceId) return fail(res, 400, "missing_device_id", "X-Device-Id header is required.");

  if (req.method === "GET" && path === "/features") {
    const sort = url.searchParams.get("sort") === "top" ? "top" : "new";
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 100);
    const statuses = url.searchParams.get("status")?.split(",").filter(Boolean);
    const sorted = features
      .filter((feature) => !statuses?.length || statuses.includes(feature.status))
      .sort((a, b) =>
        sort === "top" ? b.upvoteCount - a.upvoteCount : b.createdAt.localeCompare(a.createdAt),
      );
    const { slice, nextCursor } = page(sorted, limit, url.searchParams.get("cursor"));
    return send(res, 200, {
      features: slice.map((feature) => withViewer(feature, deviceId)),
      nextCursor,
    });
  }

  if (req.method === "POST" && path === "/features") {
    const body = await readBody(req);
    const title = String(body?.title ?? "").trim();
    if (title.length < 3 || title.length > 100) {
      return fail(res, 400, "validation_failed", "Title must be 3–100 characters.");
    }
    const feature = {
      ...seed(title, String(body?.description ?? "").trim(), "open", 0),
      authorDeviceId: deviceId,
      createdAt: now(),
      updatedAt: now(),
    };
    features.push(feature);
    return send(res, 201, withViewer(feature, deviceId));
  }

  if (req.method === "POST" && path === "/comments") {
    const body = await readBody(req);
    const feature = features.find((candidate) => candidate.id === body?.featureId);
    if (!feature) return fail(res, 404, "not_found", "Feature not found.");
    const text = String(body?.text ?? "").trim();
    if (!text) return fail(res, 400, "validation_failed", "Write a comment first.");
    const created = comment(text, String(body?.authorName ?? "").trim() || "App User", false, deviceId);
    comments.set(feature.id, [...(comments.get(feature.id) ?? []), created]);
    feature.commentCount += 1;
    return send(res, 201, { ...created, isMine: true });
  }

  const match = path.match(/^\/features\/([^/]+)(?:\/(vote|follow|comments))?$/);
  const feature = match && features.find((candidate) => candidate.id === match[1]);
  if (match && !feature) return fail(res, 404, "not_found", "Feature not found.");

  if (feature && !match[2] && req.method === "GET") {
    return send(res, 200, withViewer(feature, deviceId));
  }

  if (feature && match[2] === "vote" && (req.method === "POST" || req.method === "DELETE")) {
    const set = votes.get(feature.id) ?? new Set();
    votes.set(feature.id, set);
    if (req.method === "POST" && !set.has(deviceId)) {
      set.add(deviceId);
      feature.upvoteCount += 1;
    }
    if (req.method === "DELETE" && set.has(deviceId)) {
      set.delete(deviceId);
      feature.upvoteCount -= 1;
    }
    return send(res, 200, { upvoteCount: feature.upvoteCount, hasVoted: set.has(deviceId) });
  }

  if (feature && match[2] === "follow" && (req.method === "POST" || req.method === "DELETE")) {
    const set = followers.get(feature.id) ?? new Set();
    followers.set(feature.id, set);
    if (req.method === "POST") {
      const body = await readBody(req);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body?.email ?? ""))) {
        return fail(res, 400, "validation_failed", "Enter a valid email address.");
      }
      if (!set.has(deviceId)) feature.followerCount += 1;
      set.add(deviceId);
      return send(res, 200, { following: true });
    }
    if (set.delete(deviceId)) feature.followerCount -= 1;
    return send(res, 200, { following: false });
  }

  if (feature && match[2] === "comments" && req.method === "GET") {
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 100);
    const { slice, nextCursor } = page(
      comments.get(feature.id) ?? [],
      limit,
      url.searchParams.get("cursor"),
    );
    return send(res, 200, {
      comments: slice.map((item) => ({ ...item, isMine: item.deviceId === deviceId })),
      nextCursor,
    });
  }

  return fail(res, 405, "not_found", "Unknown route.");
});

server.listen(PORT, () => {
  console.log(`Fewchurs mock API on http://localhost:${PORT}/v1`);
});
