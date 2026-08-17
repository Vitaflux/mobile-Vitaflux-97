import { create } from "zustand";
import type { User } from "../types/models";
import * as authApi from "../api/auth";
import { clearToken, saveToken } from "../api/client";

interface AuthState {
  user: User | null;
  status: "authed" | "guest";
  login: (email: string, password: string) => Promise<void>;
  register: (input: authApi.RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "guest",

  login: async (email, password) => {
    const { access_token, user } = await authApi.login(email, password);
    await saveToken(access_token);
    set({ user, status: "authed" });
  },

  // Backend register tidak memberi token → langsung login setelah daftar.
  register: async (input) => {
    await authApi.register(input);
    const { access_token, user } = await authApi.login(
      input.email,
      input.password,
    );
    await saveToken(access_token);
    set({ user, status: "authed" });
  },

  logout: async () => {
    await clearToken();
    set({ user: null, status: "guest" });
  },
}));
