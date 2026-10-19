"use client";

import { useCallback, useState } from "react";
import { useFewchurs } from "../context/provider";
import type { FewchursError } from "../client/errors";
import type { Feature, SubmitFeatureInput } from "../types";

export interface UseSubmitFeatureResult {
  submit: (input: SubmitFeatureInput) => Promise<Feature | null>;
  isPending: boolean;
  error: FewchursError | null;
  reset: () => void;
}

export function useSubmitFeature(): UseSubmitFeatureResult {
  const { store } = useFewchurs();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<FewchursError | null>(null);

  const submit = useCallback(
    async (input: SubmitFeatureInput) => {
      setIsPending(true);
      setError(null);
      const result = await store.submitFeature(input);
      setIsPending(false);
      if (!result.ok) {
        setError(result.error);
        return null;
      }
      return result.data;
    },
    [store],
  );

  const reset = useCallback(() => setError(null), []);

  return { submit, isPending, error, reset };
}
