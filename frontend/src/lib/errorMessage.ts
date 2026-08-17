// Ambil pesan error jadi STRING yang aman buat Alert.
// Backend (NestJS/class-validator) bisa balikin `message` sebagai array —
// kalau array dilempar ke Alert.alert, native-nya crash.
export function errorMessage(e: any, fallback = "Terjadi kesalahan."): string {
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join("\n");
  if (typeof m === "string") return m;
  if (typeof e?.response?.data?.error === "string") return e.response.data.error;
  if (typeof e?.message === "string") return e.message;
  return fallback;
}
