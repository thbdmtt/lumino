import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          base: "var(--bg-base)",
          elevated: "var(--bg-elevated)",
          overlay: "var(--bg-overlay)",
          glass: "var(--bg-glass)",
        },
        outline: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
        ink: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          inverse: "var(--text-inverse)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          dim: "var(--accent-dim)",
          glow: "var(--accent-glow)",
        },
        success: {
          DEFAULT: "var(--success)",
          dim: "var(--success-dim)",
          ring: "var(--success-ring)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          dim: "var(--warning-dim)",
          ring: "var(--warning-ring)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          dim: "var(--danger-dim)",
          ring: "var(--danger-ring)",
        },
        info: {
          DEFAULT: "var(--info)",
          dim: "var(--info-dim)",
          ring: "var(--info-ring)",
        },
        grade: {
          hard: "var(--grade-hard)",
          ok: "var(--grade-ok)",
          good: "var(--grade-good)",
          perfect: "var(--grade-perfect)",
        },
        deck: {
          1: "var(--deck-1)",
          2: "var(--deck-2)",
          3: "var(--deck-3)",
          4: "var(--deck-4)",
          5: "var(--deck-5)",
          6: "var(--deck-6)",
          7: "var(--deck-7)",
          8: "var(--deck-8)",
        },
      },
      spacing: {
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
        "2xl": "var(--space-2xl)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        accent: "var(--shadow-accent)",
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      fontSize: {
        xs: [
          "var(--text-xs-size)",
          {
            lineHeight: "var(--text-xs-line-height)",
            fontWeight: "var(--text-xs-weight)",
          },
        ],
        sm: [
          "var(--text-sm-size)",
          {
            lineHeight: "var(--text-sm-line-height)",
            fontWeight: "var(--text-sm-weight)",
          },
        ],
        base: [
          "var(--text-base-size)",
          {
            lineHeight: "var(--text-base-line-height)",
            fontWeight: "var(--text-base-weight)",
          },
        ],
        lg: [
          "var(--text-lg-size)",
          {
            lineHeight: "var(--text-lg-line-height)",
            fontWeight: "var(--text-lg-weight)",
          },
        ],
        xl: [
          "var(--text-xl-size)",
          {
            lineHeight: "var(--text-xl-line-height)",
            fontWeight: "var(--text-xl-weight)",
          },
        ],
        "2xl": [
          "var(--text-2xl-size)",
          {
            lineHeight: "var(--text-2xl-line-height)",
            fontWeight: "var(--text-2xl-weight)",
          },
        ],
        "3xl": [
          "var(--text-3xl-size)",
          {
            lineHeight: "var(--text-3xl-line-height)",
            fontWeight: "var(--text-3xl-weight)",
          },
        ],
        "4xl": [
          "var(--text-4xl-size)",
          {
            lineHeight: "var(--text-4xl-line-height)",
            fontWeight: "var(--text-4xl-weight)",
          },
        ],
      },
      letterSpacing: {
        title: "var(--tracking-title)",
        body: "var(--tracking-body)",
        label: "var(--tracking-label)",
      },
      transitionTimingFunction: {
        spring: "var(--ease-spring)",
        smooth: "var(--ease-smooth)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },
      backdropBlur: {
        glass: "12px",
      },
      backgroundImage: {
        "app-canvas":
          "radial-gradient(circle at top, var(--accent-glow), transparent 34%), linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-base) 55%)",
        "surface-sheen":
          "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
