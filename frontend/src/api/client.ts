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

// Backend membungkus SEMUA respons: { success, data }.
// Buka bungkusnya di sini supaya tiap fungsi api langsung dapat payload aslinya
// (jadi `const { data } = await api.get(...)` = isi data, bukan wrapper).
api.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (
      body &&
      typeof body === "object" &&
      "success" in body &&
      "data" in body
    ) {
      res.data = (body as { data: unknown }).data;
    }
    return res;
  },
  (error) => Promise.reject(error),
);
