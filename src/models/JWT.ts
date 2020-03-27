import { urlDecodeB64 } from '../utils/base64';
import { DEFAULT_LEEWAY } from '../constants';

export class JWT {
  raw: string;
  client_id: number;
  token_id: string;
  issued_at: Date;
  expiration: Date;
  not_before: Date;
  user_id: number;
  scopes: string[];

  /**
   * Represent a JSON Web Token. Values are decoded from given `encodedToken` string for easier
   * usage.
   * @param encodedToken
   */
  constructor(encodedToken: string) {
    this.raw = encodedToken;

    const parts = encodedToken.split('.');
    const [header, payload, signature] = parts;

    // invalid format
    if (parts.length !== 3 || !header || !payload || !signature) {
      throw new Error('Token could not be decoded');
    }

    // parse payload
    const payloadJSON = JSON.parse(urlDecodeB64(payload));

    // set attributes
    this.client_id = parseInt(payloadJSON.aud);
    this.token_id = payloadJSON.jti;
    this.issued_at = new Date(payloadJSON.iat * 1000);
    this.expiration = new Date((payloadJSON.exp - DEFAULT_LEEWAY) * 1000);
    this.not_before = new Date(payloadJSON.nbf * 1000);
    this.user_id = parseInt(payloadJSON.sub);
    this.scopes = payloadJSON.scopes;
  }

  /**
   * Returns `false` if the JWT's expiration date is in the future, `true` otherwise.
   */
  isExpired(): boolean {
    return new Date() > this.expiration;
  }

  /**
   * Get the scopes of the token as a string where each scope is separated by a space. If no scopes
   * are present, the general scope `'*'` is returned.
   */
  scopesAsString(): string {
    return this.scopes.length > 0 ? this.scopes.join(' ') : '*';
  }
}
