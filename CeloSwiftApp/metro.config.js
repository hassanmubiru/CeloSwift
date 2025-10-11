const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add crypto polyfills
config.resolver.alias = {
  crypto: 'react-native-crypto-js',
  stream: 'readable-stream',
  buffer: '@craftzdog/react-native-buffer',
};

// Add node modules that need to be polyfilled
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
