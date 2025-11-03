import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#2dd4bf",
          yellow: "#fcd34d",
          red: "#fb7185",
          slate: "#0f172a"
        }
      },
      boxShadow: {
        card: "0 25px 50px -12px rgba(15, 23, 42, 0.25)"
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
