import 'fast-text-encoding';
import {
  AuthorizeParameters,
  AuthorizeParametersOptions,
} from '../../src/models/AuthorizeParameters';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

describe('AuthorizeParameters', () => {
  let crypto: any;
  let randomValue = 0;

  beforeEach(() => {
    crypto = global.crypto;

    // set crypto module mock
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

  it('generates state and code_verifier', () => {
    // create parameters set
    const options: AuthorizeParametersOptions = {
      client_id: 'the client id',
      redirect_uri: 'the redirect uri',
      scope: 'the desired token scopes',
    };
    const paramsA = new AuthorizeParameters(options);

    // change crypto module mock
    randomValue = 2;

    // create other parameter set with same seed
    const paramsB = new AuthorizeParameters(options);

    // state is set
    expect(paramsA.state).toBeTruthy();
    expect(paramsB.state).toBeTruthy();

    // state is different for each client
    expect(paramsA.state).not.toBe(paramsB.state);

    // code_verifier is set
    expect(paramsA.code_verifier).toBeTruthy();
    expect(paramsB.code_verifier).toBeTruthy();

    // code_verifier is different for each client
    expect(paramsA.code_verifier).not.toBe(paramsB.code_verifier);
  });

  it('can be converted to object', async () => {
    // create parameters set
    const options: AuthorizeParametersOptions = {
      client_id: 'the client id',
      redirect_uri: 'the redirect uri',
      scope: 'the desired token scopes',
    };
    const params = new AuthorizeParameters(options);

    // convert to object
    const paramsAsObj = await params.asObject();

    // known values
    expect(paramsAsObj).toMatchObject({
      ...options,
      code_challenge_method: 'S256',
      response_type: 'code',
    });

    // keys must be set
    expect(paramsAsObj).toHaveProperty('state');
    expect(paramsAsObj).toHaveProperty('code_challenge');
  });

  it('can be converted to query string', async () => {
    // create parameters set
    const options: AuthorizeParametersOptions = {
      client_id: 'the client id',
      redirect_uri: 'the redirect uri',
      scope: 'the desired token scopes',
    };
    const params = new AuthorizeParameters(options);

    // convert to query string
    const paramsAsQueryString = await params.asQueryString();

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
});
