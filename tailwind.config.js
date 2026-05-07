/** @type {import('tailwindcss').Config} */
// Note: TailwindCSS v4 no longer requires `mode: 'jit'` or `variants` fields.
// This file is kept for plugin/config declarations and legacy content paths.
module.exports = {
  content: [
      "./src/**/*.js",
      "./src/**/*.ts",
      "./views/**/*.{php,html}",
      "./dist/**/*.js",
  ],
  safelist: [
    // Opacity variants for carousel button styling
    { pattern: /^bg-gray-900\/\d+$/ },
    { pattern: /^dark:bg-gray-100\/\d+$/ },
    { pattern: /^group-hover:bg-gray-900\/\d+$/ },
    { pattern: /^dark:group-hover:bg-gray-100\/\d+$/ },
    'bg-gray-900/50', 'bg-gray-900/70', 'bg-gray-900/85',
    'bg-gray-950/60',
    'backdrop-blur-sm',
    'dark:bg-gray-100/35', 'dark:bg-gray-100/55',
    'group-hover:bg-gray-900/85',
    'dark:group-hover:bg-gray-100/55',
  ],
  darkMode: "class",
  theme: {
    extend: {
      opacity: {
        5: '0.05',
        10: '0.1',
        15: '0.15',
        20: '0.2',
        25: '0.25',
        30: '0.3',
        35: '0.35',
        40: '0.4',
        45: '0.45',
        50: '0.5',
        55: '0.55',
        60: '0.6',
        65: '0.65',
        70: '0.7',
        75: '0.75',
        80: '0.8',
        85: '0.85',
        90: '0.9',
        95: '0.95',
      }
    },
  },
  plugins: [
    require('flowbite/plugin'),
  ],
}
