import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0f",
        panel: "#111118",
        line: "#262631",
        violet: "#8b5cf6"
      },
      boxShadow: {
        glow: "0 0 35px rgba(139,92,246,.18)"
      }
    }
  },
  plugins: []
};

export default config;
