// Cermin JS dari tailwind.config.js (token FINAL).
// Styling utama pakai className NativeWind; ini buat tempat yang butuh nilai
// mentah (mis. prop `color` ActivityIndicator, ikon, dsb).
export const colors = {
  primary: "#D92D3C",
  primaryDark: "#B91C28",
  primarySoft: "#FDECEC",
  surface: "#FFFFFF",
  muted: "#F7F7F8",
  line: "#E5E7EB",
  text: "#1A1A1A",
  textMuted: "#6B7280",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#DC2626",
  info: "#2563EB",
};

// Warna badge per status pendaftaran (state machine)
export const statusColor = {
  registered: "#9CA3AF", // Terdaftar
  confirmed: "#2563EB", // Dikonfirmasi
  done: "#16A34A", // Selesai
  urgent: "#DC2626",
} as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 9999 };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
