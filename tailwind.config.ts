import type { Config } from "tailwindcss";

/**
 * Circa design system.
 *
 * A mineral palette for a circular-economy decision-intelligence platform:
 * deep forest green used sparingly as the brand/primary, graphite for
 * structure and text, warm stone/sand surfaces, and a copper accent for value
 * and action. Deliberately not the bright-green sustainability cliché.
 *
 * Colour-scale keys are kept stable (charcoal / evergreen / amber / warmgrey)
 * so existing class names re-skin automatically; `amber` now carries copper
 * tones, and `copper` / `stone` are aliases for new, intentional usage.
 */

const graphite = {
  DEFAULT: "#0d1411",
  50: "#f4f6f4",
  100: "#e7eae7",
  200: "#c7ccc6",
  300: "#99a39b",
  400: "#6a766d",
  500: "#47544c",
  600: "#2f3c35",
  700: "#1f2a24",
  800: "#141c18",
  900: "#0d1411",
  950: "#080d0b",
};

const evergreen = {
  DEFAULT: "#0f4234",
  50: "#edf6f2",
  100: "#d2e8e0",
  200: "#a3d1c3",
  300: "#6cb29e",
  400: "#3b8f76",
  500: "#1f6b57",
  600: "#165844",
  700: "#0f4234",
  800: "#0b3127",
  900: "#07201a",
};

const copper = {
  DEFAULT: "#b26a2e",
  50: "#fbf3e9",
  100: "#f2ddc4",
  200: "#e2b485",
  300: "#cc8b4e",
  400: "#b26a2e",
  500: "#9c5f27",
  600: "#7d4a1c",
  700: "#5e3613",
};

const stone = {
  DEFAULT: "#8b8379",
  50: "#f7f5f1",
  100: "#efebe4",
  200: "#e2dcd1",
  300: "#cabfae",
  400: "#a99f8d",
  500: "#8b8379",
  600: "#6d665d",
};

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: graphite,
        graphite,
        evergreen,
        amber: copper,
        copper,
        warmgrey: stone,
        stone,
        accent: "var(--accent)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 21 26 / 0.04), 0 1px 1px -1px rgb(16 21 26 / 0.03)",
        raised: "0 4px 16px -6px rgb(16 21 26 / 0.12), 0 2px 6px -4px rgb(16 21 26 / 0.08)",
        inset: "inset 0 1px 0 0 rgb(255 255 255 / 0.04)",
      },
      maxWidth: {
        content: "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
