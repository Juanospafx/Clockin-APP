/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",               // ← ¡¡¡ESTO ES CLAVE!!!
    "./src/**/*.{js,ts,jsx,tsx}", // ← esto ya estaba bien
  ],
  theme: {
    extend: {
      colors: {
        "Icon-Default-Default": "#1e1e1e",
        white: "#fff",
        gainsboro: "#e0e0e0",
        gray: {
          100: "#828282",
          200: "rgba(0, 0, 0, 0)",
        },
        "Text-Primary": "#000",
        whitesmoke: "#f7f7f7",
        darkslategray: "#454545",
      },
      fontFamily: {
        "Small-text": "Inter",
      },
      fontSize: {
        base: "1rem",
        "21xl": "2.5rem",
        smi: "0.813rem",
        inherit: "inherit",
      },
    },
  },
  plugins: [],
};
