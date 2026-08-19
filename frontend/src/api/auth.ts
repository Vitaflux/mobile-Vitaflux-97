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
}

export interface LoginResult {
  access_token: string;
  user: User;
}

export interface GoogleOnboardingResult {
  requires_onboarding: true;
  onboarding_token: string;
  profile: { name: string; email: string };
}

export type GoogleLoginResult = LoginResult | GoogleOnboardingResult;

export type GoogleOnboardingInput = Omit<
  RegisterInput,
  "name" | "email" | "password"
> & {
  onboarding_token: string;
  name?: string;
};

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

export async function googleLogin(idToken: string) {
  const { data } = await api.post<GoogleLoginResult>("/auth/google", {
    id_token: idToken,
  });
  return data;
}

export async function completeGoogleOnboarding(input: GoogleOnboardingInput) {
  const { data } = await api.post<LoginResult>(
    "/auth/google/onboarding",
    input,
  );
  return data;
}
