// =============================================================
// Tipe model — mengikuti skema instruktur (5 koleksi):
// users, userProfiles, hospitals, bloods, requests
//
// ⚠️ KONVENSI PENAMAAN (JEBAKAN TIM — jangan dibalik):
//   bloods   = PERMINTAAN DARAH dari rumah sakit
//   requests = PENDAFTARAN DONOR (donor daftar ikut donor)
// =============================================================

export type Role = "donor" | "facility";

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

// isUrgent dilebur ke dalam enum status
export type BloodStatus = "normal" | "urgent" | "closed";

export type DonorRequestStatus =
  | "registered"
  | "approved"
  | "rejected"
  | "checked_in"
  | "completed"
  | "cancelled";

export interface User {
  _id: string;
  email: string;
  role: Role;
  hospitalId?: string; // diisi kalau role = facility
  createdAt: string;
}

export interface UserProfile {
  _id: string;
  userId: string;
  fullName: string;
  phone?: string;
  bloodType?: BloodType;
  // hasil health screening
  lastDonationDate?: string;
  weightKg?: number;
  eligible?: boolean;
}

export interface Hospital {
  _id: string;
  name: string;
  city: string;
  address?: string;
  latitude: number; // lat/long disimpan terpisah (bukan 2dsphere)
  longitude: number;
  distanceKm?: number; // dihitung via Haversine, opsional dari response
}

// bloods = permintaan darah DARI rumah sakit
export interface Blood {
  _id: string;
  hospitalId: string;
  bloodType: BloodType;
  quantity: number;
  status_blood: BloodStatus;
  note?: string;
  createdAt: string;
  hospital?: Hospital; // kalau di-populate backend
}

// requests = PENDAFTARAN DONOR
export interface DonorRequest {
  _id: string;
  donorId: string; // userId donor
  bloodId: string; // id permintaan darah yang didaftari
  status: DonorRequestStatus;
  scheduledAt?: string;
  checkedInAt?: string;
  qrToken?: string; // buat QR check-in
  createdAt: string;
  blood?: Blood; // kalau di-populate
}
