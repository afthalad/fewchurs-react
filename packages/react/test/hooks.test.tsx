import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { FewchursProvider } from "../src/context/provider";
import { useComments } from "../src/hooks/useComments";
import { useFeatures } from "../src/hooks/useFeatures";
import { useSubmitFeature } from "../src/hooks/useSubmitFeature";
import { useVote } from "../src/hooks/useVote";
import { BASE_URL, rawFeature, requests, server } from "./server";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <FewchursProvider apiKey="fr_live_test" baseUrl={BASE_URL} deviceId="device-1">
      {children}
    </FewchursProvider>
  );
}

describe("useFeatures", () => {
  it("loads the first page and appends the next one", async () => {
    const { result } = renderHook(() => useFeatures({ sort: "new" }), { wrapper });

    await waitFor(() => expect(result.current.features).toHaveLength(2));
    expect(result.current.hasMore).toBe(true);

    await act(() => result.current.loadMore());

    expect(result.current.features.map((feature) => feature.id)).toEqual(["a", "b", "c"]);
    expect(result.current.hasMore).toBe(false);
  });

  it("asks once when two components want the same list", async () => {
    function Consumer() {
      const { features } = useFeatures({ sort: "new" });
      return <span>{features.length}</span>;
    }

    render(
      <FewchursProvider apiKey="fr_live_test" baseUrl={BASE_URL} deviceId="device-1">
        <Consumer />
        <Consumer />
      </FewchursProvider>,
    );

    await waitFor(() => expect(screen.getAllByText("2")).toHaveLength(2));
    expect(requests.filter((request) => request.url.includes("/features?"))).toHaveLength(1);
  });

  it("surfaces an error instead of throwing", async () => {
    server.use(
      http.get(`${BASE_URL}/features`, () =>
        HttpResponse.json({ error: { code: "invalid_key", message: "bad key" } }, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useFeatures(), { wrapper });
    await waitFor(() => expect(result.current.error?.code).toBe("invalid_key"));
  });
});

describe("useVote", () => {
  it("applies the vote immediately and keeps the server's count", async () => {
    const { result } = renderHook(
      () => ({ features: useFeatures({ sort: "new" }), vote: useVote("a") }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.features.features).toHaveLength(2));
    expect(result.current.vote.upvoteCount).toBe(3);

    await act(() => result.current.vote.toggle());

    expect(result.current.vote.hasVoted).toBe(true);
    expect(result.current.vote.upvoteCount).toBe(4);
  });

  it("rolls back when the vote fails", async () => {
    server.use(
      http.post(`${BASE_URL}/features/:id/vote`, () =>
        HttpResponse.json(
          { error: { code: "rate_limited", message: "slow down" } },
          { status: 429 },
        ),
      ),
    );

    const { result } = renderHook(
      () => ({ features: useFeatures({ sort: "new" }), vote: useVote("a") }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.features.features).toHaveLength(2));
    await act(() => result.current.vote.toggle());

    expect(result.current.vote.hasVoted).toBe(false);
    expect(result.current.vote.upvoteCount).toBe(3);
    expect(result.current.vote.error?.code).toBe("rate_limited");
  });
});

describe("useComments", () => {
  it("follows the cursor past pages emptied by deleted comments", async () => {
    let call = 0;
    server.use(
      http.get(`${BASE_URL}/features/:id/comments`, () => {
        call += 1;
        if (call < 3) return HttpResponse.json({ comments: [], nextCursor: `page${call}` });
        return HttpResponse.json({
          comments: [
            {
              id: "c9",
              text: "Still here",
              authorName: "Sam",
              deviceId: "other",
              isDeveloper: false,
              createdAt: "2026-01-04T00:00:00.000Z",
            },
          ],
          nextCursor: null,
        });
      }),
    );

    const { result } = renderHook(() => useComments("a"), { wrapper });

    await waitFor(() => expect(result.current.comments).toHaveLength(1));
    expect(call).toBe(3);
    expect(result.current.hasMore).toBe(false);
  });

  it("adds a posted comment to the thread", async () => {
    const { result } = renderHook(() => useComments("a"), { wrapper });
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    await act(async () => {
      await result.current.add("Me too");
    });

    expect(result.current.comments.map((comment) => comment.text)).toEqual([
      "Yes please",
      "Me too",
    ]);
  });
});

describe("useSubmitFeature", () => {
  it("puts a new request at the top of the new list", async () => {
    server.use(
      http.get(`${BASE_URL}/features`, () =>
        HttpResponse.json({ features: [rawFeature({ id: "a" })], nextCursor: null }),
      ),
    );

    const { result } = renderHook(
      () => ({ features: useFeatures({ sort: "new" }), submit: useSubmitFeature() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.features.features).toHaveLength(1));

    await act(async () => {
      await result.current.submit.submit({ title: "Offline mode" });
    });

    expect(result.current.features.features.map((feature) => feature.id)).toEqual(["new", "a"]);
  });

  it("reports validation errors without calling the API", async () => {
    const { result } = renderHook(() => useSubmitFeature(), { wrapper });

    await act(async () => {
      await result.current.submit({ title: "no" });
    });

    expect(result.current.error?.code).toBe("validation_failed");
    expect(requests.some((request) => request.method === "POST")).toBe(false);
  });
});
