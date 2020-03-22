/* eslint-disable @typescript-eslint/no-var-requires */
jest.mock('../../src/utils/base64');
jest.mock('../../src/utils/crypto');
jest.mock('../../src/utils/queryString');

import 'fast-text-encoding';
import { LaravelPassportClient } from './../../src/models/LaravelPassportClient';
import {
  DEFAULT_OAUTH_PREFIX,
  DEFAULT_SCOPE,
  DEFAULT_LEEWAY,
  DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
} from '../../src/constants';
import { AuthorizeParameters } from '../../src/models/AuthorizeParameters';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

const TEST_DOMAIN_URL = 'www.url.com';
const TEST_QUERY_PARAMS = 'query=params';
const TEST_ENCODED_STATE = 'encoded-state';
const TEST_SCOPES = 'custom scopes';
const TEST_RANDOM_STRING = 'random-string';
const TEST_ARRAY_BUFFER = 'this-is-an-array-buffer';
const TEST_BASE64_ENCODED_STRING = 'base64-url-encoded-string';
const LARAVEL_PASSPORT_CLIENT_OPTIONS = {
  client_id: 'the client id',
  redirect_uri: 'the redirect uri',
  domain: TEST_DOMAIN_URL,
};

const setup = async (): Promise<any> => {
  // create client
  const client = new LaravelPassportClient(LARAVEL_PASSPORT_CLIENT_OPTIONS);

  // mock utils base64
  const base64 = require('../../src/utils/base64');
  base64.encodeState.mockReturnValue(TEST_ENCODED_STATE);
  base64.bufferToBase64UrlEncoded.mockReturnValue(TEST_BASE64_ENCODED_STRING);

  // mock utils crypto
  const crypto = require('../../src/utils/crypto');
  crypto.createRandomString.mockReturnValue(TEST_RANDOM_STRING);
  crypto.sha256.mockReturnValue(TEST_ARRAY_BUFFER);

  // mock utils query string
  const queryString = require('../../src/utils/queryString');
  queryString.createQueryParams.mockReturnValue(TEST_QUERY_PARAMS);

  return { client, base64, crypto, queryString };
};

describe('LaravelPassportClient', () => {
  let crypto: any;
  let originalLocation: any;

  beforeEach(() => {
    jest.resetAllMocks();

    // mock location
    originalLocation = window.location;
    delete window.location;
    window.location = {
      ...originalLocation,
      assign: jest.fn(),
      reload: jest.fn(),
      replace: jest.fn(),
    };

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
    delete window.location;
    window.location = originalLocation;
  });

  it('getters uses defaults', async () => {
    const { client } = await setup();

    // default values
    expect(client.oauthPrefix).toBe(DEFAULT_OAUTH_PREFIX);
    expect(client.scope).toBe(DEFAULT_SCOPE);
    expect(client.leeway).toBe(DEFAULT_LEEWAY);
    expect(client.authorizeTimeoutInSeconds).toBe(DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS);
  });

  it('setters override defaults', async () => {
    const { client } = await setup();

    // custom values
    const test_oauthPrefix = 'oauthPrefix';
    const test_leeway = 22;
    const test_authorizeTimeoutInSeconds = 42;

    // set values
    client.oauthPrefix = test_oauthPrefix;
    client.scope = TEST_SCOPES;
    client.leeway = test_leeway;
    client.authorizeTimeoutInSeconds = test_authorizeTimeoutInSeconds;

    expect(client.oauthPrefix).toBe(test_oauthPrefix);
    expect(client.scope).toBe(TEST_SCOPES);
    expect(client.leeway).toBe(test_leeway);
    expect(client.authorizeTimeoutInSeconds).toBe(test_authorizeTimeoutInSeconds);
  });

  it('can make Authorize Parameters', async () => {
    const { client } = await setup();

    // create parameters
    const params = client.getAuthorizeParameters();

    // content matches
    expect(params).toBeInstanceOf(AuthorizeParameters);
    expect(params).toMatchObject({
      client_id: client.client_id,
      redirect_uri: client.redirect_uri,
      scope: client.scope,
    });

    // create parameters with custom scope
    const paramsCustomScope = client.getAuthorizeParameters(TEST_SCOPES);

    // content matches
    expect(paramsCustomScope).toMatchObject({
      scope: TEST_SCOPES,
    });
  });

  it('can build authorize url', async () => {
    const { client } = await setup();

    // build url
    const params = (client as LaravelPassportClient).getAuthorizeParameters();
    const url = await (client as LaravelPassportClient).buildAuthorizeUrl(params);

    expect(url).toBe(
      `https://${TEST_DOMAIN_URL}/${DEFAULT_OAUTH_PREFIX}/authorize?${TEST_QUERY_PARAMS}`,
    );
  });

  it('build clean authorize url', async () => {
    await setup();

    // create client which will have lot of consecutive / in its authorize url
    const client = new LaravelPassportClient({
      ...LARAVEL_PASSPORT_CLIENT_OPTIONS,
      domain: 'http://' + TEST_DOMAIN_URL + '/',
      oauthPrefix: '///',
    });

    // build url
    const params = client.getAuthorizeParameters();
    const url = await client.buildAuthorizeUrl(params);

    // consecutive / are merged
    expect(url).toBe(`https://${TEST_DOMAIN_URL}/authorize?${TEST_QUERY_PARAMS}`);
  });

  it('can login with redirect', async () => {
    const { client } = await setup();

    await client.loginWithRedirect();
    expect(window.location.assign).toHaveBeenCalledWith(
      `https://${TEST_DOMAIN_URL}/${DEFAULT_OAUTH_PREFIX}/authorize?${TEST_QUERY_PARAMS}`,
    );
  });

  it('can login with redirect using custom scopes', async () => {
    const { client } = await setup();

    await client.loginWithRedirect(TEST_SCOPES);
    expect(window.location.assign).toHaveBeenCalledWith(
      `https://${TEST_DOMAIN_URL}/${DEFAULT_OAUTH_PREFIX}/authorize?${TEST_QUERY_PARAMS}`,
    );
  });
});
