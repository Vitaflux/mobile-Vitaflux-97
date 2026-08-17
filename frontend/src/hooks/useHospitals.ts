// Contoh pola React Query — tinggal duplikat buat bloods/requests.
import { useQuery } from "@tanstack/react-query";
import * as hospitalsApi from "../api/hospitals";

export function useHospitalsByCity(city: string) {
  return useQuery({
    queryKey: ["hospitals", "city", city],
    queryFn: () => hospitalsApi.searchByCity(city),
    enabled: city.length > 0, // jangan fetch kalau input kosong
  });
}

export function useHospitalsByRadius(coords: {
  latitude: number;
  longitude: number;
  radiusKm: number;
} | null) {
  return useQuery({
    queryKey: ["hospitals", "radius", coords],
    queryFn: () => hospitalsApi.searchByRadius(coords!),
    enabled: !!coords,
  });
}
