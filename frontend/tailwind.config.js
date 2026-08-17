/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#D92D3C", 
          dark: "#B91C28",
          soft: "#FDECEC",
        },
        surface: "#FFFFFF",
        muted: "#F7F7F8",
        line: "#E5E7EB", 
        ink: {
          DEFAULT: "#1A1A1A",
          muted: "#6B7280",
        },
       
        status: {
          registered: "#9CA3AF", 
          confirmed: "#2563EB", 
          done: "#16A34A", 
          urgent: "#DC2626", 
        },
        success: "#16A34A",
        warning: "#F59E0B",
        error: "#DC2626",
        info: "#2563EB",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "20px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
