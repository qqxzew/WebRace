import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        peach: {
          50: "#fff8f3",
          100: "#ffeedd",
          200: "#ffd5ad",
          300: "#ffb87a",
          400: "#ff9548",
          500: "#ff7520",
          600: "#e85c0a",
          700: "#c04508",
          800: "#993510",
          900: "#7c2d12",
        },
        cream: {
          50: "#fffef7",
          100: "#fffde8",
          200: "#fef9c3",
          300: "#fef08a",
          400: "#fde047",
          500: "#f59e0b",
        },
        warm: {
          50: "#fdfaf7",
          100: "#f9f2e8",
          200: "#f0e2cc",
          300: "#e5ccaa",
          400: "#d4a876",
          500: "#c4874d",
          600: "#a06830",
          700: "#7a4e22",
          800: "#5a3819",
          900: "#3d2410",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        "slide-in": "slideIn 0.4s ease forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "bounce-soft": "bounceSoft 1s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        warm: "0 4px 24px rgba(255, 150, 80, 0.15)",
        "warm-lg": "0 8px 40px rgba(255, 150, 80, 0.2)",
        card: "0 2px 16px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
