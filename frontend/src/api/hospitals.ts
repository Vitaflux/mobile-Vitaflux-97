import { api } from "./client";
import type { Hospital } from "../types/models";

// Cari RS berdasarkan radius (lat/long + km) — Haversine dihitung di backend.
export async function searchByRadius(params: {
  latitude: number;
  longitude: number;
  radiusKm: number;
}) {
  const { data } = await api.get<Hospital[]>("/hospitals/search", { params });
  return data;
}

// Cari RS berdasarkan kota.
export async function searchByCity(city: string) {
  const { data } = await api.get<Hospital[]>("/hospitals/search", {
    params: { city },
  });
  return data;
}

export async function getHospital(id: string) {
  const { data } = await api.get<Hospital>(`/hospitals/${id}`);
  return data;
}
