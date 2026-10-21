# Changelog

## 1.0.0 — 2026-10-19

- `@fewchurs/react`: fetch client, store, hooks (`useFeatures`, `useComments`, `useVote`,
  `useSubmitFeature`, `useFollow`, `useFewchursConfig`), board components and scoped styles.
- `@fewchurs/next`: server-rendered `<FewchursBoard>`, `createHandler()` route handler,
  server actions, and `httpOnly` cookie identity — with no API key in the client bundle.
- Five customization levels: defaults, CSS variables, props, slots, headless/unstyled.
- Typed errors, optimistic voting with rollback, cursor paging that survives deleted comments,
  and an `onEvent` callback for analytics.
- Defaults to the live API at `https://www.fewchurs.com/api/v1`.
- `@fewchurs/next/styles.css`: the board stylesheet is re-exported from the Next.js package,
  so an app that installed only `@fewchurs/next` can import it under pnpm and Yarn PnP.
- Placeholder rows shaped like the cards on first paint, so the board keeps its height.
- `initialFeatureId` on `<FewchursBoard>` and a `useFeature(featureId)` hook: open the board on
  one request with its comments expanded, rendered on the server by `@fewchurs/next`.
- `SDK_VERSION` and the `X-Fewchurs-Sdk` header are generated from each `package.json` at build
  time, with a CI check that fails if they drift.
- Released under the proprietary Fewchurs SDK License.
