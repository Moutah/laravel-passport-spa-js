export interface LaravelPassportClientOptions {
  /**
   * Your Laravel Passport authentification domain url such as `'login.example.com'`.
   */
  domain: string;

  /**
   * The Client ID.
   */
  client_id: string;

  /**
   * The default URL where Laravel Passport will redirect your browser to with the authentication result.
   */
  redirect_uri: string;

  /**
   * The prefix fow Passport's routes on the authentication server.
   * Defaults to `'oauth'`.
   */
  oauthPrefix?: string;

  /**
   * The default scope to be used on authentication requests.
   * Defaults to `'*'`.
   */
  scope?: string;

  /**
   * A maximum number of seconds to wait before declaring background calls to /authorize as failed for timeout.
   * Defaults to 60s.
   */
  authorizeTimeoutInSeconds?: number;

  /**
   * Whether a new sign in should be attempted if no valid token is present when `getToken()` is
   * called.
   */
  isAutoRefresh?: boolean;
}
