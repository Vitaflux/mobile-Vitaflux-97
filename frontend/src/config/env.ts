// Expo mengekspos env yang berawalan EXPO_PUBLIC_ ke client.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn(
    "[env] EXPO_PUBLIC_API_URL belum di-set, pakai default http://localhost:3000",
  );
}
