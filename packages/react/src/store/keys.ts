import type { FeatureStatus, FeatureSort } from "../types";

export interface ListQuery {
  sort: FeatureSort;
  status?: FeatureStatus[];
}

export function listKey({ sort, status }: ListQuery): string {
  return status?.length ? `${sort}:${[...status].sort().join(",")}` : sort;
}

/**
 * One feature, fetched by id, kept in `lists` beside the real lists. That way a deep-linked
 * request goes through the same vote, comment and follow updates as a row in a list.
 */
export function featureKey(featureId: string): string {
  return `feature:${featureId}`;
}
