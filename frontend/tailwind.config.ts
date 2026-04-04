import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7f2",
          100: "#dde5d5",
          200: "#bfd0b0",
          300: "#9ab487",
          400: "#78955f",
          500: "#5f7a48",
          600: "#4c6238",
          700: "#3d4f2d",
          800: "#333f27",
          900: "#2c3523"
        }
      }
    }
  },
  plugins: [],
} satisfies Config;
