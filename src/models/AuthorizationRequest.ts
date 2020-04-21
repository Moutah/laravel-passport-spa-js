import { AuthorizationRequestOptions } from '../interfaces/AuthorizationRequestOptions';
import { encodeState, bufferToBase64UrlEncoded } from '../utils/base64';
import { createRandomString, sha256 } from '../utils/crypto';
import { createQueryParams } from '../utils/queryString';
import { STORAGE_PREFIX } from '../constants';

export class AuthorizationRequest implements AuthorizationRequestOptions {
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_verifier: string;
  readonly code_challenge_method: string = 'S256';
  readonly response_type: string = 'code';
  private code_challenge?: string;

  /**
   * Represent an authorization request that is sent to the authentication server. The request
   * is composed of static values given in the `options` parameter and dynamic, random values for
   * `state` and `code_verifier` which are set upon creation.
   * @param options
   */
  constructor(options: AuthorizationRequestOptions) {
    this.client_id = options.client_id;
    this.redirect_uri = options.redirect_uri;
    this.scope = options.scope;
    this.state = encodeState(createRandomString());
    this.code_verifier = createRandomString();
  }

  /**
   * Returns the request parameters as an object.
   */
  async parameters(): Promise<any> {
    const codeChallenge = await this.getCodeChallenge();

    return {
      client_id: this.client_id,
      redirect_uri: this.redirect_uri,
      response_type: this.response_type,
      scope: this.scope,
      state: this.state,
      code_challenge: codeChallenge,
      code_challenge_method: this.code_challenge_method,
    };
  }

  /**
   * Returns the request parameters as a query string.
   */
  async asQueryString(): Promise<string> {
    const params = await this.parameters();
    return createQueryParams(params);
  }

  /**
   * Calculate the code challenge base on `code_verifier`'s value or get it from cache.
   */
  async getCodeChallenge(): Promise<string> {
    // calculate code challenge
    if (!this.code_challenge) {
      const code_challengeBuffer = await sha256(this.code_verifier);
      this.code_challenge = bufferToBase64UrlEncoded(code_challengeBuffer);
    }

    return this.code_challenge;
  }

  /**
   * Store the code verifier and requested scope in the client's storage.
   */
  storeState(): void {
    window.localStorage.setItem(
      STORAGE_PREFIX + this.state,
      JSON.stringify({ v: this.code_verifier, s: this.scope }),
    );
  }

  /**
   * Remove the code verifier and requested scope from the client's storage.
   */
  clearState(): void {
    window.localStorage.removeItem(STORAGE_PREFIX + this.state);
  }
}
