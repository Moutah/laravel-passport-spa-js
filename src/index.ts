import { validateCrypto } from './utils/crypto';
import { LaravelPassportClient } from './models/LaravelPassportClient';
import { LaravelPassportClientOptions } from './interfaces/LaravelPassportClientOptions';

export default function createLaravelPassportClient(
  options: LaravelPassportClientOptions,
): LaravelPassportClient {
  // check that browser has crypto module
  validateCrypto();

  // make client
  const client = new LaravelPassportClient(options);

  return client;
}
