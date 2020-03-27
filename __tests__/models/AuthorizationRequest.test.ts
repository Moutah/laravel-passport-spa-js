/* eslint-disable @typescript-eslint/no-var-requires */
import 'fast-text-encoding';
import { AuthorizationRequest } from '../../src/models/AuthorizationRequest';
import { AuthorizationRequestOptions } from '../../src/interfaces/AuthorizationRequestOptions';
import { STORAGE_PREFIX } from '../../src/constants';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

const AUTHORIZE_PARAMTERS_OPTIONS: AuthorizationRequestOptions = {
  client_id: 'the client id',
  redirect_uri: 'the redirect uri',
  scope: 'the desired token scopes',
};

const setup = async (): Promise<AuthorizationRequest> => {
  // create parameters
  const authorizationRequest = new AuthorizationRequest(AUTHORIZE_PARAMTERS_OPTIONS);

  return authorizationRequest;
};

describe('AuthorizationRequest', () => {
  let crypto: any;
  let randomValue = 0;

  beforeEach(() => {
    // set crypto module mock
    crypto = global.crypto;
    global.crypto = {
      getRandomValues: (a: Uint8Array): Array<number> => Array(a.length).fill(randomValue),
      subtle: {
        digest: jest.fn(() => new Promise(res => res([116, 101, 115, 116]))),
      },
    };
  });

  afterEach(() => {
    global.crypto = crypto;
  });

  it('generates state and code_verifier', async () => {
    const authorizationRequest = await setup();

    // change crypto module mock
    randomValue = 2;

    // create other parameter set with same seed
    const paramsB = new AuthorizationRequest(AUTHORIZE_PARAMTERS_OPTIONS);

    // state is set
    expect(authorizationRequest.state).toBeTruthy();
    expect(paramsB.state).toBeTruthy();

    // state is different for each client
    expect(authorizationRequest.state).not.toBe(paramsB.state);

    // code_verifier is set
    expect(authorizationRequest.code_verifier).toBeTruthy();
    expect(paramsB.code_verifier).toBeTruthy();

    // code_verifier is different for each client
    expect(authorizationRequest.code_verifier).not.toBe(paramsB.code_verifier);
  });

  it('can be converted to object', async () => {
    const authorizationRequest = await setup();

    // convert to object
    const paramsAsObj = await authorizationRequest.parameters();

    // known values
    expect(paramsAsObj).toMatchObject({
      ...AUTHORIZE_PARAMTERS_OPTIONS,
      code_challenge_method: 'S256',
      response_type: 'code',
    });

    // keys must be set
    expect(paramsAsObj).toHaveProperty('state');
    expect(paramsAsObj).toHaveProperty('code_challenge');
  });

  it('can be converted to query string', async () => {
    const authorizationRequest = await setup();

    // convert to query string
    const paramsAsQueryString = await authorizationRequest.asQueryString();

    expect(paramsAsQueryString).toBeTruthy();

    // contains all keys
    [
      'client_id',
      'redirect_uri',
      'response_type',
      'scope',
      'state',
      'code_challenge',
      'code_challenge_method',
    ].forEach((key: string): void => expect(paramsAsQueryString.includes(key)).toBe(true));
  });

  it('caches code challenge', async () => {
    const authorizationRequest = await setup();

    const code_challenge_first_time = await authorizationRequest.getCodeChallenge();
    const code_challenge_second_time = await authorizationRequest.getCodeChallenge();

    expect(code_challenge_first_time).toStrictEqual(code_challenge_second_time);
    expect(global.crypto.subtle.digest).toHaveBeenCalledTimes(1);
  });

  it('can store code verifier', async () => {
    const authorizationRequest = await setup();

    authorizationRequest.storeState();

    // stored in localStorage
    expect(localStorage.setItem).toHaveBeenLastCalledWith(
      STORAGE_PREFIX + authorizationRequest.state,
      JSON.stringify({ v: authorizationRequest.code_verifier, s: authorizationRequest.scope }),
    );
  });
});
