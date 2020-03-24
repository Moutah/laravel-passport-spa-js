import { STORAGE_PREFIX } from '../constants';
import { InvalidStateError } from '../errors';
import { AuthorizationSignature } from '../interfaces/AuthorizationSignature';

export class Authorization {
  public code: string;
  public state: string;
  public code_verifier?: string;
  public scope?: string;
  private isLoaded: boolean;

  /**
   * Represents the Authorization response issued by the authentication server as a `code` and a
   * `state`. The `state` matches the one from the AuthorizationRequest and is used to load the
   * `code_verifier` that the request has stored in client's storage.
   * @param options
   */
  constructor(options: { code: string; state: string }) {
    this.code = options.code;
    this.state = options.state;
    this.isLoaded = false;
  }

  /**
   * Returns an AuthorizationSignature from this Authorization. Loads the code_verifier
   * from client's storage if not loaded already.
   * @throws InvalidStateError
   */
  getSignature(): AuthorizationSignature {
    if (!this.isLoaded) {
      this.loadVerifier();
    }

    return {
      code: this.code,
      code_verifier: this.code_verifier as string,
    };
  }

  /**
   * Load the code verifier stored for this authorization's state in client's storage and removes
   * it from storage. Throws `InvalidStateError` if not found in storage.
   * @throws InvalidStateError
   */
  private loadVerifier(): void {
    const stored = window.localStorage.getItem(STORAGE_PREFIX + this.state);

    // nothing stored for given state
    if (!stored) {
      throw new InvalidStateError('No code verifier for this state.');
    }

    // remove from localStorage
    window.localStorage.removeItem(STORAGE_PREFIX + this.state);

    const storedJSON = JSON.parse(stored);

    this.code_verifier = storedJSON.v as string;
    this.scope = storedJSON.s as string;
  }
}
