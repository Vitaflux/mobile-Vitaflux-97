import { api } from "./client";
import type { Role, User } from "../types/models";

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function register(input: {
  email: string;
  password: string;
  role: Role;
  fullName: string;
}) {
  const { data } = await api.post<AuthResponse>("/auth/register", input);
  return data;
}

// Ambil user saat ini dari token (sesuaikan endpoint dgn backend)
export async function me() {
  const { data } = await api.get<User>("/auth/me");
  return data;
}
