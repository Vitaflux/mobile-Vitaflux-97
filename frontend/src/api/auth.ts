import { api } from "./client";
import type { Role, User } from "../types/models";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  blood_type?: "A" | "B" | "AB" | "O";
  rhesus?: "+" | "-";
  address?: string;
  unit_donor?: string;
  pic_name?: string;
  contact?: string;
  hospital_type?: string;
}

export interface LoginResult {
  access_token: string;
  user: User;
}

// Register TIDAK mengembalikan token — hanya user. (Lihat store: langsung login.)
export async function register(input: RegisterInput) {
  const { data } = await api.post<User>("/auth/register", input);
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResult>("/auth/login", {
    email,
    password,
  });
  return data;
}
