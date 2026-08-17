import { create } from "zustand";
import type { User } from "../types/models";
import * as authApi from "../api/auth";
import { clearToken, getToken, saveToken } from "../api/client";

interface AuthState {
  user: User | null;
  status: "loading" | "authed" | "guest"; // loading = lagi cek token saat start
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: Parameters<typeof authApi.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "loading",

  // Dipanggil sekali saat app start: ada token? ambil user-nya.
  hydrate: async () => {
    const token = await getToken();
    if (!token) return set({ status: "guest", user: null });
    try {
      const user = await authApi.me();
      set({ user, status: "authed" });
    } catch {
      await clearToken();
      set({ status: "guest", user: null });
    }
  },

  login: async (email, password) => {
    const { accessToken, user } = await authApi.login(email, password);
    await saveToken(accessToken);
    set({ user, status: "authed" });
  },

  register: async (input) => {
    const { accessToken, user } = await authApi.register(input);
    await saveToken(accessToken);
    set({ user, status: "authed" });
  },

  logout: async () => {
    await clearToken();
    set({ user: null, status: "guest" });
  },
}));
