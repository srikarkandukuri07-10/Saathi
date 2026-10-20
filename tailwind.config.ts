import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // STRICT 3-COLOR SYSTEM ONLY: Light Green, Black, White
        green: {
          DEFAULT: "var(--green)",
          tint: "var(--green-tint)",
          subtle: "var(--green-subtle)",
        },
        black: {
          DEFAULT: "var(--black)",
          90: "rgba(10, 10, 10, 0.90)",
          80: "rgba(10, 10, 10, 0.80)",
          60: "rgba(10, 10, 10, 0.60)",
          40: "rgba(10, 10, 10, 0.40)",
          20: "rgba(10, 10, 10, 0.20)",
          10: "rgba(10, 10, 10, 0.10)",
          8: "rgba(10, 10, 10, 0.08)",
          4: "rgba(10, 10, 10, 0.04)",
        },
        white: {
          DEFAULT: "var(--white)",
        },
        // Semantic aliases pointing strictly to the 3-color palette
        background: "var(--white)",
        foreground: "var(--black)",
        muted: "rgba(10, 10, 10, 0.06)",
        "muted-foreground": "rgba(10, 10, 10, 0.60)",
        border: "rgba(10, 10, 10, 0.12)",
        "border-strong": "var(--black)",
        primary: {
          DEFAULT: "var(--green)",
          foreground: "var(--black)",
        },
        secondary: {
          DEFAULT: "var(--white)",
          foreground: "var(--black)",
        },
      },
      borderRadius: {
        card: "18px",
        pill: "9999px",
        btn: "12px",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(10, 10, 10, 0.04), 0 1px 3px rgba(10, 10, 10, 0.02)",
        card: "0 4px 20px rgba(10, 10, 10, 0.06)",
        float: "0 12px 32px rgba(10, 10, 10, 0.08)",
        solid: "3px 3px 0px #0A0A0A",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
