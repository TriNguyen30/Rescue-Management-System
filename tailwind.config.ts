import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#34C759",
        secondary: "#627254",
      },
    },
  },
  plugins: [],
} satisfies Config;
