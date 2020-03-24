import {
  DEFAULT_SCOPE,
  DEFAULT_OAUTH_PREFIX,
  DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
} from '../constants';
import { AuthorizationRequest } from './AuthorizationRequest';
import { AuthorizationRequestOptions } from '../interfaces/AuthorizationRequestOptions';
import { LaravelPassportClientOptions } from '../interfaces/LaravelPassportClientOptions';
import { parseQueryResult } from '../utils/queryString';
import { Authorization } from './Authorization';
import { getJSON, cleanUrl } from '../utils/xhr';
import { JWT } from './JWT';
import { AuthorizationSignature } from '../interfaces/AuthorizationSignature';

/*
TODO
isSignedIn
getSignedInUserId
getTokenExpiration
getTokenScopes
*/

export class LaravelPassportClient implements LaravelPassportClientOptions {
  domain: string;
  client_id: string;
  redirect_uri: string;
  private _token?: JWT;

  private _oauthPrefix?: string;
  get oauthPrefix(): string {
    return this._oauthPrefix || DEFAULT_OAUTH_PREFIX;
  }
  set oauthPrefix(value: string) {
    this._oauthPrefix = value;
  }

  private _scope?: string;
  get scope(): string {
    return this._scope || DEFAULT_SCOPE;
  }
  set scope(value: string) {
    this._scope = value;
  }

  private _authorizeTimeoutInSeconds?: number;
  get authorizeTimeoutInSeconds(): number {
    return this._authorizeTimeoutInSeconds || DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS;
  }
  set authorizeTimeoutInSeconds(value: number) {
    this._authorizeTimeoutInSeconds = value;
  }

  /**
   * Build Laravel Passport Client based on given options.
   * @param options
   */
  constructor(options: LaravelPassportClientOptions) {
    // madatory
    this.domain = options.domain;
    this.client_id = options.client_id;
    this.redirect_uri = options.redirect_uri;

    // optional
    this._oauthPrefix = options.oauthPrefix;
    this._scope = options.scope;
    this._authorizeTimeoutInSeconds = options.authorizeTimeoutInSeconds;

    // internal
    this._token = undefined;
  }

  /**
   * Get the token this client has in cache.
   */
  getToken(): string | null {
    return this._token ? this._token.raw : null;
  }

  /**
   * Cache the token for this client.
   * @param token
   */
  signIn(token: JWT): void {
    this._token = token;
  }

  /**
   * Remove the cached token.
   */
  signOut(): void {
    this._token = undefined;
  }

  /**
   * ```js
   * await lpClient.loginWithRedirect(scope);
   * ```
   *
   * Redirect to the authorize URL (`'/oauth/authorize'` by default) with appropriate
   * AuthorizeParameters. If provided, the given scope value will override the client's
   * default scope.
   * @param {?string} scope
   */
  async loginWithRedirect(scope?: string): Promise<void> {
    const authorizeParameters = this.getAuthorizeParameters(scope);
    const url = await this.buildAuthorizeUrl(authorizeParameters);

    // store authorize parameter's code verifier
    authorizeParameters.storeState();

    // send the user to the authentication url
    window.location.assign(url);
  }

  /**
   * ```js
   * await lpClient.hanhandleRedirectCallback();
   * ```
   *
   * Extract the code returned in the query string, build the Authorization Signature and calls
   * `exchangeAuthorizationForToken` with it. Returns `true` if a token is obtained, `false`
   * otherwise.
   */
  async handleRedirectCallback(): Promise<boolean> {
    const queryString = window.location.search.substr(1);

    // nothing returned
    if (queryString.length === 0) {
      throw new Error('No query response parameters found.');
    }

    // parse query
    const { code, state } = parseQueryResult(queryString);

    try {
      // create authorization
      const authorization = new Authorization({ code, state });

      // attempt to sign in with authorization
      return await this.signInWithAuthorization(authorization);
    } catch (e) {
      console.error(e);
    }

    return false;
  }

  // *** Internal

  /**
   * Build the authorization request URL for this client and given AuthorizeParameters.
   * @param authorizationRequest
   */
  private async buildAuthorizeUrl(authorizationRequest: AuthorizationRequest): Promise<string> {
    // build query string
    const queryString = await authorizationRequest.asQueryString();

    // prepare url
    const url = cleanUrl(`${this.domain}/${this.oauthPrefix}/authorize`);

    return `${url}?${queryString}`;
  }

  /**
   * Creates AuthorizationRequest for this client. If provided, the given scope value will override
   * the client's default scope.
   * @param scope
   */
  private getAuthorizeParameters(scope?: string): AuthorizationRequest {
    return new AuthorizationRequest({
      client_id: this.client_id,
      redirect_uri: this.redirect_uri,
      scope: scope || this.scope,
    } as AuthorizationRequestOptions);
  }

  /**
   * Exchange the given Authorization for a token. Returns `true` if sign in was successful,
   * `false` otherwise.
   * @param authorization
   */
  private async signInWithAuthorization(authorization: Authorization): Promise<boolean> {
    try {
      // get the authorization's signature
      const authorizationSignature = authorization.getSignature();

      // get the token
      const token = await this.getTokenFromServer(authorizationSignature);

      // validate scope
      if (authorization.scope !== token.scopesAsString()) {
        throw new Error("Authorized state does not match the recieved token's state");
      }

      // store token
      this.signIn(token);

      return true;
    } catch (e) {
      console.error(e);

      // remove token
      this.signOut();
    }

    return false;
  }

  /**
   * Runs an XHTTP token request to the authentication server with given authorization signature.
   * @param authorizationSignature
   */
  private async getTokenFromServer(authorizationSignature: AuthorizationSignature): Promise<JWT> {
    // prepare url
    const url = cleanUrl(`${this.domain}/${this.oauthPrefix}/token`);

    const tokenResponse = await getJSON(url, {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.client_id,
        redirect_uri: this.redirect_uri,
        ...authorizationSignature,
      }),
    });

    // no access token given
    if (!tokenResponse.access_token) {
      throw new Error('Invalid token response');
    }

    return new JWT(tokenResponse.access_token);
  }
}
