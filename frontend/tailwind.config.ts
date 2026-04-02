import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
    darkMode: ["class"],
    content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: { "2xl": "1400px" },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
                secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
                destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
                warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
                muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
                accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
                popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
                card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                // ── existing ──────────────────────────────────────
                "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
                "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
                "fade-in":        { "0%": { opacity: "0", transform: "translateY(10px)" },  "100%": { opacity: "1", transform: "translateY(0)" } },
                "slide-in-left":  { "0%": { opacity: "0", transform: "translateX(-20px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
                "pulse-glow":     { "0%, 100%": { boxShadow: "0 0 5px hsl(155 100% 50% / 0.2)" }, "50%": { boxShadow: "0 0 20px hsl(155 100% 50% / 0.4)" } },
                "glitch":         { "0%, 100%": { transform: "translate(0)" }, "20%": { transform: "translate(-2px, 2px)" }, "40%": { transform: "translate(-2px, -2px)" }, "60%": { transform: "translate(2px, 2px)" }, "80%": { transform: "translate(2px, -2px)" } },
                "scanline":       { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(100%)" } },

                // ── gamification ──────────────────────────────────
                "xp-float": {
                    "0%":   { opacity: "1", transform: "translateY(0) scale(1)" },
                    "60%":  { opacity: "1", transform: "translateY(-48px) scale(1.15)" },
                    "100%": { opacity: "0", transform: "translateY(-80px) scale(0.9)" },
                },
                "xp-bar-fill": {
                    "0%":   { transform: "scaleX(0)" },
                    "100%": { transform: "scaleX(1)" },
                },
                "rank-up": {
                    "0%":   { opacity: "0", transform: "scale(0.5) rotate(-10deg)" },
                    "60%":  { opacity: "1", transform: "scale(1.2) rotate(3deg)" },
                    "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
                },
                "boss-pulse": {
                    "0%, 100%": { boxShadow: "0 0 10px hsl(0 84% 60% / 0.3), inset 0 0 10px hsl(0 84% 60% / 0.05)" },
                    "50%":      { boxShadow: "0 0 40px hsl(0 84% 60% / 0.7), inset 0 0 20px hsl(0 84% 60% / 0.15)" },
                },
                "combo-burst": {
                    "0%":   { transform: "scale(1)" },
                    "30%":  { transform: "scale(1.4)" },
                    "60%":  { transform: "scale(0.9)" },
                    "100%": { transform: "scale(1)" },
                },
                "streak-flame": {
                    "0%, 100%": { transform: "scaleY(1) skewX(0deg)", filter: "brightness(1)" },
                    "33%":      { transform: "scaleY(1.1) skewX(-3deg)", filter: "brightness(1.3)" },
                    "66%":      { transform: "scaleY(0.95) skewX(3deg)", filter: "brightness(1.1)" },
                },
                "mission-slide-in": {
                    "0%":   { opacity: "0", transform: "translateX(100%) scale(0.95)" },
                    "100%": { opacity: "1", transform: "translateX(0) scale(1)" },
                },
                "achievement-drop": {
                    "0%":   { opacity: "0", transform: "translateY(-60px) scale(0.8)" },
                    "50%":  { opacity: "1", transform: "translateY(8px) scale(1.05)" },
                    "70%":  { transform: "translateY(-4px) scale(0.98)" },
                    "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
                },
                "shield-spin": {
                    "0%":   { transform: "rotateY(0deg)" },
                    "100%": { transform: "rotateY(360deg)" },
                },
                "progress-pulse": {
                    "0%, 100%": { opacity: "1" },
                    "50%":      { opacity: "0.6" },
                },
                "phase-transition": {
                    "0%":   { opacity: "0.5", transform: "scale(0.95)" },
                    "100%": { opacity: "1",   transform: "scale(1)" },
                },
                "neon-border": {
                    "0%, 100%": { borderColor: "hsl(155 100% 50% / 0.4)" },
                    "50%":      { borderColor: "hsl(155 100% 50% / 1)" },
                },
                "data-stream": {
                    "0%":   { transform: "translateX(-100%)", opacity: "0" },
                    "10%":  { opacity: "1" },
                    "90%":  { opacity: "1" },
                    "100%": { transform: "translateX(100%)", opacity: "0" },
                },
                "particle-burst": {
                    "0%":   { transform: "scale(0)", opacity: "1" },
                    "100%": { transform: "scale(3)", opacity: "0" },
                },
            },
            animation: {
                // ── existing ──────────────────────────────────────
                "accordion-down":  "accordion-down 0.2s ease-out",
                "accordion-up":    "accordion-up 0.2s ease-out",
                "fade-in":         "fade-in 0.4s ease-out",
                "slide-in-left":   "slide-in-left 0.3s ease-out",
                "pulse-glow":      "pulse-glow 2s ease-in-out infinite",
                "glitch":          "glitch 0.4s ease-in-out infinite alternate",
                "scanline":        "scanline 8s linear infinite",

                // ── gamification ──────────────────────────────────
                "xp-float":        "xp-float 1.4s ease-out forwards",
                "xp-bar-fill":     "xp-bar-fill 1s ease-out forwards",
                "rank-up":         "rank-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                "boss-pulse":      "boss-pulse 1.8s ease-in-out infinite",
                "combo-burst":     "combo-burst 0.4s ease-out",
                "streak-flame":    "streak-flame 0.8s ease-in-out infinite",
                "mission-slide":   "mission-slide-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
                "achievement-drop":"achievement-drop 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
                "shield-spin":     "shield-spin 3s linear infinite",
                "progress-pulse":  "progress-pulse 2s ease-in-out infinite",
                "phase-transition":"phase-transition 0.4s ease-out forwards",
                "neon-border":     "neon-border 2s ease-in-out infinite",
                "data-stream":     "data-stream 2s linear infinite",
                "particle-burst":  "particle-burst 0.8s ease-out forwards",
            },
        },
    },
    plugins: [tailwindcssAnimate],
} satisfies Config;
