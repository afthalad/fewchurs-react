import "@testing-library/jest-dom/vitest";
import { toHaveNoViolations } from "jest-axe";
import { afterAll, afterEach, beforeAll, expect } from "vitest";
import { requests, server } from "./server";

expect.extend(toHaveNoViolations);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  requests.length = 0;
  document.cookie = "fewchurs_did=; path=/; max-age=0";
  localStorage.clear();
});

afterAll(() => server.close());
