/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: [
      "./src/**/*.js",
      "./views/**/*.{php,html}",
      "./dist/*.js",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin'),
  ],
}
