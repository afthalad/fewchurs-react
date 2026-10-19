"use client";

import { useCallback, useState } from "react";
import { useFewchurs } from "../context/provider";
import { useStoreState } from "./useStoreState";
import type { FewchursError } from "../client/errors";

export interface UseVoteResult {
  hasVoted: boolean;
  upvoteCount: number;
  isPending: boolean;
  error: FewchursError | null;
  toggle: () => Promise<void>;
  vote: () => Promise<void>;
  unvote: () => Promise<void>;
}

export function useVote(featureId: string): UseVoteResult {
  const { store } = useFewchurs();
  const state = useStoreState();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<FewchursError | null>(null);

  const feature = Object.values(state.lists)
    .flatMap((list) => list.features)
    .find((candidate) => candidate.id === featureId);

  const toggle = useCallback(async () => {
    setIsPending(true);
    setError(null);
    const result = await store.toggleVote(featureId);
    if (!result.ok) setError(result.error);
    setIsPending(false);
  }, [store, featureId]);

  const vote = useCallback(async () => {
    if (feature?.hasVoted) return;
    await toggle();
  }, [feature?.hasVoted, toggle]);

  const unvote = useCallback(async () => {
    if (!feature?.hasVoted) return;
    await toggle();
  }, [feature?.hasVoted, toggle]);

  return {
    hasVoted: feature?.hasVoted ?? false,
    upvoteCount: feature?.upvoteCount ?? 0,
    isPending,
    error,
    toggle,
    vote,
    unvote,
  };
}
