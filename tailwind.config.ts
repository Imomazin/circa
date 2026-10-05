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
  DEFAULT: "#10151a",
  50: "#f4f5f7",
  100: "#e6e9ec",
  200: "#c6ccd2",
  300: "#99a2aa",
  400: "#6b757e",
  500: "#4a545d",
  600: "#333c45",
  700: "#222a31",
  800: "#171d23",
  900: "#10151a",
  950: "#0b0e11",
};

const evergreen = {
  DEFAULT: "#114436",
  50: "#eef6f3",
  100: "#d4e9e2",
  200: "#a6d2c5",
  300: "#6fb3a0",
  400: "#3b8f76",
  500: "#22705b",
  600: "#185847",
  700: "#114436",
  800: "#0d3329",
  900: "#0a241d",
};

const copper = {
  DEFAULT: "#b87333",
  50: "#faf2e8",
  100: "#f0dcc3",
  200: "#e0b183",
  300: "#cc8c54",
  400: "#b87333",
  500: "#9a5f28",
  600: "#7a4a1f",
  700: "#5c3718",
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
