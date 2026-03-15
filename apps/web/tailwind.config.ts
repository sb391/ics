import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f6efe7",
        paper: "#fffaf5",
        ink: "#231f20",
        clay: "#a9522b",
        ember: "#d46d36",
        moss: "#5f7051",
        mist: "#d9d0c8",
        slate: "#5c5a57"
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        display: ["var(--font-fraunces)", "serif"]
      },
      boxShadow: {
        soft: "0 18px 60px rgba(35, 31, 32, 0.08)",
        panel: "0 24px 80px rgba(72, 39, 24, 0.12)"
      },
      backgroundImage: {
        "warm-radial":
          "radial-gradient(circle at top left, rgba(236, 198, 160, 0.38), transparent 34%), radial-gradient(circle at bottom right, rgba(208, 120, 69, 0.16), transparent 30%)"
      }
    }
  },
  plugins: []
};

export default config;
