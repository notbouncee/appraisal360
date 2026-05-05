import { apiDelete, apiGet, apiGetText, apiPost, apiPut, clearAccessToken, getAccessToken, setAccessToken } from "@/api/http";

export type AuthUser = { id: string; email: string };
export type Profile = {
  id: string;
  user_id?: string;
  display_name: string;
  team: string;
  avatar_url: string | null;
  role?: string;
  must_change_password?: boolean;
};
export type AuthResponse = { access_token: string; token_type: string; user: AuthUser; profile: Profile };
export type SignInResponse = {
  access_token?: string;
  token_type?: string;
  must_change_password?: boolean;
  password_change_token?: string;
  user: AuthUser;
  profile: Profile;
};
export type RefreshResponse = { access_token: string; token_type: string };

export type ReviewCycle = {
  id: string;
  year: number;
  quarter: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
};

export type FeedbackQuestion = {
  id: string;
  label: string;
  description: string;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminCreateUserPayload = {
  email: string;
  display_name: string;
  team: string;
  role: string;
  temp_password: string;
};

export type FeedbackItem = {
  id: string;
  situation: string;
  behaviour: string;
  impact: string;
  optional: string | null;
  created_at: string;
  author_id: string;
  recipient_id: string;
  is_anonymous: boolean;
};

export type UpvoteItem = {
  id: string;
  voter_id: string;
  upvoted_id: string;
  message: string;
  created_at: string;
};

export type ReactionItem = {
  id: string;
  appreciation_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export async function signUp(email: string, password: string, displayName: string): Promise<AuthResponse> {
  const data = await apiPost<AuthResponse>("/auth/signup", { email, password, display_name: displayName });
  setAccessToken(data.access_token);
  return data;
}

export async function signIn(email: string, password: string): Promise<SignInResponse> {
  const data = await apiPost<SignInResponse>("/auth/signin", { email, password });
  if (data.access_token) {
    setAccessToken(data.access_token);
  }
  return data;
}

export async function signOut(): Promise<void> {
  try {
    await apiPost<{ message: string }>("/auth/signout", undefined, true);
  } finally {
    clearAccessToken();
  }
}

export async function changePassword(token: string, newPassword: string): Promise<AuthResponse> {
  const data = await apiPost<AuthResponse>("/auth/change-password", { token, new_password: newPassword });
  setAccessToken(data.access_token);
  return data;
}

export async function refreshAccessToken(): Promise<RefreshResponse> {
  const data = await apiPost<RefreshResponse>("/auth/refresh", undefined, true);
  setAccessToken(data.access_token);
  return data;
}

export function hasAccessToken(): boolean {
  return !!getAccessToken();
}

export async function me(): Promise<{ user: AuthUser; profile: Profile }> {
  return apiGet<{ user: AuthUser; profile: Profile }>("/auth/me", undefined, true);
}

export async function listProfiles(ids?: string[]): Promise<Profile[]> {
  const query = ids && ids.length > 0 ? { ids: ids.join(",") } : undefined;
  return apiGet<Profile[]>("/profiles", query);
}

export async function listReviewCycles(year: number): Promise<ReviewCycle[]> {
  return apiGet<ReviewCycle[]>("/review-cycles", { year });
}

export async function createReviewCycle(payload: Omit<ReviewCycle, "id" | "created_at" | "updated_at">): Promise<ReviewCycle> {
  return apiPost<ReviewCycle>("/review-cycles", payload, true);
}

export async function updateReviewCycle(
  id: string,
  payload: { title: string; description: string; start_date: string; end_date: string },
): Promise<ReviewCycle> {
  return apiPut<ReviewCycle>(`/review-cycles/${id}`, payload, true);
}

export async function deleteReviewCycle(id: string): Promise<void> {
  await apiDelete<{ message: string }>(`/review-cycles/${id}`, undefined, true);
}

export async function listFeedbackQuestions(): Promise<FeedbackQuestion[]> {
  return apiGet<FeedbackQuestion[]>("/admin/feedback-questions", undefined, true);
}

export async function createFeedbackQuestion(payload: {
  label: string;
  description: string;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
}): Promise<FeedbackQuestion> {
  return apiPost<FeedbackQuestion>("/admin/feedback-questions", payload, true);
}

export async function updateFeedbackQuestion(
  id: string,
  payload: { label: string; description: string; is_required: boolean; sort_order: number; is_active: boolean },
): Promise<FeedbackQuestion> {
  return apiPut<FeedbackQuestion>(`/admin/feedback-questions/${id}`, payload, true);
}

export async function deleteFeedbackQuestion(id: string): Promise<void> {
  await apiDelete<{ message: string }>(`/admin/feedback-questions/${id}`, undefined, true);
}

export async function adminCreateUser(payload: AdminCreateUserPayload): Promise<{
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  team: string;
  role: string;
  must_change_password: boolean;
}> {
  return apiPost("/admin/users", payload, true);
}

export async function forcePasswordChange(email: string): Promise<void> {
  await apiPost("/admin/users/force-password-change", { email }, true);
}

export async function exportFeedbackCsv(params: {
  start_date?: string;
  end_date?: string;
  recipient_id?: string;
  author_id?: string;
  is_anonymous?: boolean;
}): Promise<string> {
  return apiGetText("/admin/feedback/export", params, true);
}

export async function getFeedbackCount(recipientId: string): Promise<number> {
  const response = await apiGet<{ count: number }>("/feedback/count", { recipient_id: recipientId });
  return response.count;
}

export async function getFeedbackReceived(recipientId: string, page: number, pageSize: number): Promise<{ data: FeedbackItem[]; count: number }> {
  return apiGet<{ data: FeedbackItem[]; count: number }>("/feedback/received", {
    recipient_id: recipientId,
    page,
    page_size: pageSize,
  });
}

export async function createFeedback(items: Array<{
  author_id: string;
  recipient_id: string;
  situation: string;
  behaviour: string;
  impact: string;
  optional?: string;
  is_anonymous: boolean;
}>): Promise<void> {
  await apiPost<{ message: string }>("/feedback/bulk", { items }, true);
}

export async function getUpvoteCount(upvotedId: string): Promise<number> {
  const response = await apiGet<{ count: number }>("/upvotes/count", { upvoted_id: upvotedId });
  return response.count;
}

export async function getUpvotesReceived(upvotedId: string, page: number, pageSize: number): Promise<{ data: UpvoteItem[]; count: number }> {
  return apiGet<{ data: UpvoteItem[]; count: number }>("/upvotes/received", {
    upvoted_id: upvotedId,
    page,
    page_size: pageSize,
  });
}

export async function getUpvoteFeed(): Promise<UpvoteItem[]> {
  return apiGet<UpvoteItem[]>("/upvotes/feed");
}

export async function createUpvote(payload: { voter_id: string; upvoted_id: string; message: string }): Promise<UpvoteItem> {
  return apiPost<UpvoteItem>("/upvotes", payload, true);
}

export async function listReactions(): Promise<ReactionItem[]> {
  return apiGet<ReactionItem[]>("/reactions");
}

export async function upsertReaction(payload: { appreciation_id: string; emoji: string }): Promise<ReactionItem> {
  return apiPut<ReactionItem>("/reactions", payload, true);
}

export async function deleteReaction(appreciationId: string): Promise<void> {
  await apiDelete<{ message: string }>("/reactions", { appreciation_id: appreciationId }, true);
}
