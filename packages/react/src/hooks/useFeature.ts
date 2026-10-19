"use client";

import { useCallback, useEffect } from "react";
import { useFewchurs } from "../context/provider";
import { featureKey } from "../store/keys";
import { listStateOf } from "../store/store";
import { useStoreState } from "./useStoreState";
import type { FewchursError } from "../client/errors";
import type { Feature } from "../types";

export interface UseFeatureOptions {
  enabled?: boolean;
}

export interface UseFeatureResult {
  feature: Feature | null;
  isLoading: boolean;
  error: FewchursError | null;
  refresh: () => Promise<void>;
}

/**
 * One request by id, for a deep link into a board. The feature lands in the same store the
 * lists use, so voting, commenting and following it behave exactly as they do in a list.
 */
export function useFeature(
  featureId: string | undefined,
  { enabled = true }: UseFeatureOptions = {},
): UseFeatureResult {
  const { store, isReady } = useFewchurs();
  const state = useStoreState();

  const active = Boolean(featureId) && enabled;
  const list = listStateOf(state, featureKey(featureId ?? ""));

  useEffect(() => {
    if (!active || !isReady || !featureId) return;
    store.ensureFeature(featureId);
  }, [store, featureId, active, isReady]);

  const refresh = useCallback(
    () => (featureId ? store.refreshFeature(featureId) : Promise.resolve()),
    [store, featureId],
  );

  return {
    feature: list.features[0] ?? null,
    isLoading: active && (list.status === "loading" || list.status === "idle"),
    error: list.error,
    refresh,
  };
}
