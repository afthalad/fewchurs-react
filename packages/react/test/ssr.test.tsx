import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { FewchursBoard } from "../src/components/Board";
import { FewchursProvider } from "../src/context/provider";
import type { StoreState } from "../src/store/store";
import { BASE_URL } from "./server";

const seeded: Partial<StoreState> = {
  config: { showBranding: true, hideVoteCounts: false, appName: "Test App" },
  lists: {
    new: {
      features: [
        {
          id: "a",
          title: "Dark mode",
          description: "Please",
          status: "planned",
          upvoteCount: 3,
          commentCount: 0,
          followerCount: 0,
          hasVoted: false,
          isFollowing: false,
          isMine: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      cursor: null,
      status: "ready",
      error: null,
    },
  },
};

function tree() {
  return (
    <FewchursProvider baseUrl={BASE_URL} deviceId="device-1" initialState={seeded}>
      <FewchursBoard defaultTab="new" />
    </FewchursProvider>
  );
}

describe("server rendering", () => {
  it("renders seeded data without fetching", () => {
    const html = renderToString(tree());

    expect(html).toContain("Dark mode");
    expect(html).toContain("Planned");
    expect(html).not.toContain("fr_live");
  });

  it("hydrates the server markup without a mismatch", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(tree());
    document.body.appendChild(container);

    const errors: unknown[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args) => errors.push(args[0]));

    await act(async () => {
      hydrateRoot(container, tree());
    });

    spy.mockRestore();
    expect(errors).toEqual([]);
    expect(container.textContent).toContain("Dark mode");
  });
});
