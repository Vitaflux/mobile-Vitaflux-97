import { api } from "./client";
import type { UserProfile } from "../types/models";

// ⚠️ Path & bentuk payload ASUMSI — samakan dengan backend B-06 (userProfiles).
export async function getMyProfile() {
  const { data } = await api.get<UserProfile>("/profiles/me");
  return data;
}

export async function updateMyProfile(input: Record<string, unknown>) {
  const { data } = await api.patch<UserProfile>("/profiles/me", input);
  return data;
}
