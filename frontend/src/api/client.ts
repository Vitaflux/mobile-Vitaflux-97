import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../config/env";

const TOKEN_KEY = "vitaflux_token";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Sisipkan JWT ke tiap request
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handler error global sederhana
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // 401 → biar store/gate yang atur logout; di sini cukup teruskan
    return Promise.reject(error);
  },
);
