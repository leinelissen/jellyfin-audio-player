module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-navigation|i18n-js|make-plural)/)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
