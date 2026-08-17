import { api } from "./client";
import type { Blood, BloodStatus, BloodType, Rhesus } from "../types/models";

// Donor: kebutuhan cocok dalam radius (METER, 1..20000).
export async function matchBloods(radiusMeters: number) {
  const { data } = await api.get<Blood[]>("/bloods/matches", {
    params: { radius: radiusMeters },
  });
  return data;
}

// Facility: list kebutuhan milik faskes
export async function listBloods() {
  const { data } = await api.get<Blood[]>("/bloods");
  return data;
}

export async function getBlood(id: string) {
  const { data } = await api.get<Blood>(`/bloods/${id}`);
  return data;
}

// Facility: buat kebutuhan (status_blood hanya "normal" | "urgent")
export async function createBlood(input: {
  blood_type: BloodType;
  rhesus: Rhesus;
  quantity: number;
  schedule: string; // ISO date
  status_blood: Exclude<BloodStatus, "closed">;
}) {
  const { data } = await api.post<Blood>("/bloods", input);
  return data;
}

export async function closeBlood(id: string) {
  const { data } = await api.patch<Blood>(`/bloods/${id}/close`, {});
  return data;
}
