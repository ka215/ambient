/** @type {import('tailwindcss').Config} */
// Note: TailwindCSS v4 no longer requires `mode: 'jit'` or `variants` fields.
// This file is kept for plugin/config declarations and legacy content paths.
module.exports = {
  content: [
      "./src/**/*.js",
      "./views/**/*.{php,html}",
      "./dist/*.js",
  ],
  // keep class-based dark mode; ensure CSS entry uses @config to load this file
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [
    require('flowbite/plugin'),
  ],
}
