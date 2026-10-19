/** A status the server does not know about yet still renders, as `"unknown"`. */
export type FeatureStatus = "open" | "planned" | "in_progress" | "done" | "declined" | "unknown";

export type FeatureSort = "top" | "new";

export interface Feature {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  upvoteCount: number;
  commentCount: number;
  followerCount: number;
  hasVoted: boolean;
  isFollowing: boolean;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  text: string;
  authorName: string;
  isDeveloper: boolean;
  isMine: boolean;
  createdAt: string;
}

export interface FeaturePage {
  features: Feature[];
  nextCursor: string | null;
}

export interface CommentPage {
  comments: Comment[];
  nextCursor: string | null;
}

export interface FewchursConfig {
  showBranding: boolean;
  hideVoteCounts: boolean;
  appName: string | null;
}

export interface SubmitFeatureInput {
  title: string;
  description?: string;
  email?: string;
  isSubscriber?: boolean;
}

export interface CreateCommentInput {
  featureId: string;
  text: string;
  authorName?: string;
}

export interface ListFeaturesParams {
  sort?: FeatureSort;
  limit?: number;
  cursor?: string | null;
  status?: FeatureStatus[];
}

export interface ListCommentsParams {
  limit?: number;
  cursor?: string | null;
}
