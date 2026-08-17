// ⚠️ bloods = PERMINTAAN DARAH dari rumah sakit (BUKAN pendaftaran donor).
import { api } from "./client";
import type { Blood, BloodStatus, BloodType } from "../types/models";

// List permintaan darah (donor lihat yang tersedia; bisa filter).
export async function listBloods(params?: {
  city?: string;
  status_blood?: BloodStatus;
  bloodType?: BloodType;
}) {
  const { data } = await api.get<Blood[]>("/bloods", { params });
  return data;
}

export async function getBlood(id: string) {
  const { data } = await api.get<Blood>(`/bloods/${id}`);
  return data;
}

// Facility bikin permintaan darah baru.
export async function createBlood(input: {
  bloodType: BloodType;
  quantity: number;
  status_blood: BloodStatus; // "normal" | "urgent" | "closed"
  note?: string;
}) {
  const { data } = await api.post<Blood>("/bloods", input);
  return data;
}

export async function updateBloodStatus(id: string, status_blood: BloodStatus) {
  const { data } = await api.patch<Blood>(`/bloods/${id}`, { status_blood });
  return data;
}
