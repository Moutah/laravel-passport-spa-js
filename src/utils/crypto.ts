/**
 * Get the browser's crypto module.
 */
export const getCrypto = (): Crypto => {
  //ie 11.x uses msCrypto
  return window.crypto || (window as any).msCrypto;
};

/**
 * Get the browser's crypto subtle module.
 */
export const getCryptoSubtle = (): SubtleCrypto => {
  const crypto = getCrypto();
  //safari 10.x uses webkitSubtle
  return crypto.subtle || (crypto as any).webkitSubtle;
};

/**
 * Validate that the browswer has the crypto module.
 */
export const validateCrypto = (): void => {
  if (!getCrypto()) {
    throw new Error(
      'For security reasons, `window.crypto` is required to run `laravel-passport-spa-js`.',
    );
  }
  if (typeof getCryptoSubtle() === 'undefined') {
    throw new Error(`
      laravel-passport-spa-js must run on a secure origin.
      See https://github.com/auth0/auth0-spa-js/blob/master/FAQ.md#why-do-i-get-auth0-spa-js-must-run-on-a-secure-origin 
      for more information.
    `);
  }
};

/**
 * Create a random string containing only alpha-numeric characters (upper and lower case) as well
 * as `-`, `_`, `~` and `.` . Uses `crypto.getRandomValues()` as seed.
 */
export const createRandomString = (): string => {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_~.';
  let random = '';
  const randomValues = Array.from(getCrypto().getRandomValues(new Uint8Array(43)));
  randomValues.forEach(v => (random += charset[v % charset.length]));
  return random;
};

/**
 * Hash the given string using SHA256 algorithm.
 * @param str
 */
export const sha256 = async (str: string): Promise<ArrayBuffer> => {
  const digestOp = getCryptoSubtle().digest({ name: 'SHA-256' }, new TextEncoder().encode(str));

  // msCrypto (IE11) uses the old spec, which is not Promise based
  // https://msdn.microsoft.com/en-us/expression/dn904640(v=vs.71)
  // Instead of returning a promise, it returns a CryptoOperation
  // with a result property in it.
  // As a result, the various events need to be handled in the event that we're
  // working in IE11 (hence the msCrypto check). These events just call resolve
  // or reject depending on their intention.
  if ((window as any).msCrypto) {
    const digestOpMs = digestOp as any;

    return new Promise((res, rej) => {
      digestOpMs.oncomplete = (e: any): void => {
        res(e.target.result);
      };

      digestOpMs.onerror = (e: ErrorEvent): void => {
        rej(e.error);
      };

      digestOpMs.onabort = (): void => {
        rej('The digest operation was aborted');
      };
    });
  }

  return await digestOp;
};
