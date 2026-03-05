/** @type {import('tailwindcss').Config} */
export const content = [
  "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
];
export const theme = {
  extend: {
    fontFamily: {
      mono: ['"JetBrains Mono"', '"Fira Code"', "ui-monospace", "monospace"],
    },
    colors: {
      surface: {
        0: "#06060f",
        1: "#0a0a16",
        2: "#0e0e1c",
        3: "#131324",
      },
      ink: {
        dim: "rgba(255,255,255,0.06)",
        subtle: "rgba(255,255,255,0.12)",
        muted: "rgba(255,255,255,0.25)",
        soft: "rgba(255,255,255,0.45)",
        base: "rgba(255,255,255,0.75)",
        bright: "rgba(255,255,255,0.92)",
      },
    },
    backgroundImage: {
      "grid-lines": `linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),
                       linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)`,
    },
    backgroundSize: {
      "grid-lines": "40px 40px",
    },
    animation: {
      "fade-up": "fadeUp 0.4s ease forwards",
      "glow-pulse": "glowPulse 3s ease-in-out infinite",
      "spin-slow": "spin 1s linear infinite",
    },
    keyframes: {
      fadeUp: {
        from: { opacity: 0, transform: "translateY(16px)" },
        to: { opacity: 1, transform: "translateY(0)" },
      },
      glowPulse: {
        "0%,100%": { opacity: 0.5 },
        "50%": { opacity: 1 },
      },
    },
  },
};
export const plugins = [];
