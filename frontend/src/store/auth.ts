import { create } from "zustand";
import type { User } from "../types/models";
import * as authApi from "../api/auth";
import { clearToken, saveToken } from "../api/client";
import { clearPushToken } from "../api/notifications";
import { queryClient } from "../lib/queryClient";
import { runLogoutFlow } from "../lib/logoutFlow";

interface AuthState {
  user: User | null;
  status: "authed" | "guest";
  login: (email: string, password: string) => Promise<void>;
  register: (input: authApi.RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  status: "guest",

  login: async (email, password) => {
    const { access_token, user } = await authApi.login(email, password);
    await saveToken(access_token);
    set({ user, status: "authed" });
  },

  // Hanya membuat akun — TIDAK auto-login. User masuk manual di layar login.
  register: async (input) => {
    await authApi.register(input);
  },

  logout: async () => {
    const user = get().user;

    await runLogoutFlow({
      role: user?.role,
      unregisterPushToken: clearPushToken,
      clearLocalToken: clearToken,
      clearUser: () => set({ user: null, status: "guest" }),
      clearCache: () => queryClient.clear(),
    });
  },
}));
