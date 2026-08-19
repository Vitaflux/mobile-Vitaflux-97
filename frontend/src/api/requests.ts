import { api } from "./client";
import type { DonorRequest } from "../types/models";

export interface ApplicantRequest extends DonorRequest {
  donor: {
    name: string | null;
    blood_type: string;
    rhesus: string;
  } | null;
}

export type CheckInInput = {
  qr_token?: string;
  code?: string;
  volume_ml?: number;
};

// Donor daftar ke kebutuhan.
export async function registerToBlood(
  bloodsId: string,
  screeningAnswers: Record<string, unknown>,
) {
  const { data } = await api.post<DonorRequest>("/requests", {
    bloods_id: bloodsId,
    screenings: {
      screeningPassed: true,
      screeningAnswers,
    },
  });

  return data;
}

// Facility: pendaftar untuk sebuah kebutuhan.
export async function applicantsForBlood(bloodId: string) {
  const { data } = await api.get<ApplicantRequest[]>(
    `/requests/blood/${bloodId}`,
  );

  return data;
}

// Facility: konfirmasi pendaftar.
export async function confirmRequest(id: string) {
  const { data } = await api.patch<DonorRequest>(`/requests/${id}/confirm`, {});

  return data;
}

// Donor: seluruh pendaftaran user yang sedang login.
export async function myRequests(status?: DonorRequest["status"]) {
  const { data } = await api.get<DonorRequest[]>("/requests/me", {
    params: status
      ? {
          status,
        }
      : undefined,
  });

  return data;
}

// Facility: check-in menggunakan QR atau kode manual.
export async function checkInRequest(input: CheckInInput) {
  const { data } = await api.patch<DonorRequest>("/requests/check-in", input);

  return data;
}

// Kompatibilitas untuk pemanggilan scanner QR lama.
export async function checkInByQr(qrToken: string) {
  return checkInRequest({
    qr_token: qrToken,
  });
}

// Facility: check-in menggunakan kode VF-XXXX.
export async function checkInByCode(code: string) {
  return checkInRequest({
    code,
  });
}
