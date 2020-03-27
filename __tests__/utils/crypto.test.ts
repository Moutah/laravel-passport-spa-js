import 'fast-text-encoding';
import {
  getCrypto,
  getCryptoSubtle,
  validateCrypto,
  sha256,
  createRandomString,
} from '../../src/utils/crypto';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

describe('utils.crypto', () => {
  describe('getCrypto', () => {
    it('should use msCrypto when window.crypto is unavailable', () => {
      global.crypto = undefined;
      global.msCrypto = 'ms';

      const theCrypto = getCrypto();
      expect(theCrypto).toBe('ms');
    });
    it('should use window.crypto when available', () => {
      global.crypto = 'window';
      global.msCrypto = 'ms';

      const theCrypto = getCrypto();
      expect(theCrypto).toBe('window');
    });
  });

  describe('getCryptoSubtle', () => {
    it('should use crypto.webkitSubtle when available', () => {
      global.crypto = { subtle: undefined, webkitSubtle: 'webkit' };

      const theSubtle = getCryptoSubtle();
      expect(theSubtle).toBe('webkit');
    });
    it('should use crypto.subtle when available', () => {
      global.crypto = { subtle: 'window', webkitSubtle: 'webkit' };

      const theSubtle = getCryptoSubtle();
      expect(theSubtle).toBe('window');
    });
    it('should use msCrypto.subtle when available', () => {
      global.crypto = undefined;
      global.msCrypto = { subtle: 'ms' };

      const cryptoSubtle = getCryptoSubtle();
      expect(cryptoSubtle).toBe('ms');
    });
  });

  describe('validateCrypto', () => {
    it('should throw error if crypto is unavailable', () => {
      global.crypto = undefined;
      global.msCrypto = undefined;

      expect(validateCrypto).toThrowError(
        'For security reasons, `window.crypto` is required to run `laravel-passport-spa-js`.',
      );
    });

    it('should throw error if crypto.subtle is undefined', () => {
      global.crypto = {};
      global.msCrypto = {};

      expect(validateCrypto).toThrowError(`
      laravel-passport-spa-js must run on a secure origin.
      See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin 
      for more information.
    `);
    });

    it("shouldn't throw error if crypto.subtle is defined", () => {
      global.crypto = { subtle: {} };
      global.msCrypto = { subtle: {} };

      expect(validateCrypto).not.toThrow();
    });
  });

  describe('sha256', () => {
    it('generates a digest of the given data', async () => {
      global.msCrypto = undefined;
      global.crypto = {
        subtle: {
          digest: jest.fn((alg, encoded) => {
            expect(alg).toMatchObject({ name: 'SHA-256' });
            expect(Array.from(encoded)).toMatchObject([116, 101, 115, 116]);
            return new Promise(res => res(true));
          }),
        },
      };

      const result = await sha256('test');
      expect(result).toBe(true);
    });

    it('handles ie11 digest.result scenario', () => {
      global.msCrypto = {};

      const digestResult: any = {
        oncomplete: null,
      };

      global.crypto = {
        subtle: {
          digest: jest.fn(() => {
            return digestResult;
          }),
        },
      };

      const sha = sha256('test').then(r => {
        expect(r).toBe(true);
      });

      digestResult.oncomplete({ target: { result: true } });

      return sha;
    });

    it('handles ie11 digest.result error scenario', () => {
      global.msCrypto = {};

      const digestResult: any = {
        onerror: null,
      };

      global.crypto = {
        subtle: {
          digest: jest.fn(() => {
            return digestResult;
          }),
        },
      };

      const sha = sha256('test').catch(e => {
        expect(e).toBe('An error occurred');
      });

      digestResult.onerror({ error: 'An error occurred' });

      return sha;
    });

    it('handles ie11 digest.result abort scenario', () => {
      global.msCrypto = {};

      const digestResult: any = {
        onabort: null,
      };

      global.crypto = {
        subtle: {
          digest: jest.fn(() => {
            return digestResult;
          }),
        },
      };

      const sha = sha256('test').catch(e => {
        expect(e).toBe('The digest operation was aborted');
      });

      digestResult.onabort();

      return sha;
    });
  });

  describe('createRandomString', () => {
    it('creates random string based on crypto.getRandomValues', () => {
      global.crypto = {
        getRandomValues: (): number[] => [1, 5, 10, 15, 100],
      };
      expect(createRandomString()).toBe('15AFY');
    });
    it('creates random string with a length between 43 and 128', () => {
      global.crypto = {
        getRandomValues: (a: Uint8Array): Array<number> => Array(a.length).fill(0),
      };
      const result = createRandomString();
      expect(result.length).toBeGreaterThanOrEqual(43);
      expect(result.length).toBeLessThanOrEqual(128);
    });
  });
});
