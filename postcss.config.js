export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // CSS optimization plugins
    ...(process.env.NODE_ENV === 'production' && {
      'cssnano': {
        preset: ['default', {
          discardComments: {
            removeAll: true,
          },
          normalizeWhitespace: true,
          minifyFontValues: true,
          minifyGradients: true,
          reduceTransforms: true,
          svgo: true,
        }],
      },
    }),
  },
}
