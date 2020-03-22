/* eslint-disable @typescript-eslint/no-var-requires */
import 'fast-text-encoding';
import { AuthorizeParameters } from '../../src/models/AuthorizeParameters';
import { AuthorizeParametersOptions } from '../../src/interfaces/AuthorizeParametersOptions';
import { STORAGE_PREFIX } from '../../src/constants';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

const AUTHORIZE_PARAMTERS_OPTIONS: AuthorizeParametersOptions = {
  client_id: 'the client id',
  redirect_uri: 'the redirect uri',
  scope: 'the desired token scopes',
};

const setup = async (): Promise<AuthorizeParameters> => {
  // create parameters
  const authorizeParameters = new AuthorizeParameters(AUTHORIZE_PARAMTERS_OPTIONS);

  return authorizeParameters;
};

describe('AuthorizeParameters', () => {
  let crypto: any;
  let randomValue = 0;

  beforeEach(() => {
    // set crypto module mock
    crypto = global.crypto;
    global.crypto = {
      getRandomValues: (a: Uint8Array): Array<number> => Array(a.length).fill(randomValue),
      subtle: {
        digest: jest.fn(() => new Promise(res => res('le-hash'))),
      },
    };
  });

  afterEach(() => {
    global.crypto = crypto;
  });

  it('generates state and code_verifier', async () => {
    const authorizeParameters = await setup();

    // change crypto module mock
    randomValue = 2;

    // create other parameter set with same seed
    const paramsB = new AuthorizeParameters(AUTHORIZE_PARAMTERS_OPTIONS);

    // state is set
    expect(authorizeParameters.state).toBeTruthy();
    expect(paramsB.state).toBeTruthy();

    // state is different for each client
    expect(authorizeParameters.state).not.toBe(paramsB.state);

    // code_verifier is set
    expect(authorizeParameters.code_verifier).toBeTruthy();
    expect(paramsB.code_verifier).toBeTruthy();

    // code_verifier is different for each client
    expect(authorizeParameters.code_verifier).not.toBe(paramsB.code_verifier);
  });

  it('can be converted to object', async () => {
    const authorizeParameters = await setup();

    // convert to object
    const paramsAsObj = await authorizeParameters.asObject();

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
    const authorizeParameters = await setup();

    // convert to query string
    const paramsAsQueryString = await authorizeParameters.asQueryString();

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

  it('can store code verifier', async () => {
    const authorizeParameters = await setup();

    authorizeParameters.storeCodeVerifier();

    // stored in localStorage
    expect(localStorage.setItem).toHaveBeenLastCalledWith(
      STORAGE_PREFIX + authorizeParameters.state,
      authorizeParameters.code_verifier,
    );
  });
});
