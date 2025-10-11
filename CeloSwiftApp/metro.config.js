const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add comprehensive crypto polyfills for Node.js modules
config.resolver.alias = {
  crypto: 'react-native-crypto-js',
  stream: 'readable-stream',
  buffer: '@craftzdog/react-native-buffer',
  util: 'util',
  assert: 'assert',
  os: 'os-browserify/browser',
  path: 'path-browserify',
  fs: false,
  net: false,
  tls: false,
};

// Ensure proper module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
