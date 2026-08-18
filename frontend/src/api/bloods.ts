import { api } from "./client";
import type { Blood, BloodStatus, BloodType, Rhesus } from "../types/models";

export type BloodComponent =
  | "whole_blood"
  | "plasma"
  | "trombosit"
  | "eritrosit";

// Donor: kebutuhan cocok dalam radius (METER, 1..20000).
export async function matchBloods(radiusMeters: number) {
  const { data } = await api.get<Blood[]>("/bloods/matches", {
    params: {
      radius: radiusMeters,
    },
  });

  return data;
}

// Facility: list kebutuhan milik faskes.
export async function listBloods() {
  const { data } = await api.get<Blood[]>("/bloods");

  return data;
}

// Facility: detail kebutuhan.
export async function getBlood(id: string) {
  const { data } = await api.get<Blood>(`/bloods/${id}`);

  return data;
}

// Facility: buat kebutuhan.
export async function createBlood(input: {
  blood_type: BloodType;
  rhesus: Rhesus;
  quantity: number;
  schedule: string;
  schedule_end: string;
  status_blood: Exclude<BloodStatus, "closed">;
  title: string;
  component: BloodComponent;
  note?: string | null;
}) {
  const { data } = await api.post<Blood>("/bloods", input);

  return data;
}

// Facility: tutup kebutuhan.
export async function closeBlood(id: string) {
  const { data } = await api.patch<Blood>(`/bloods/${id}/close`, {});

  return data;
}
