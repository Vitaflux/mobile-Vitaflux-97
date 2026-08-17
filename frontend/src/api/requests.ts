import { api } from "./client";
import type { DonorRequest } from "../types/models";

// Donor daftar ke kebutuhan — skrining WAJIB lolos (screeningPassed: true).
export async function registerToBlood(
  bloodsId: string,
  screeningAnswers: Record<string, unknown>,
) {
  const { data } = await api.post<DonorRequest>("/requests", {
    bloods_id: bloodsId,
    screenings: { screeningPassed: true, screeningAnswers },
  });
  return data;
}

// Facility: pendaftar untuk sebuah kebutuhan
export async function applicantsForBlood(bloodId: string) {
  const { data } = await api.get<DonorRequest[]>(`/requests/blood/${bloodId}`);
  return data;
}

// Facility: konfirmasi pendaftar (registered → confirmed)
export async function confirmRequest(id: string) {
  const { data } = await api.patch<DonorRequest>(`/requests/${id}/confirm`, {});
  return data;
}

// Facility: check-in via QR (PATCH, body { qr_token })
export async function checkInByQr(qrToken: string) {
  const { data } = await api.patch<DonorRequest>("/requests/check-in", {
    qr_token: qrToken,
  });
  return data;
}
