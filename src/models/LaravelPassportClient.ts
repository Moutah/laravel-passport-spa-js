import {
  DEFAULT_SCOPE,
  DEFAULT_OAUTH_PREFIX,
  DEFAULT_LEEWAY,
  DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
} from '../constants';
import { AuthorizeParameters } from './AuthorizeParameters';
import { AuthorizeParametersOptions } from '../interfaces/AuthorizeParametersOptions';
import { LaravelPassportClientOptions } from '../interfaces/LaravelPassportClientOptions';

export class LaravelPassportClient implements LaravelPassportClientOptions {
  public domain: string;
  public client_id: string;
  public redirect_uri: string;

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

  private _leeway?: number;
  get leeway(): number {
    return this._leeway || DEFAULT_LEEWAY;
  }
  set leeway(value: number) {
    this._leeway = value;
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
   */
  constructor(options: LaravelPassportClientOptions) {
    this.domain = options.domain;
    this.client_id = options.client_id;
    this.redirect_uri = options.redirect_uri;
    this._oauthPrefix = options.oauthPrefix;
    this._scope = options.scope;
    this._leeway = options.leeway;
    this._authorizeTimeoutInSeconds = options.authorizeTimeoutInSeconds;
  }

  /**
   * ```js
   * await lpClient.loginWithRedirect(scope);
   * ```
   *
   * Performs a redirect to `/oauth/authorize` with appropriate AuthorizeParameters. If provided,
   * the given scope value will override the client's default scope.
   *
   * @param {?string} scope
   */
  public async loginWithRedirect(scope?: string): Promise<void> {
    const authorizeParameters = this.getAuthorizeParameters(scope);
    const url = await this.buildAuthorizeUrl(authorizeParameters);

    // store authorize paramter's code verifier
    authorizeParameters.storeCodeVerifier();

    // send the user to the authentication url
    window.location.assign(url);
  }

  /**
   * ```js
   * await lpClient.buildAuthorizeUrl(scope);
   * ```
   *
   * Build the authorization request URL for this client and given AuthorizeParameters. The
   * resulting URL enforces the use of HTTPS protocol.
   *
   * @param {AuthorizeParameters} authorizeParameters
   */
  public async buildAuthorizeUrl(authorizeParameters: AuthorizeParameters): Promise<string> {
    // build query string
    const queryString = await authorizeParameters.asQueryString();

    // prepare url and protocol
    const domain = this.domain.replace(/http(s*)\:\/\//, '');
    const url = `${domain}/${this.oauthPrefix}/authorize?${queryString}`;

    return `https://${url.replace(/\/\/+/g, '/')}`;
  }

  /**
   * ```js
   * await lpClient.getAuthorizeParameters(scope);
   * ```
   *
   * Creates AuthorizeParameters for this client. If provided, the given scope value will override
   * the client's default scope.
   *
   * @param {?string} scope
   */
  public getAuthorizeParameters(scope?: string): AuthorizeParameters {
    return new AuthorizeParameters({
      client_id: this.client_id,
      redirect_uri: this.redirect_uri,
      scope: scope || this.scope,
    } as AuthorizeParametersOptions);
  }
}
