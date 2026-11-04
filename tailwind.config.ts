import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4fbfb",
          100: "#dff6f4",
          200: "#beeae5",
          300: "#8ed3ca",
          400: "#5bb7ae",
          500: "#3f9d96",
          600: "#2f7d7a",
          700: "#245d5d",
          800: "#1d4b4a",
          900: "#183b3b",
        },
        slate: {
          950: "#0c1724",
        },
        warning: {
          500: "#d98a36",
        },
        danger: {
          500: "#d95e52",
        },
      },
      boxShadow: {
        soft: "0 12px 30px rgba(12, 23, 36, 0.08)",
      },
      borderRadius: {
        xl: "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
