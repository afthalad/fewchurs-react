"use client";

import { useCallback, useState } from "react";
import { useFewchurs } from "../context/provider";
import { useStoreState } from "./useStoreState";
import type { FewchursError } from "../client/errors";

export interface UseFollowResult {
  isFollowing: boolean;
  isPending: boolean;
  error: FewchursError | null;
  follow: (email: string) => Promise<boolean>;
  unfollow: () => Promise<boolean>;
}

export function useFollow(featureId: string): UseFollowResult {
  const { store } = useFewchurs();
  const state = useStoreState();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<FewchursError | null>(null);

  const feature = Object.values(state.lists)
    .flatMap((list) => list.features)
    .find((candidate) => candidate.id === featureId);

  const run = useCallback(
    async (email: string | null) => {
      setIsPending(true);
      setError(null);
      const result = await store.setFollowing(featureId, email);
      if (!result.ok) setError(result.error);
      setIsPending(false);
      return result.ok;
    },
    [store, featureId],
  );

  return {
    isFollowing: feature?.isFollowing ?? false,
    isPending,
    error,
    follow: useCallback((email: string) => run(email), [run]),
    unfollow: useCallback(() => run(null), [run]),
  };
}
