/** @type {import('postcss').Config} */
export default {
  plugins: {
    "@tailwindcss/postcss": {
      config: "./tailwind.config.js",
    },
    autoprefixer: {},
  },
};
