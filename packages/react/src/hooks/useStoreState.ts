"use client";

import { useSyncExternalStore } from "react";
import { useFewchurs } from "../context/provider";
import type { StoreState } from "../store/store";

export function useStoreState(): StoreState {
  const { store } = useFewchurs();
  // The same snapshot on the server and the first client render: the store is seeded with
  // whatever was rendered server-side, so nothing re-renders into different markup.
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
