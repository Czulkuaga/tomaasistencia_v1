import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#A150F2",   // morado principal
          dark: "#8C3DD1",      // hover/active
          light: "#B978F5",     // variante clara
        },
        secondary: {
          DEFAULT: "#7988D9",   // azul violáceo
          dark: "#5F6EC0",
          light: "#9AA4E5",
        },
        accent: {
          DEFAULT: "#32D9BA",   // turquesa
          dark: "#27B89D",
          light: "#5FE3CC",
        },
      },
    },
  },

  plugins: [],
} satisfies Config;