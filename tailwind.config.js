/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
        display: ["Inter", "Arial", "sans-serif"],
        mono: ["IBM Plex Mono", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        scan: { "0%": { transform: "translateY(-8px)", opacity: "0" }, "15%": { opacity: "1" }, "85%": { opacity: "1" }, "100%": { transform: "translateY(235px)", opacity: "0" } },
        drift: { "0%,100%": { transform: "translate3d(0,0,0) rotate(0deg)" }, "50%": { transform: "translate3d(10px,-14px,0) rotate(2deg)" } },
        pulseSoft: { "0%,100%": { opacity: ".35", transform: "scale(1)" }, "50%": { opacity: ".75", transform: "scale(1.06)" } }
      },
      animation: {
        scan: "scan 4.8s cubic-bezier(.4,0,.2,1) infinite",
        drift: "drift 8s ease-in-out infinite",
        "pulse-soft": "pulseSoft 4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
