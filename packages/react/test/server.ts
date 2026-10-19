import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const BASE_URL = "https://api.test/v1";

export interface RawFeature {
  id: string;
  title: string;
  description?: string;
  status?: string;
  upvoteCount?: number;
  commentCount?: number;
  followerCount?: number;
  hasVoted?: boolean;
  isFollowing?: boolean;
  authorDeviceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function rawFeature(overrides: Partial<RawFeature> & { id: string }): RawFeature {
  return {
    title: `Feature ${overrides.id}`,
    description: "",
    status: "open",
    upvoteCount: 0,
    commentCount: 0,
    followerCount: 0,
    hasVoted: false,
    isFollowing: false,
    authorDeviceId: "someone-else",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export const requests: Request[] = [];

export const defaultHandlers = [
  http.get(`${BASE_URL}/config`, ({ request }) => {
    requests.push(request.clone());
    return HttpResponse.json({ showBranding: true, hideVoteCounts: false, appName: "Test App" });
  }),

  http.get(`${BASE_URL}/features`, ({ request }) => {
    requests.push(request.clone());
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    if (cursor === "page2") {
      return HttpResponse.json({ features: [rawFeature({ id: "c" })], nextCursor: null });
    }
    return HttpResponse.json({
      features: [
        rawFeature({ id: "a", title: "Dark mode", upvoteCount: 3 }),
        rawFeature({ id: "b", title: "Export to CSV", status: "planned" }),
      ],
      nextCursor: "page2",
    });
  }),

  http.post(`${BASE_URL}/features`, async ({ request }) => {
    requests.push(request.clone());
    const body = (await request.json()) as { title: string; description?: string };
    return HttpResponse.json(rawFeature({ id: "new", title: body.title }), { status: 201 });
  }),

  http.get(`${BASE_URL}/features/:id`, ({ request, params }) => {
    requests.push(request.clone());
    const id = String(params.id);
    if (id === "missing") {
      return HttpResponse.json(
        { error: { code: "not_found", message: "No such feature." } },
        { status: 404 },
      );
    }
    return HttpResponse.json(
      rawFeature({ id, title: id === "b" ? "Export to CSV" : `Feature ${id}`, commentCount: 1 }),
    );
  }),

  http.post(`${BASE_URL}/features/:id/vote`, ({ request }) => {
    requests.push(request.clone());
    return HttpResponse.json({ upvoteCount: 4, hasVoted: true });
  }),

  http.delete(`${BASE_URL}/features/:id/vote`, ({ request }) => {
    requests.push(request.clone());
    return HttpResponse.json({ upvoteCount: 3, hasVoted: false });
  }),

  http.post(`${BASE_URL}/features/:id/follow`, ({ request }) => {
    requests.push(request.clone());
    return HttpResponse.json({ following: true });
  }),

  http.delete(`${BASE_URL}/features/:id/follow`, ({ request }) => {
    requests.push(request.clone());
    return HttpResponse.json({ following: false });
  }),

  http.get(`${BASE_URL}/features/:id/comments`, ({ request }) => {
    requests.push(request.clone());
    return HttpResponse.json({
      comments: [
        {
          id: "c1",
          text: "Yes please",
          authorName: "Sam",
          deviceId: "device-1",
          isDeveloper: false,
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
      nextCursor: null,
    });
  }),

  http.post(`${BASE_URL}/comments`, async ({ request }) => {
    requests.push(request.clone());
    const body = (await request.json()) as { text: string; featureId: string };
    return HttpResponse.json(
      {
        id: "c2",
        text: body.text,
        authorName: "App User",
        deviceId: "device-1",
        isDeveloper: false,
        createdAt: "2026-01-03T00:00:00.000Z",
      },
      { status: 201 },
    );
  }),
];

export const server = setupServer(...defaultHandlers);

export function lastRequest(): Request {
  const request = requests[requests.length - 1];
  if (!request) throw new Error("No request was made.");
  return request;
}
