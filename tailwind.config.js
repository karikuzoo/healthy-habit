const { colors } = require("./src/theme/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors,
      fontSize: {
        "2xs": ["10px", "14px"],
        stat: ["32px", "38px"],
        score: ["40px", "46px"],
        timer: ["64px", "70px"],
      },
      borderRadius: {
        card: "20px",
      },
    },
  },
  plugins: [],
};
