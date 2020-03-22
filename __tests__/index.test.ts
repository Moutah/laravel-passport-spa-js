/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock('../src/utils/crypto');

import 'fast-text-encoding';
import { LaravelPassportClient } from './../src/models/LaravelPassportClient';
import createLaravelPassportClient from './../src/index';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

const LARAVEL_PASSPORT_CLIENT_OPTIONS = {
  client_id: 'the client id',
  redirect_uri: 'the redirect uri',
  domainUrl: 'https://www.url.com',
};

const setup = async (): Promise<any> => {
  // mock utils crypto
  const crypto = require('../src/utils/crypto');
  crypto.validateCrypto.mockReturnValue();

  return { crypto };
};

describe('index.ts', () => {
  describe('createLaravelPassportClient', () => {
    it('creates a Laravel Passport Client', async () => {
      const client = await createLaravelPassportClient(LARAVEL_PASSPORT_CLIENT_OPTIONS);

      expect(client).toBeInstanceOf(LaravelPassportClient);
    });

    it('should call `utils.validateCrypto`', async () => {
      const { crypto } = await setup();
      expect(crypto.validateCrypto).toHaveBeenCalled();
    });
  });
});
