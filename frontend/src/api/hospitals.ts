import { api } from "./client";

export type FacilityProfile = {
  id: string;
  hospital_name: string;
  code: string | null;
  address: string | null;
  unit_donor: string | null;
  pic_name: string | null;
  contact: string | null;
  hospital_type: string | null;
  isVerified: boolean;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  stats: {
    total_collected: number;
    attendance_rate: number;
    done_today: number;
  };
};

export type UpdateHospitalInput = {
  hospital_name?: string;
  address?: string | null;
  unit_donor?: string | null;
  pic_name?: string | null;
  contact?: string | null;
  hospital_type?: string | null;
};

export async function getMyHospital() {
  const { data } = await api.get<FacilityProfile>("/hospitals/me");

  return data;
}

export async function updateMyHospital(input: UpdateHospitalInput) {
  const { data } = await api.patch<FacilityProfile>("/hospitals/me", input);

  return data;
}
