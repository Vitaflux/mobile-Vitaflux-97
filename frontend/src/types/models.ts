// =============================================================
// Tipe model — SESUAI SOURCE backend (snake_case).
//   bloods   = permintaan darah dari faskes
//   requests = pendaftaran donor
// =============================================================

export type Role = "donor" | "facility";
export type BloodType = "A" | "B" | "AB" | "O";
export type Rhesus = "+" | "-";
export type BloodStatus = "normal" | "urgent" | "closed";
export type RequestStatus = "registered" | "confirmed" | "done";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
}

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Eligibility {
  is_eligible: boolean;
  remaining_days: number;
  eligible_at: string | null;
}

export interface DonorProfile {
  id: string;
  user_id: string;
  blood_type: BloodType;
  rhesus: Rhesus;
  location: GeoPoint;
  last_donor: string | null;
  eligibility: Eligibility;
}

// bloods = permintaan darah dari faskes
export interface Blood {
  id: string;
  blood_type: BloodType;
  rhesus: Rhesus;
  quantity: number;
  schedule: string;
  status_blood: BloodStatus;
  // matches/list bisa menyertakan field tambahan (hospital, jarak) —
  // dibiarkan longgar sampai response service dibaca saat D-05/D-06.
  [k: string]: unknown;
}

// requests = pendaftaran donor
export interface DonorRequest {
  id: string;
  bloods_id: string;
  status: RequestStatus;
  qr_token?: string;
  [k: string]: unknown;
}
