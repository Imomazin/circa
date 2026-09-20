import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Circa commercial-intelligence palette
        charcoal: {
          DEFAULT: "#14181c",
          50: "#f5f6f7",
          100: "#e7e9eb",
          200: "#c8ccd1",
          300: "#a4abb2",
          400: "#727b84",
          500: "#4d555d",
          600: "#363d44",
          700: "#262c31",
          800: "#1a1f24",
          900: "#14181c",
          950: "#0d1013",
        },
        evergreen: {
          DEFAULT: "#0f3d33",
          50: "#eef6f3",
          100: "#d3e8e1",
          200: "#a6d0c3",
          300: "#6fb2a0",
          400: "#3f8d78",
          500: "#26705d",
          600: "#1a594a",
          700: "#14473c",
          800: "#0f3d33",
          900: "#0b2c25",
        },
        amber: {
          DEFAULT: "#c98a2b",
          50: "#fbf4e8",
          100: "#f4e2c3",
          200: "#e9c689",
          300: "#dcaa53",
          400: "#c98a2b",
          500: "#a86f1f",
          600: "#85561a",
          700: "#653f16",
        },
        warmgrey: {
          DEFAULT: "#8b8781",
          50: "#f7f6f4",
          100: "#eeece8",
          200: "#dcd8d1",
          300: "#c3bdb2",
          400: "#a49d90",
          500: "#8b8781",
          600: "#6f6b65",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        surface: "var(--surface)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};

export default config;
