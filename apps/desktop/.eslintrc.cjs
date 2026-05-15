module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  settings: {
    next: {
      rootDir: 'src/renderer',
    },
  },
  rules: {
    '@next/next/no-page-custom-font': 'off',
    '@next/next/no-html-link-for-pages': 'off',
  },
};
