import { api } from "./client";

// PATCH /notifications/push-token (donor). Body { push_token }.
export async function updatePushToken(pushToken: string | null) {
  const { data } = await api.patch("/notifications/push-token", {
    push_token: pushToken,
  });
  return data;
}

export async function clearPushToken() {
  return updatePushToken(null);
}
