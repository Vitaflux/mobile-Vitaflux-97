// ⚠️ requests = PENDAFTARAN DONOR (donor daftar ikut suatu permintaan darah).
import { api } from "./client";
import type { DonorRequest, DonorRequestStatus } from "../types/models";

// Donor daftar ke sebuah permintaan darah (bloodId).
export async function registerAsDonor(bloodId: string, scheduledAt?: string) {
  const { data } = await api.post<DonorRequest>("/requests", {
    bloodId,
    scheduledAt,
  });
  return data;
}

// Pendaftaran milik donor yang login.
export async function myDonorRequests() {
  const { data } = await api.get<DonorRequest[]>("/requests/me");
  return data;
}

// Facility: lihat pendaftaran yang perlu di-approve untuk permintaannya.
export async function pendingApprovals() {
  const { data } = await api.get<DonorRequest[]>("/requests/pending");
  return data;
}

export async function updateRequestStatus(
  id: string,
  status: DonorRequestStatus,
) {
  const { data } = await api.patch<DonorRequest>(`/requests/${id}`, { status });
  return data;
}

// QR check-in: facility scan token → tandai donor hadir.
export async function checkInByQr(qrToken: string) {
  const { data } = await api.post<DonorRequest>("/requests/check-in", {
    qrToken,
  });
  return data;
}
