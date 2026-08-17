/** @type {import('tailwindcss').Config} */
// Token FINAL — disampel langsung dari mockup "Design System" Vitaflux.
// Aturan pakai: merah maksimal ±10% luas layar; TEKS merah selalu pakai
// primary-dark (#AE1800) biar kontras ≥ 4.5:1.
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // "Accent" pada design system
        primary: {
          DEFAULT: "#EC3013", // Accent
          dark: "#AE1800", // Accent-700 — untuk teks merah
          tint: "#FFE0D9", // Accent-200 — badge tint
          soft: "#FFF2EF", // Accent-100 — bidang lembut
        },
        ink: {
          DEFAULT: "#201E1D", // teks utama
          muted: "#605D5D", // Ink-70 — teks sekunder
        },
        line: "#D7D3D3", // border
        ground: "#F8F4F4", // background layar
        surface: "#FFFFFF", // kartu / input
      },
      // Archivo — perlu di-load dulu via @expo-google-fonts/archivo (tugas kecil terpisah).
      fontFamily: {
        sans: ["Archivo"],
      },
      fontSize: {
        display: "32px", // pasangkan font-extrabold (800)
        judul: "24px", // font-bold (700)
        subjudul: "18px", // font-bold (700)
        body: "16px", // font-normal (400) — ukuran dasar
        caption: "14px", // font-medium (500)
        overline: "11px", // font-bold (700) + tracking-overline
      },
      letterSpacing: {
        overline: "0.14em",
      },
      borderRadius: {
        sm: "8px", // kecil
        card: "14px", // kartu
        sheet: "22px", // bottom sheet
        pill: "9999px", // tombol & badge
      },
    },
  },
  plugins: [],
};
