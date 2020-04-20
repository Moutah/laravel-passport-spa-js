/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock('../../src/utils/base64');
jest.mock('../../src/utils/crypto');
jest.mock('../../src/utils/xhr');
jest.mock('../../src/utils/iframe');

import 'fast-text-encoding';
import { LaravelPassportClient } from '../../src/models/LaravelPassportClient';
import {
  DEFAULT_OAUTH_PREFIX,
  DEFAULT_SCOPE,
  DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
  STORAGE_PREFIX,
  DEFAULT_LEEWAY,
  DEFAULT_AUTO_REFRESH,
} from '../../src/constants';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

const TEST_DOMAIN_URL = 'www.url.com';
const TEST_ENCODED_STATE = 'encoded-state';
const TEST_SCOPES = 'custom scopes';
const TEST_RANDOM_STRING = 'random-string';
const TEST_ARRAY_BUFFER = 'this-is-an-array-buffer';
const TEST_BASE64_ENCODED_STRING = 'base64-url-encoded-string';
const TEST_STATE = 'leState';
const TEST_CODE = 'leAwesomeCode';
const TEST_CODE_VERIFIER = 'leVerifier';
const TEST_TOKEN_RESPONSE = {
  access_token:
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoidW5pcXVlLWlkIiwiaWF0IjoxNTg0OTY1OTY2LCJuYmYiOjE1ODQ5NjU5NjYsImV4cCI6OTk5OTk5OTk5OSwic3ViIjoiMjIiLCJzY29wZXMiOlsiY3VzdG9tIiwic2NvcGVzIl19.jCpxIu4yvXEm6aXiz8Ks2f8DJQyMVKdreowLUQdJuwXdE7vocHgtjJ7nJ0WD3JXeN9diBCUq4vE2b3t9sDJ6EyjqeN945hY0GZzKu7tqwJYoa7zInwv6iXo9Sk-hYFTgm2aIiFzTRB-_F-KN1OYQCMQprhcZ-jFS0YR3R9gVV7TzX4qx4QbCz1bmiDGx6cGGCK3b9Ci3u9wEL3M6tPMu-6s4_D9yddwVwfSBOK-tpW1qAiDm3sB-iQDudDMgav1GjVlpf1j7yi9-2leuaZ202tHqTsaJ-cLjZAqcPYlJwpE4CfIUTephP1495HfA4puK_9NrBEh-NdyEQz0dNIFgZEjZgsLVqnELpAIZXDb1H_2aPl2ZyCJwa0r3rZKVN9rTrLt1UCv-OasgMleGLMgZmgIbfb7IpIiU_M1dG0b_gMkXfhnVqaBBveWH89LkP7qTRYFa836_LT-8eNEZmrXJMZVqCeg2SC36GE8t0u-Rf5MAR3gb5LKqoZd9IGnD3wLitouPWFGdiV1BGdTZXWuAwdeHT-4qxUN4Fw4oi18IDgBVHXgOk9Tk0HzfNc7ni0xS0xlksjRW3AVrIzm_4qY4KMvrExensxgqK9ovHfeWo4ZQNl_-DadGNOq_sNEGK5cWL1oFWANq5HfHvV0cRd9b3Xh8ZhvxT1CMuSp-k4c_jXA',
};

const TEST_JWT_PAYLOAD = {
  aud: '1',
  jti: 'unique-id',
  iat: Date.now() / 1000,
  nbf: Date.now() / 1000,
  exp: Date.now() / 1000 + 300,
  sub: '22',
  scopes: ['custom', 'scopes'],
};
const LARAVEL_PASSPORT_CLIENT_OPTIONS = {
  client_id: 'the client id',
  redirect_uri: 'the redirect uri',
  domain: TEST_DOMAIN_URL,
};

const setup = (): {
  client: LaravelPassportClient;
  base64: any;
  crypto: any;
  xhr: any;
  iframe: any;
} => {
  // create client
  const client = new LaravelPassportClient(LARAVEL_PASSPORT_CLIENT_OPTIONS);

  // mock utils base64
  const base64 = require('../../src/utils/base64');
  base64.encodeState.mockReturnValue(TEST_ENCODED_STATE);
  base64.bufferToBase64UrlEncoded.mockReturnValue(TEST_BASE64_ENCODED_STRING);
  base64.urlDecodeB64.mockReturnValue(JSON.stringify(TEST_JWT_PAYLOAD));

  // mock utils crypto
  const crypto = require('../../src/utils/crypto');
  crypto.createRandomString.mockReturnValue(TEST_RANDOM_STRING);
  crypto.sha256.mockReturnValue(TEST_ARRAY_BUFFER);

  // mock utils iframe
  const iframe = require('../../src/utils/iframe');
  iframe.runIframe.mockClear();
  iframe.runIframe.mockReturnValue(`code=${TEST_CODE}&state=${TEST_STATE}`);

  // mock utils xhr
  const xhr = require('../../src/utils/xhr');
  xhr.cleanUrl.mockReturnValue(`https://${TEST_DOMAIN_URL}/oauth/authorize`);
  xhr.getJSON.mockReturnValue(TEST_TOKEN_RESPONSE);

  // add stored state
  localStorage.setItem(
    STORAGE_PREFIX + TEST_STATE,
    JSON.stringify({ v: TEST_CODE_VERIFIER, s: TEST_SCOPES }),
  );

  return { client, base64, crypto, xhr, iframe };
};

describe('LaravelPassportClient', () => {
  let crypto: any;

  beforeEach(() => {
    // set crypto module mock
    crypto = global.crypto;
    global.crypto = {
      subtle: {
        digest: (): string => '',
      },
    };
  });

  afterEach(() => {
    global.crypto = crypto;
  });

  it('getters uses defaults', async () => {
    const { client } = setup();

    // default values
    expect(client.oauthPrefix).toBe(DEFAULT_OAUTH_PREFIX);
    expect(client.scope).toBe(DEFAULT_SCOPE);
    expect(client.authorizeTimeoutInSeconds).toBe(DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS);
    expect(client.isAutoRefresh).toBe(DEFAULT_AUTO_REFRESH);
  });

  it('setters override defaults', async () => {
    const { client } = setup();

    // custom values
    const test_oauthPrefix = 'awesome-prefix';
    const test_authorizeTimeoutInSeconds = 42;
    const test_isAutoRefresh = false;

    // set values
    client.oauthPrefix = test_oauthPrefix;
    client.scope = TEST_SCOPES;
    client.authorizeTimeoutInSeconds = test_authorizeTimeoutInSeconds;
    client.isAutoRefresh = test_isAutoRefresh;

    expect(client.oauthPrefix).toBe(test_oauthPrefix);
    expect(client.scope).toBe(TEST_SCOPES);
    expect(client.authorizeTimeoutInSeconds).toBe(test_authorizeTimeoutInSeconds);
    expect(client.isAutoRefresh).toBe(test_isAutoRefresh);
  });

  it('can give token scopes', async () => {
    const { client } = setup();

    // no token
    expect(client.getTokenScopes()).toBe(null);

    // sign in
    await client.signIn();

    expect(client.getTokenScopes()).toStrictEqual(TEST_JWT_PAYLOAD.scopes);
  });

  it('can give token expiration', async () => {
    const { client } = setup();

    // no token
    expect(client.getTokenExpiration()).toBe(null);

    // sign in
    await client.signIn();

    const tokenExpiration = client.getTokenExpiration();
    expect(tokenExpiration).toBeInstanceOf(Date);
    expect((tokenExpiration as Date).getTime()).toBe(
      1000 * (TEST_JWT_PAYLOAD.exp - DEFAULT_LEEWAY),
    );
  });

  it('can assess token validity', async () => {
    const { client, base64 } = setup();

    // no token yet
    expect(client.isTokenValid()).toBe(false);

    // sign in
    await client.signIn();
    expect(client.isTokenValid()).toBe(true);

    // new token will be expired
    base64.urlDecodeB64.mockReturnValue(
      JSON.stringify({
        ...TEST_JWT_PAYLOAD,
        exp: 0,
      }),
    );
    localStorage.setItem(
      STORAGE_PREFIX + TEST_STATE,
      JSON.stringify({ v: TEST_CODE_VERIFIER, s: TEST_SCOPES }),
    );

    // sign in again
    client.signOut();
    await client.signIn();
    expect(client.isTokenValid()).toBe(false);
  });

  it('can give signed user id', async () => {
    const { client } = setup();

    // no token
    expect(client.getSignedInUserId()).toBe(null);

    // sign in
    await client.signIn();

    expect(client.getSignedInUserId()).toBe(parseInt(TEST_JWT_PAYLOAD.sub));
  });

  it('can auto refresh token', async () => {
    expect.assertions(2);
    const { client, base64 } = setup();
    const signInSpy = jest.spyOn(client, 'signIn');
    client.signInWithRedirect = jest.fn();

    // no token in store
    await client.getToken();
    expect(signInSpy).toHaveBeenLastCalledWith(undefined);

    // sign client in with an expired token
    base64.urlDecodeB64.mockReturnValue(
      JSON.stringify({
        ...TEST_JWT_PAYLOAD,
        exp: 0,
      }),
    );
    localStorage.setItem(
      STORAGE_PREFIX + TEST_STATE,
      JSON.stringify({ v: TEST_CODE_VERIFIER, s: TEST_SCOPES }),
    );
    await client.signIn();

    // get new token with same scope
    await client.getToken();
    expect(signInSpy).toHaveBeenLastCalledWith(TEST_JWT_PAYLOAD.scopes.join(' '));
  });

  it('can sign out', async () => {
    expect.assertions(3);
    const { client } = setup();
    client.isAutoRefresh = false;

    // no token yet
    await expect(client.getToken()).resolves.toBeFalsy();

    // sign in
    await client.signIn();
    await expect(client.getToken()).resolves.toBeTruthy();

    // sign out
    client.signOut();
    await expect(client.getToken()).resolves.toBeFalsy();
  });

  describe('sign in with iframe', () => {
    it('can sign in with iframe', async () => {
      expect.assertions(2);
      const { client } = setup();

      await expect(client.signIn()).resolves.toBe(true);
      await expect(client.getToken()).resolves.toBeTruthy();
    });

    it('sign in requests are grouped', async () => {
      expect.assertions(6);
      const { client, iframe } = setup();

      // create multiple sign in request
      const signIns = [
        client.signIn(),
        client.signIn(),
        client.signIn(),
        client.signIn(),
        client.signIn(),
      ];

      // run all sign in
      const signInsResults = await Promise.all(signIns);
      signInsResults.forEach(result => expect(result).toBe(true));

      // iframe called only once
      expect(iframe.runIframe).toHaveBeenCalledTimes(1);
    });

    it('signs in with redirect if iframe fails', async () => {
      const { client, iframe } = setup();

      client.signInWithRedirect = jest.fn();

      // set iframe to fail
      iframe.runIframe.mockReturnValue('');

      await client.signIn('my scope');
      expect(client.signInWithRedirect).toHaveBeenCalledWith('my scope');
    });
  });

  describe('sign in with redirect', () => {
    let originalLocation: any;

    beforeEach(() => {
      // mock location
      originalLocation = window.location;
      delete window.location;
      window.location = {
        ...originalLocation,
        assign: jest.fn(),
        reload: jest.fn(),
        replace: jest.fn(),
        search: `code=${TEST_CODE}&state=${TEST_STATE}`,
      };
    });

    afterEach(() => {
      delete window.location;
      window.location = originalLocation;
    });

    it('can sign in with redirect', async () => {
      const { client } = setup();

      const expectedQueryString =
        `client_id=${client.client_id}` +
        `&redirect_uri=${client.redirect_uri}` +
        `&response_type=code` +
        `&scope=*` +
        `&state=${TEST_ENCODED_STATE}` +
        `&code_challenge=${TEST_BASE64_ENCODED_STRING}` +
        `&code_challenge_method=S256`;

      await client.signInWithRedirect();
      expect(window.location.assign).toHaveBeenCalledWith(
        `https://${TEST_DOMAIN_URL}/${DEFAULT_OAUTH_PREFIX}/authorize?` +
          expectedQueryString.replace(/ /g, '%20'),
      );
    });

    it('can sign in with redirect using custom scopes', async () => {
      const { client } = setup();

      const expectedQueryString =
        `client_id=${client.client_id}` +
        `&redirect_uri=${client.redirect_uri}` +
        `&response_type=code` +
        `&scope=${TEST_SCOPES}` +
        `&state=${TEST_ENCODED_STATE}` +
        `&code_challenge=${TEST_BASE64_ENCODED_STRING}` +
        `&code_challenge_method=S256`;

      await client.signInWithRedirect(TEST_SCOPES);
      expect(window.location.assign).toHaveBeenCalledWith(
        `https://${TEST_DOMAIN_URL}/${DEFAULT_OAUTH_PREFIX}/authorize?` +
          expectedQueryString.replace(/ /g, '%20'),
      );
    });

    it('fails if no parameter given to callback', async () => {
      const { client } = setup();

      // set redirect to epmty
      global.location.search = '';

      expect.assertions(1);
      await expect(client.handleRedirectCallback()).resolves.toBe(false);
    });

    it('fails and sign out if no state is found in storage', async () => {
      expect.assertions(2);
      const { client } = setup();
      client.signOut = jest.fn();

      // make sure storage is empty
      localStorage.clear();

      await expect(client.handleRedirectCallback()).resolves.toEqual(false);
      expect(client.signOut).toHaveBeenCalled();
    });

    it('fails and sign out if token response is malformed', async () => {
      expect.assertions(2);
      const { client, xhr } = setup();
      client.signOut = jest.fn();

      // mock xhr with invalid response
      xhr.getJSON.mockReturnValue({ response: 'malformed' });

      await expect(client.handleRedirectCallback()).resolves.toEqual(false);
      expect(client.signOut).toHaveBeenCalled();
    });

    it("fails and sign out if token's scope does not match authorization", async () => {
      expect.assertions(2);
      const { client, base64 } = setup();
      client.signOut = jest.fn();

      // set token payload to a different scope
      base64.urlDecodeB64.mockReturnValue(
        JSON.stringify({
          ...TEST_JWT_PAYLOAD,
          scopes: [],
        }),
      );

      await expect(client.handleRedirectCallback()).resolves.toEqual(false);
      expect(client.signOut).toHaveBeenCalled();
    });

    it('can handle redirect callback', async () => {
      expect.assertions(2);
      const { client } = setup();

      await expect(client.handleRedirectCallback()).resolves.toBe(true);
      await expect(client.getToken()).resolves.toBeTruthy();
    });

    it('aborts redirect callback handling if inside iframe', async () => {
      expect.assertions(1);
      const { client } = setup();

      // mock window
      const originalWindow = { ...window };
      const windowSpy = jest.spyOn(global, 'window', 'get');
      windowSpy.mockImplementation(() => ({
        ...originalWindow,
        self: 'iframe',
        top: 'main window',
      }));

      global.window.self = 'iframe';
      global.window.top = 'main window';

      await expect(client.handleRedirectCallback()).resolves.toBe(false);

      windowSpy.mockRestore();
    });
  });
});
