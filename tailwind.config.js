/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: [
      "./src/**/*.js",
      "./views/**/*.{php,html}",
      "./dist/*.js",
  ],
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
