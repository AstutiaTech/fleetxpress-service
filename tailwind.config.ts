import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fdf2f2",
          100: "#fce7e7",
          200: "#f9d0d0",
          300: "#f4a9a9",
          400: "#ed7474",
          500: "#D41E46",
          600: "#b01a3a",
          700: "#8d142e",
          800: "#751225",
          900: "#61121f",
          950: "#34070d",
          DEFAULT: "#D41E46",
        },
      },
    },
  },
  plugins: [],
};

export default config;

