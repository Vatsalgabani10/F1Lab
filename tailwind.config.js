/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#fff4f0",
        ink: "#111111",
        muted: "#5f5f5f",
        line: "#e8d3cd",
        panel: "#ffffff",
        soft: "#ffe7e1",
        brand: "#d71920",
        brandDark: "#a50f19"
      },
      boxShadow: {
        panel: "0 20px 60px rgba(126, 25, 34, 0.08)"
      },
      backgroundImage: {
        grid:
          "linear-gradient(to right, rgba(17,17,17,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.04) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};
