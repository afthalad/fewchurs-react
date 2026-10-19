"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useFewchurs } from "../context/provider";
import { listKey } from "../store/keys";
import { listStateOf } from "../store/store";
import { useStoreState } from "./useStoreState";
import type { FewchursError } from "../client/errors";
import type { Feature, FeatureSort, FeatureStatus } from "../types";

export interface UseFeaturesOptions {
  sort?: FeatureSort;
  status?: FeatureStatus[];
  pageSize?: number;
  enabled?: boolean;
}

export interface UseFeaturesResult {
  features: Feature[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: FewchursError | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useFeatures({
  sort = "new",
  status,
  pageSize,
  enabled = true,
}: UseFeaturesOptions = {}): UseFeaturesResult {
  const { store, isReady } = useFewchurs();
  const state = useStoreState();

  const statusKey = status?.length ? [...status].sort().join(",") : "";
  const query = useMemo(
    () => ({ sort, status: statusKey ? (statusKey.split(",") as FeatureStatus[]) : undefined }),
    [sort, statusKey],
  );
  const key = listKey(query);
  const list = listStateOf(state, key);

  useEffect(() => {
    if (!enabled || !isReady) return;
    store.ensureFeatures(query, pageSize);
  }, [store, query, pageSize, enabled, isReady]);

  const loadMore = useCallback(() => store.loadMore(query, pageSize), [store, query, pageSize]);
  const refresh = useCallback(() => store.refresh(query, pageSize), [store, query, pageSize]);

  return {
    features: list.features,
    isLoading: list.status === "loading" || (list.status === "idle" && enabled),
    isLoadingMore: list.status === "loadingMore",
    error: list.error,
    hasMore: list.cursor !== null,
    loadMore,
    refresh,
  };
}
