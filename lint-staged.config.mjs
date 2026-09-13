/** @type {import('lint-staged').Configuration} */
const config = {
  "*.{js,jsx,ts,tsx}": ["eslint"],
  "*.{js,jsx,ts,tsx,json,css,md}": ["prettier --write"],
};

export default config;
