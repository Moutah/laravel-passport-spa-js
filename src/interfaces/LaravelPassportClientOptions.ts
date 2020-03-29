export interface LaravelPassportClientOptions {
  /**
   * Your Laravel Passport authentification domain url such as `'login.example.com'`.
   */
  domain: string;

  /**
   * The prefix fow Passport's routes.
   * Defaults to `'oauth`.
   */
  oauthPrefix?: string;

  /**
   * The Client ID.
   */
  client_id: string;

  /**
   * The default scope to be used on authentication requests.
   * Defaults to `'*'`.
   */
  scope?: string;

  /**
   * The default URL where Laravel Passport will redirect your browser to with the authentication result.
   */
  redirect_uri: string;

  /**
   * The value in seconds used to account for clock skew in JWT expirations.
   * Typically, this value is no more than a minute or two at maximum.
   * Defaults to 60s.
   */
  leeway?: number;

  /**
   * A maximum number of seconds to wait before declaring background calls to /authorize as failed for timeout.
   * Defaults to 60s.
   */
  authorizeTimeoutInSeconds?: number;
}
