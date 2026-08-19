import { create } from "zustand";
import type { User } from "../types/models";
import * as authApi from "../api/auth";
import { clearToken, saveToken } from "../api/client";

interface AuthState {
  user: User | null;
  status: "authed" | "guest";
  login: (email: string, password: string) => Promise<void>;
  googleOnboarding: { token: string; name: string; email: string } | null;
  loginWithGoogle: (idToken: string) => Promise<"authed" | "onboarding">;
  completeGoogleOnboarding: (
    input: Omit<authApi.GoogleOnboardingInput, "onboarding_token">,
  ) => Promise<void>;
  register: (input: authApi.RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "guest",
  googleOnboarding: null,

  login: async (email, password) => {
    const { access_token, user } = await authApi.login(email, password);
    await saveToken(access_token);
    set({ user, status: "authed" });
  },

  loginWithGoogle: async (idToken) => {
    const result = await authApi.googleLogin(idToken);
    if ("requires_onboarding" in result) {
      set({
        googleOnboarding: {
          token: result.onboarding_token,
          name: result.profile.name,
          email: result.profile.email,
        },
      });
      return "onboarding";
    }

    await saveToken(result.access_token);
    set({ user: result.user, status: "authed", googleOnboarding: null });
    return "authed";
  },

  completeGoogleOnboarding: async (input) => {
    const pending = useAuth.getState().googleOnboarding;
    if (!pending) throw new Error("Sesi pendaftaran Google tidak ditemukan.");
    const result = await authApi.completeGoogleOnboarding({
      ...input,
      onboarding_token: pending.token,
    });
    await saveToken(result.access_token);
    set({ user: result.user, status: "authed", googleOnboarding: null });
  },

  // Hanya membuat akun — TIDAK auto-login. User masuk manual di layar login.
  register: async (input) => {
    await authApi.register(input);
  },

  logout: async () => {
    await clearToken();
    set({ user: null, status: "guest", googleOnboarding: null });
  },
}));
