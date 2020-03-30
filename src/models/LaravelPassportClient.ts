import {
  DEFAULT_SCOPE,
  DEFAULT_OAUTH_PREFIX,
  DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
  DEFAULT_AUTO_REFRESH,
} from '../constants';
import { AuthorizationRequest } from './AuthorizationRequest';
import { AuthorizationRequestOptions } from '../interfaces/AuthorizationRequestOptions';
import { LaravelPassportClientOptions } from '../interfaces/LaravelPassportClientOptions';
import { parseQueryResult } from '../utils/queryString';
import { Authorization } from './Authorization';
import { getJSON, cleanUrl } from '../utils/xhr';
import { JWT } from './JWT';
import { AuthorizationSignature } from '../interfaces/AuthorizationSignature';
import { runIframe } from '../utils/iframe';

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

  private _isAutoRefresh?: boolean;
  get isAutoRefresh(): boolean {
    return this._isAutoRefresh !== undefined ? this._isAutoRefresh : DEFAULT_AUTO_REFRESH;
  }
  set isAutoRefresh(value: boolean) {
    this._isAutoRefresh = value;
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
    this._isAutoRefresh = options.isAutoRefresh;

    // internal
    this._token = undefined;
  }

  /**
   * ```js
   * lpClient.getToken();
   * ```
   *
   * Get the token this client has in cache.
   */
  async getToken(): Promise<string | null> {
    // refresh invalid token
    if (this.isAutoRefresh && !this.isTokenValid()) {
      const currentScope = this._token ? this._token.scopesAsString() : undefined;
      await this.signIn(currentScope);
    }

    return this._token ? this._token.raw : null;
  }

  /**
   * ```js
   * lpClient.getTokenScopes();
   * ```
   *
   * Get this client token's scope(s).
   */
  getTokenScopes(): string[] | null {
    return this._token ? this._token.scopes : null;
  }

  /**
   * ```js
   * lpClient.getTokenExpiration();
   * ```
   *
   * Get this client token's expiration date.
   */
  getTokenExpiration(): Date | null {
    return this._token ? this._token.expiration : null;
  }

  /**
   * ```js
   * lpClient.isTokenValid();
   * ```
   *
   * Returns `true` if the client has a token which is not expired, `false` otherwise.
   */
  isTokenValid(): boolean {
    return !!this._token && !this._token.isExpired();
  }

  /**
   * ```js
   * lpClient.getSignedInUserId();
   * ```
   *
   * Get this client token's user id.
   */
  getSignedInUserId(): number | null {
    return this.isTokenValid() ? (this._token as JWT).user_id : null;
  }

  /**
   * ```js
   * await lpClient.signIn();
   * ```
   *
   * Sign the client in. Starts with the iframe flow and fallsback to redirect flow if needed.
   * Resolves on `true` if the sign in has been successful, `false` otherwise.
   * @param {?string} scope
   */
  async signIn(scope?: string): Promise<boolean> {
    const isSignedInSilently = await this.executeSignIn('iframe', scope);

    if (!isSignedInSilently) {
      await this.signInWithRedirect(scope);
    }

    return isSignedInSilently;
  }

  /**
   * ```js
   * await lpClient.signInWithRedirect(scope);
   * ```
   *
   * Redirect to the authorize URL (`'/oauth/authorize'` by default) with appropriate
   * AuthorizeParameters. If provided, the given scope value will override the client's
   * default scope.
   * @param {?string} scope
   */
  async signInWithRedirect(scope?: string): Promise<void> {
    await this.executeSignIn('redirect', scope);
  }

  /**
   * ```js
   * await lpClient.handleRedirectCallback();
   * ```
   *
   * Extract the authorization code returned in the query string, build the Authorization Signature and calls
   * `exchangeAuthorizationForToken` with it. Returns `true` if a token is obtained, `false`
   * otherwise.
   */
  async handleRedirectCallback(): Promise<boolean> {
    // abort if inside iframe
    if (window.self !== window.top) return false;

    // acquire querystring
    const queryString = window.location.search.substr(1);

    // attempt to sign in with authorization
    return await this.convertToToken(queryString);
  }

  /**
   * ```js
   * lpClient.signOut();
   * ```
   *
   * Remove the cached token.
   */
  signOut(): void {
    this._token = undefined;
  }

  // *** Internal

  /**
   * Cache the token for this client.
   * @param token
   */
  private storeToken(token: JWT): void {
    this._token = token;
  }

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
  private buildAuthorizationRequest(scope?: string): AuthorizationRequest {
    return new AuthorizationRequest({
      client_id: this.client_id,
      redirect_uri: this.redirect_uri,
      scope: scope || this.scope,
    } as AuthorizationRequestOptions);
  }

  /**
   * Execute the sign in process with given method for given scope. Resolves on `true` if the sign
   * in has been successful, `false` otherwise.
   * @param method
   * @param scope
   */
  private async executeSignIn(method: string, scope?: string): Promise<boolean> {
    // prepare authorization request
    const authorizationRequest = this.buildAuthorizationRequest(scope);
    authorizationRequest.storeState();

    // make url
    const url = await this.buildAuthorizeUrl(authorizationRequest);

    switch (method) {
      case 'redirect':
        window.location.assign(url);
        return false;

      case 'iframe':
      default:
        try {
          const queryString = await runIframe(url);
          return await this.convertToToken(queryString);
        } catch {
          return false;
        }
    }
  }

  /**
   * Use the given query string to make an Authorization and sign in with it.
   * @param queryString
   * @throws If given query string is empty
   */
  private async convertToToken(queryString: string): Promise<boolean> {
    const authorization = this.makeAuthorization(queryString);
    return await this.signInWithAuthorization(authorization);
  }

  /**
   * Parse the given query string and returns an Authorization with the parsed parameters.
   * @param queryString
   * @throws If given query string is empty
   */
  private makeAuthorization(queryString: string): Authorization {
    // nothing returned
    if (queryString.length === 0) {
      throw new Error('No query response parameters found.');
    }

    // parse query
    const { code, state } = parseQueryResult(queryString);

    // create authorization
    return new Authorization({ code, state });
  }

  /**
   * Exchange the given Authorization for a token. Returns `true` if sign in was successful,
   * `false` otherwise.
   * @param authorization
   * @throws if the recieved token's scope does not match the scope from authorization
   */
  private async signInWithAuthorization(authorization: Authorization): Promise<boolean> {
    try {
      // get the authorization's signature
      const authorizationSignature = authorization.getSignature();

      // get the token
      const token = await this.getTokenFromServer(authorizationSignature);

      // validate scope
      if (authorization.scope !== token.scopesAsString()) {
        throw new Error("Authorized scope does not match the recieved token's scope");
      }

      // store token
      this.storeToken(token);

      return true;
    } catch (e) {
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
