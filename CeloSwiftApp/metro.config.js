const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for polyfills
config.resolver.alias = {
  crypto: 'react-native-crypto-js',
  stream: 'readable-stream',
  buffer: '@craftzdog/react-native-buffer',
  os: 'os-browserify',
  path: 'path-browserify',
  util: 'util',
};

// Add polyfills to resolver
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure React Native modules are resolved properly
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Configure transformer for better compatibility
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer.minifierConfig,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;