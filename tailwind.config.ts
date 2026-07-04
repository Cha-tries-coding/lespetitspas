import type { Config } from "tailwindcss";

/**
 * Charte graphique Soleil — tokens réutilisables.
 * Les variables CSS dans app/globals.css restent la source de vérité pour ShadCN.
 */
const soleil = {
  primary: "#FF8A65",
  secondary: "#66BB6A",
  accent: "#FFD54F",
  background: "#FFF8E1",
  surface: "#FFFFFF",
  text: "#3E2723",
  "text-muted": "#795548",
  error: "#E57373",
  border: "#EFDFC5",
} as const;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        soleil,
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: [
          "var(--font-nunito)",
          "Nunito",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        soleil: "1rem",
        "soleil-lg": "1.25rem",
        "soleil-xl": "1.5rem",
      },
      boxShadow: {
        soleil: "0 2px 12px rgb(62 39 35 / 0.06)",
        "soleil-md": "0 4px 20px rgb(62 39 35 / 0.08)",
      },
    },
  },
};

export default config;
