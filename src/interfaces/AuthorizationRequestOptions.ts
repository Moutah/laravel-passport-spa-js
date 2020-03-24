export interface AuthorizationRequestOptions {
  /**
   * The Client ID.
   */
  client_id: string;

  /**
   * The redirect URI for this client.
   */
  redirect_uri: string;

  /**
   * The scope for the wanted token.
   */
  scope: string;
}
