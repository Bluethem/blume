/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#E53E3E",
        "background-light": "#F7FAFC",
        "background-dark": "#1A202C",
        "card-light": "#FFFFFF",
        "card-dark": "#2D3748",
        "text-primary-light": "#2D3748",
        "text-primary-dark": "#F7FAFC",
        "text-secondary-light": "#718096",
        "text-secondary-dark": "#A0AEC0",
        "border-light": "#E2E8F0",
        "border-dark": "#4A5568",
        "error-text": "#C53030",
        "error-bg": "#FED7D7",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}