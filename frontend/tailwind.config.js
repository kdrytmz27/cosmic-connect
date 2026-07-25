/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "on-error-container": "#ffdad6",
        "error": "#ffb4ab",
        "primary": "#ddb8ff",
        "surface-tint": "#ddb8ff",
        "primary-container": "#9333ea",
        "inverse-primary": "#861fdd",
        "on-secondary-container": "#5a4100",
        "on-primary-fixed": "#2c0051",
        "on-error": "#690005",
        "secondary-container": "#e3aa00",
        "outline-variant": "#4d4354",
        "on-surface": "#dae2fd",
        "secondary": "#ffc640",
        "primary-fixed-dim": "#ddb8ff",
        "on-secondary-fixed": "#261a00",
        "secondary-fixed-dim": "#f9bd22",
        "outline": "#988ca0",
        "surface-container-highest": "#2d3449",
        "tertiary-fixed": "#62fae3",
        "background": "#0b1326",
        "on-tertiary-container": "#91ffec",
        "surface-container-lowest": "#060e20",
        "primary-fixed": "#f0dbff",
        "on-secondary-fixed-variant": "#5c4300",
        "on-tertiary": "#003731",
        "secondary-fixed": "#ffdf9f",
        "on-tertiary-fixed": "#00201c",
        "on-primary-container": "#f6e6ff",
        "on-secondary": "#402d00",
        "tertiary": "#3cddc7",
        "inverse-on-surface": "#283044",
        "surface-variant": "#2d3449",
        "on-primary-fixed-variant": "#6800b4",
        "surface-dim": "#0b1326",
        "on-background": "#dae2fd",
        "tertiary-container": "#00786b",
        "surface-bright": "#31394d",
        "inverse-surface": "#dae2fd",
        "surface": "#0b1326",
        "tertiary-fixed-dim": "#3cddc7",
        "surface-container-low": "#131b2e",
        "on-surface-variant": "#cfc2d7",
        "on-primary": "#490080",
        "surface-container-high": "#222a3d",
        "on-tertiary-fixed-variant": "#005047",
        "error-container": "#93000a",
        "surface-container": "#171f33"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "element-gap": "12px",
        "container-margin": "20px",
        "gutter": "16px",
        "section-gap": "40px"
      },
      "fontFamily": {
        "label-sm": ["Inter", "sans-serif"],
        "headline-md": ["Montserrat", "sans-serif"],
        "headline-lg-mobile": ["Montserrat", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "headline-lg": ["Montserrat", "sans-serif"],
        "headline-xl": ["Montserrat", "sans-serif"],
        "body-md": ["Inter", "sans-serif"]
      },
      "fontSize": {
        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "500" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "headline-lg-mobile": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "600" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "headline-xl": ["40px", { "lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }]
      }
    },
  },
  plugins: [],
}
