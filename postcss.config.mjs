/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}, // Ensure browser compatibility
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          minifySelectors: true,
          minifyParams: true,
          cssDeclarationSorter: false,
        }],
      },
    }),
  },
  parser: 'postcss-safe-parser',
};

export default config;
