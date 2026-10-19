import type { FewchursClient } from "../client/client";
import type { FewchursError, Result } from "../client/errors";
import type {
  Comment,
  CreateCommentInput,
  Feature,
  FewchursConfig,
  SubmitFeatureInput,
} from "../types";
import { featureKey, listKey, type ListQuery } from "./keys";

export type LoadStatus = "idle" | "loading" | "loadingMore" | "ready" | "error";

export interface ListState {
  features: Feature[];
  cursor: string | null;
  status: LoadStatus;
  error: FewchursError | null;
}

export interface CommentsState {
  comments: Comment[];
  cursor: string | null;
  status: LoadStatus;
  error: FewchursError | null;
}

export interface StoreState {
  config: FewchursConfig | null;
  lists: Record<string, ListState>;
  comments: Record<string, CommentsState>;
}

export type FewchursEventName =
  "boardOpened" | "featureSubmitted" | "voted" | "commented" | "followed" | "error";

export interface FewchursEvent {
  name: FewchursEventName;
  featureId?: string;
  hasVoted?: boolean;
  following?: boolean;
  error?: FewchursError;
}

export type EventHandler = (event: FewchursEvent) => void;

export interface StoreOptions {
  pageSize?: number;
  initialState?: Partial<StoreState>;
  onEvent?: EventHandler;
}

export interface Store {
  subscribe(listener: () => void): () => void;
  getState(): StoreState;
  ensureConfig(): void;
  ensureFeatures(query: ListQuery, pageSize?: number): void;
  ensureFeature(featureId: string): void;
  refreshFeature(featureId: string): Promise<void>;
  refresh(query: ListQuery, pageSize?: number): Promise<void>;
  loadMore(query: ListQuery, pageSize?: number): Promise<void>;
  ensureComments(featureId: string): void;
  refreshComments(featureId: string): Promise<void>;
  loadMoreComments(featureId: string): Promise<void>;
  toggleVote(featureId: string): Promise<Result<{ upvoteCount: number; hasVoted: boolean }>>;
  submitFeature(input: SubmitFeatureInput): Promise<Result<Feature>>;
  addComment(input: CreateCommentInput): Promise<Result<Comment>>;
  setFollowing(featureId: string, email: string | null): Promise<Result<{ following: boolean }>>;
  emit(event: FewchursEvent): void;
}

const EMPTY_LIST: ListState = { features: [], cursor: null, status: "idle", error: null };
const EMPTY_COMMENTS: CommentsState = { comments: [], cursor: null, status: "idle", error: null };

// The server filters deleted comments after paging, so a page can come back empty while a
// cursor remains. Follow the cursor a few times before showing "no comments yet".
const MAX_EMPTY_PAGES = 5;

export function createStore(
  client: FewchursClient,
  { pageSize = 20, initialState, onEvent }: StoreOptions = {},
): Store {
  let state: StoreState = {
    config: initialState?.config ?? null,
    lists: initialState?.lists ?? {},
    comments: initialState?.comments ?? {},
  };

  const listeners = new Set<() => void>();
  const inFlight = new Map<string, Promise<void>>();

  function setState(next: Partial<StoreState>): void {
    state = { ...state, ...next };
    for (const listener of listeners) listener();
  }

  function setList(key: string, patch: Partial<ListState>): void {
    const current = state.lists[key] ?? EMPTY_LIST;
    setState({ lists: { ...state.lists, [key]: { ...current, ...patch } } });
  }

  function setComments(featureId: string, patch: Partial<CommentsState>): void {
    const current = state.comments[featureId] ?? EMPTY_COMMENTS;
    setState({ comments: { ...state.comments, [featureId]: { ...current, ...patch } } });
  }

  function emit(event: FewchursEvent): void {
    onEvent?.(event);
  }

  function fail(error: FewchursError): void {
    emit({ name: "error", error });
  }

  /** One request per key at a time: a remounting board must not double-fetch page one. */
  function dedupe(key: string, run: () => Promise<void>): Promise<void> {
    const existing = inFlight.get(key);
    if (existing) return existing;
    const promise = run().finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  }

  function mapFeature(featureId: string, update: (feature: Feature) => Feature): void {
    const lists: Record<string, ListState> = {};
    let changed = false;
    for (const [key, list] of Object.entries(state.lists)) {
      const index = list.features.findIndex((feature) => feature.id === featureId);
      if (index === -1) {
        lists[key] = list;
        continue;
      }
      changed = true;
      const features = [...list.features];
      features[index] = update(features[index] as Feature);
      lists[key] = { ...list, features };
    }
    if (changed) setState({ lists });
  }

  async function fetchFeatures(query: ListQuery, append: boolean, size: number): Promise<void> {
    const key = listKey(query);
    const current = state.lists[key] ?? EMPTY_LIST;
    if (append && !current.cursor) return;

    setList(key, { status: append ? "loadingMore" : "loading", error: null });

    const result = await client.listFeatures({
      sort: query.sort,
      status: query.status,
      limit: size,
      cursor: append ? current.cursor : null,
    });

    if (!result.ok) {
      setList(key, { status: "error", error: result.error });
      fail(result.error);
      return;
    }

    const previous = append ? (state.lists[key]?.features ?? []) : [];
    setList(key, {
      features: dedupeById([...previous, ...result.data.features]),
      cursor: result.data.nextCursor,
      status: "ready",
      error: null,
    });
  }

  async function fetchFeature(featureId: string): Promise<void> {
    const key = featureKey(featureId);
    setList(key, { status: "loading", error: null });

    const result = await client.getFeature(featureId);
    if (!result.ok) {
      setList(key, { status: "error", error: result.error });
      fail(result.error);
      return;
    }

    setList(key, { features: [result.data], cursor: null, status: "ready", error: null });
  }

  async function fetchComments(featureId: string, append: boolean): Promise<void> {
    const current = state.comments[featureId] ?? EMPTY_COMMENTS;
    if (append && !current.cursor) return;

    setComments(featureId, { status: append ? "loadingMore" : "loading", error: null });

    let cursor = append ? current.cursor : null;
    const collected: Comment[] = [];

    for (let page = 0; page < MAX_EMPTY_PAGES; page += 1) {
      const result = await client.listComments(featureId, { limit: pageSize, cursor });
      if (!result.ok) {
        setComments(featureId, { status: "error", error: result.error });
        fail(result.error);
        return;
      }
      collected.push(...result.data.comments);
      cursor = result.data.nextCursor;
      if (collected.length > 0 || !cursor) break;
    }

    const previous = append ? (state.comments[featureId]?.comments ?? []) : [];
    setComments(featureId, {
      comments: dedupeById([...previous, ...collected]),
      cursor,
      status: "ready",
      error: null,
    });
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getState: () => state,

    emit,

    ensureConfig() {
      if (state.config) return;
      void dedupe("config", async () => {
        const result = await client.getConfig();
        if (result.ok) setState({ config: result.data });
      });
    },

    ensureFeatures(query, size = pageSize) {
      const key = listKey(query);
      if ((state.lists[key] ?? EMPTY_LIST).status !== "idle") return;
      void dedupe(`features:${key}`, () => fetchFeatures(query, false, size));
    },

    refresh(query, size = pageSize) {
      return dedupe(`features:${listKey(query)}`, () => fetchFeatures(query, false, size));
    },

    loadMore(query, size = pageSize) {
      return dedupe(`features:more:${listKey(query)}`, () => fetchFeatures(query, true, size));
    },

    ensureFeature(featureId) {
      if ((state.lists[featureKey(featureId)] ?? EMPTY_LIST).status !== "idle") return;
      void dedupe(`feature:${featureId}`, () => fetchFeature(featureId));
    },

    refreshFeature(featureId) {
      return dedupe(`feature:${featureId}`, () => fetchFeature(featureId));
    },

    ensureComments(featureId) {
      if ((state.comments[featureId] ?? EMPTY_COMMENTS).status !== "idle") return;
      void dedupe(`comments:${featureId}`, () => fetchComments(featureId, false));
    },

    refreshComments(featureId) {
      return dedupe(`comments:${featureId}`, () => fetchComments(featureId, false));
    },

    loadMoreComments(featureId) {
      return dedupe(`comments:more:${featureId}`, () => fetchComments(featureId, true));
    },

    async toggleVote(featureId) {
      const before = findFeature(state, featureId);
      if (!before)
        return {
          ok: false,
          error: { code: "not_found", status: 404, message: "Unknown feature." },
        };

      const nextVoted = !before.hasVoted;
      mapFeature(featureId, (feature) => ({
        ...feature,
        hasVoted: nextVoted,
        upvoteCount: Math.max(0, feature.upvoteCount + (nextVoted ? 1 : -1)),
      }));

      const result = nextVoted ? await client.vote(featureId) : await client.unvote(featureId);

      if (!result.ok) {
        mapFeature(featureId, (feature) => ({
          ...feature,
          hasVoted: before.hasVoted,
          upvoteCount: before.upvoteCount,
        }));
        fail(result.error);
        return result;
      }

      mapFeature(featureId, (feature) => ({
        ...feature,
        hasVoted: result.data.hasVoted,
        upvoteCount: result.data.upvoteCount,
      }));
      emit({ name: "voted", featureId, hasVoted: result.data.hasVoted });
      return result;
    },

    async submitFeature(input) {
      const result = await client.submitFeature(input);
      if (!result.ok) {
        fail(result.error);
        return result;
      }

      const lists: Record<string, ListState> = {};
      for (const [key, list] of Object.entries(state.lists)) {
        // A brand-new request has no votes, so it only belongs at the top of the "new" list.
        lists[key] = key.startsWith("new")
          ? { ...list, features: dedupeById([result.data, ...list.features]) }
          : list;
      }
      setState({ lists });
      emit({ name: "featureSubmitted", featureId: result.data.id });
      return result;
    },

    async addComment(input) {
      const result = await client.createComment(input);
      if (!result.ok) {
        fail(result.error);
        return result;
      }

      const current = state.comments[input.featureId] ?? EMPTY_COMMENTS;
      setComments(input.featureId, { comments: [...current.comments, result.data] });
      mapFeature(input.featureId, (feature) => ({
        ...feature,
        commentCount: feature.commentCount + 1,
      }));
      emit({ name: "commented", featureId: input.featureId });
      return result;
    },

    async setFollowing(featureId, email) {
      const result = email
        ? await client.follow(featureId, email)
        : await client.unfollow(featureId);

      if (!result.ok) {
        fail(result.error);
        return result;
      }

      mapFeature(featureId, (feature) => ({
        ...feature,
        isFollowing: result.data.following,
        followerCount: Math.max(0, feature.followerCount + (result.data.following ? 1 : -1)),
      }));
      emit({ name: "followed", featureId, following: result.data.following });
      return result;
    },
  };
}

export function listStateOf(state: StoreState, key: string): ListState {
  return state.lists[key] ?? EMPTY_LIST;
}

export function commentsStateOf(state: StoreState, featureId: string): CommentsState {
  return state.comments[featureId] ?? EMPTY_COMMENTS;
}

function findFeature(state: StoreState, featureId: string): Feature | null {
  for (const list of Object.values(state.lists)) {
    const found = list.features.find((feature) => feature.id === featureId);
    if (found) return found;
  }
  return null;
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}
