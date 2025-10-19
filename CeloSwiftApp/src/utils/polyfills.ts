// Polyfills for React Native compatibility
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Crypto polyfill
import CryptoJS from 'react-native-crypto-js';

// Buffer polyfill
import { Buffer } from '@craftzdog/react-native-buffer';

// Additional polyfills
import 'os-browserify';
import 'path-browserify';
import 'util';

// Global polyfills
if (typeof global !== 'undefined') {
  // @ts-ignore
  global.Buffer = Buffer;
  // @ts-ignore
  global.crypto = {
    getRandomValues: (array: any) => {
      const randomValues = new Uint8Array(array.length);
      for (let i = 0; i < array.length; i++) {
        randomValues[i] = Math.floor(Math.random() * 256);
      }
      return randomValues;
    },
    subtle: {
      digest: async (algorithm: string, data: ArrayBuffer) => {
        // Simple SHA-256 implementation using CryptoJS
        const wordArray = CryptoJS.lib.WordArray.create(data);
        const hash = CryptoJS.SHA256(wordArray);
        return hash.toArrayBuffer();
      }
    }
  };
}

// TextEncoder/TextDecoder polyfills
if (typeof global.TextEncoder === 'undefined') {
  // @ts-ignore
  global.TextEncoder = class TextEncoder {
    encode(input: string): Uint8Array {
      return Buffer.from(input, 'utf8');
    }
  };
}

if (typeof global.TextDecoder === 'undefined') {
  // @ts-ignore
  global.TextDecoder = class TextDecoder {
    decode(input: Uint8Array): string {
      return Buffer.from(input).toString('utf8');
    }
  };
}

export default {};
