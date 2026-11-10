import type { Config } from "tailwindcss";

// Token desain dari "UI UX DESIGN WEBSITE/sistem_informasi_pendapatan_wisata_daerah.md"
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#16324F", deep: "#001d37", light: "#2e4867" },
        action: { DEFAULT: "#2563EB", hover: "#1D4ED8", active: "#1E40AF" },
        teal: { DEFAULT: "#0F766E", soft: "#4fa69d" },
        canvas: "#F5F7FA",
        line: "#E2E8F0",
        muted: "#64748B",
      },
      fontFamily: {
        head: ["var(--font-jakarta)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: { card: "12px", ctl: "8px" },
      boxShadow: {
        card: "0 4px 12px rgba(22, 50, 79, 0.05)",
        hover: "0 6px 16px rgba(22, 50, 79, 0.08)",
        overlay: "0 12px 32px rgba(22, 50, 79, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;

