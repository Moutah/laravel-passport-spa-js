// import LaravelPassportClientOptions from "./models/LaravelPassportClientOptions";
// import { validateCrypto } from "./utils";

import { validateCrypto } from './utils/crypto';
import { LaravelPassportClient } from './models/LaravelPassportClient';
import { LaravelPassportClientOptions } from './interfaces/LaravelPassportClientOptions';

// export default async function createAuth0Client(options: LaravelPassportClientOptions) {
//   validateCrypto();

//   const auth0 = new Auth0Client(options);

//   if (!ClientStorage.get('auth0.is.authenticated')) {
//     return auth0;
//   }
//   try {
//     await auth0.getTokenSilently({
//       audience: options.audience,
//       scope: options.scope,
//       ignoreCache: true
//     });
//   } catch (error) {
//     if (error.error !== 'login_required') {
//       throw error;
//     }
//   }
//   return auth0;
// }

// export default (* as utils) from './utils'

export default async function createLaravelPassportClient(
  options: LaravelPassportClientOptions,
): Promise<LaravelPassportClient> {
  // check that browser has crypto module
  validateCrypto();

  // make client
  const client = new LaravelPassportClient(options);

  return client;
}
