import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)", "surface-dim": "var(--surface-dim)", "surface-bright": "var(--surface-bright)",
        "surface-container-lowest": "var(--surface-container-lowest)", "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)", "surface-container-high": "var(--surface-container-high)",
        "surface-container-highest": "var(--surface-container-highest)", "on-surface": "var(--on-surface)",
        "on-surface-variant": "var(--on-surface-variant)", "inverse-surface": "var(--inverse-surface)",
        "inverse-on-surface": "var(--inverse-on-surface)", outline: "var(--outline)", "outline-variant": "var(--outline-variant)",
        "surface-tint": "var(--surface-tint)", primary: "var(--primary)", "on-primary": "var(--on-primary)",
        "primary-container": "var(--primary-container)", "on-primary-container": "var(--on-primary-container)",
        "inverse-primary": "var(--inverse-primary)", secondary: "var(--secondary)", "on-secondary": "var(--on-secondary)",
        "secondary-container": "var(--secondary-container)", "on-secondary-container": "var(--on-secondary-container)",
        tertiary: "var(--tertiary)", "on-tertiary": "var(--on-tertiary)", "tertiary-container": "var(--tertiary-container)",
        "on-tertiary-container": "var(--on-tertiary-container)", error: "var(--error)", "on-error": "var(--on-error)",
        "error-container": "var(--error-container)", "on-error-container": "var(--on-error-container)",
        "primary-fixed": "var(--surface-container-highest)", "primary-fixed-dim": "var(--surface-dim)",
        "on-primary-fixed": "var(--on-surface)", "on-primary-fixed-variant": "var(--on-surface-variant)",
        "secondary-fixed": "var(--surface-container-high)", "secondary-fixed-dim": "var(--surface-container)",
        "on-secondary-fixed": "var(--on-surface)", "on-secondary-fixed-variant": "var(--on-surface-variant)",
        "tertiary-fixed": "var(--surface-container-highest)", "tertiary-fixed-dim": "var(--surface-dim)",
        "on-tertiary-fixed": "var(--on-surface)", "on-tertiary-fixed-variant": "var(--on-surface-variant)",
        background: "var(--background)", "on-background": "var(--on-background)", "surface-variant": "var(--surface-variant)"
      },
      borderRadius: { DEFAULT: "12px", lg: "16px", xl: "24px", full: "9999px" },
      spacing: {
        unit: "4px", gutter: "24px", margin: "48px", "container-max": "1440px",
        "stack-lg": "64px", "stack-md": "32px", "stack-sm": "16px"
      },
      fontFamily: {
        "headline-md": ["'DM Sans'"], "headline-lg": ["'DM Sans'"],
        "label-caps": ["JetBrains Mono"], "display-xl": ["'DM Sans'"],
        "body-md": ["Inter"], "body-lg": ["Inter"]
      },
      fontSize: {
        "headline-md": ["32px", {lineHeight:"1.2", letterSpacing:"-0.01em", fontWeight:"700"}],
        "headline-lg": ["48px", {lineHeight:"1.1", letterSpacing:"-0.02em", fontWeight:"700"}],
        "label-caps": ["12px", {lineHeight:"1.0", letterSpacing:"0.1em", fontWeight:"700"}],
        "display-xl": ["80px", {lineHeight:"1.0", letterSpacing:"-0.04em", fontWeight:"700"}],
        "body-md": ["16px", {lineHeight:"1.6", letterSpacing:"0", fontWeight:"400"}],
        "body-lg": ["18px", {lineHeight:"1.6", letterSpacing:"0", fontWeight:"400"}]
      }
    }
  },
  plugins: [forms, containerQueries],
};
