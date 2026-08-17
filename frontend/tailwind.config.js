/** @type {import('tailwindcss').Config} */
// Token FINAL — disampel dari mockup "Design System" Vitaflux.
// Aturan: merah maksimal ±10% layar; TEKS merah pakai primary-dark (#AE1800).
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#EC3013", // Accent
          dark: "#AE1800", // Accent-700 — teks merah
          tint: "#FFE0D9", // Accent-200
          soft: "#FFF2EF", // Accent-100
        },
        ink: { DEFAULT: "#201E1D", muted: "#605D5D" },
        line: "#D7D3D3",
        ground: "#F8F4F4",
        surface: "#FFFFFF",
      },
      // Archivo per-weight. RN butuh nama family spesifik per berat
      // (fontWeight biasa TIDAK ganti file font di RN).
      fontFamily: {
        archivo: ["Archivo_400Regular"],
        "archivo-medium": ["Archivo_500Medium"],
        "archivo-semibold": ["Archivo_600SemiBold"],
        "archivo-bold": ["Archivo_700Bold"],
        "archivo-black": ["Archivo_800ExtraBold"],
      },
      fontSize: {
        display: "32px",
        judul: "24px",
        subjudul: "18px",
        body: "16px",
        caption: "14px",
        overline: "11px",
      },
      letterSpacing: { overline: "0.14em" },
      borderRadius: {
        sm: "8px",
        card: "14px",
        sheet: "22px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
