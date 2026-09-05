/** @type {import('tailwindcss').Config} */
module.exports = {
  // The app forces its palette with data-theme on <html>; without this the
  // `dark:` variants follow the OS instead and render light text on the dark UI.
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#f5a623',
      },
    },
  },
  plugins: [],
}
