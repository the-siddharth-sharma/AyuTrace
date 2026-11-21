import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "hsl(var(--border))",
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-plus-jakarta-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.25rem" }], // 14px (scaled +2px from 12px)
        sm: ["1rem", { lineHeight: "1.5rem" }], // 16px (scaled +2px from 14px)
        base: ["1.125rem", { lineHeight: "1.75rem" }], // 18px (scaled +2px from 16px)
        lg: ["1.25rem", { lineHeight: "1.875rem" }], // 20px (scaled +2px from 18px)
        xl: ["1.375rem", { lineHeight: "2rem" }], // 22px (scaled +2px from 20px)
        "2xl": ["1.625rem", { lineHeight: "2.25rem" }], // 26px (scaled +2px from 24px)
        "3xl": ["2.125rem", { lineHeight: "2.5rem" }], // 34px (scaled +4px from 30px)
        "4xl": ["2.5rem", { lineHeight: "2.75rem" }], // 40px (scaled +4px from 36px)
      },
    },
  },
  plugins: [],
};
export default config;
