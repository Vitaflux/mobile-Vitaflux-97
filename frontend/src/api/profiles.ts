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
  location: GeoPoint;
  birth_date?: string | null;
  weight_kg?: number | null;
  city?: string | null;
  notify_radius_km?: number | null;
}

// GET 404 kalau donor belum memiliki profil.
export async function getMyProfile() {
  const { data } = await api.get<DonorProfile>("/profiles/me");

  return data;
}

export async function updateMyProfile(input: UpdateProfileInput) {
  const { data } = await api.patch<DonorProfile>("/profiles/me", input);

  return data;
}
