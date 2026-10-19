"use client";

import { useEffect } from "react";
import { useFewchurs } from "../context/provider";
import { useStoreState } from "./useStoreState";

export interface UseFewchursConfigResult {
  showBranding: boolean;
  hideVoteCounts: boolean;
  appName: string | null;
  isLoading: boolean;
}

export function useFewchursConfig(): UseFewchursConfigResult {
  const { store } = useFewchurs();
  const state = useStoreState();

  useEffect(() => {
    store.ensureConfig();
  }, [store]);

  return {
    showBranding: state.config?.showBranding ?? false,
    hideVoteCounts: state.config?.hideVoteCounts ?? false,
    appName: state.config?.appName ?? null,
    isLoading: state.config === null,
  };
}
