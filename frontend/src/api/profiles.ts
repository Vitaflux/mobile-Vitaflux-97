import { api } from "./client";
import type {
  BloodType,
  DonorProfile,
  GeoPoint,
  Rhesus,
} from "../types/models";

export interface UpdateProfileInput {
  blood_type: BloodType;
  rhesus: Rhesus;
  location: GeoPoint; // WAJIB — GeoJSON Point [lng, lat]
  last_donor?: string | null; // ISO date, opsional
}

// GET 404 kalau donor belum punya profil.
export async function getMyProfile() {
  const { data } = await api.get<DonorProfile>("/profiles/me");
  return data;
}

export async function updateMyProfile(input: UpdateProfileInput) {
  const { data } = await api.patch<DonorProfile>("/profiles/me", input);
  return data;
}
