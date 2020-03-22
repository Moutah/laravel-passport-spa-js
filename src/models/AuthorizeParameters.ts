import {
  encodeState,
  createRandomString,
  sha256,
  bufferToBase64UrlEncoded,
  createQueryParams,
} from '../utils';

export interface AuthorizeParametersOptions {
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

export class AuthorizeParameters implements AuthorizeParametersOptions {
  public client_id: string;
  public redirect_uri: string;
  public scope: string;
  public state: string;
  public code_verifier: string;
  public readonly code_challenge_method: string = 'S256';
  public readonly response_type: string = 'code';

  /**
   * Build Authorize parameters based on given options. Generate a state and code verifier upon
   * creation.
   */
  constructor(options: AuthorizeParametersOptions) {
    this.client_id = options.client_id;
    this.redirect_uri = options.redirect_uri;
    this.scope = options.scope;
    this.state = encodeState(createRandomString());
    this.code_verifier = createRandomString();
  }

  /**
   * Calculates the code challenge and returns the parameters as an object.
   */
  public async asObject(): Promise<any> {
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
   * Returns the parameters as a query string. Uses `AuthorizeParameters.asObject()` (which
   * calculates the code challenge, hence the async function) and utils' `createQueryParams()`.
   */
  public async asQueryString(): Promise<string> {
    const params = await this.asObject();

    return createQueryParams(params);
  }

  /**
   * Get the code challenge base on `code_verifier`'s value.
   */
  public async getCodeChallenge(): Promise<string> {
    const code_challengeBuffer = await sha256(this.code_verifier);
    return bufferToBase64UrlEncoded(code_challengeBuffer);
  }
}
