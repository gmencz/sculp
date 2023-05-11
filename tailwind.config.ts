import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans],
      },
      screens: {
        xs: "475px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
} satisfies Config;
