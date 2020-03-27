import 'fast-text-encoding';
import { JWT } from '../../src/models/JWT';
import { DEFAULT_LEEWAY } from '../../src/constants';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

const TEST_ENCODED_TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoidW5pcXVlLWlkIiwiaWF0IjoxNTg0OTY1OTY2LCJuYmYiOjE1ODQ5NjU5NjYsImV4cCI6OTk5OTk5OTk5OSwic3ViIjoiMjIiLCJzY29wZXMiOlsiY3VzdG9tIiwic2NvcGVzIl19.jCpxIu4yvXEm6aXiz8Ks2f8DJQyMVKdreowLUQdJuwXdE7vocHgtjJ7nJ0WD3JXeN9diBCUq4vE2b3t9sDJ6EyjqeN945hY0GZzKu7tqwJYoa7zInwv6iXo9Sk-hYFTgm2aIiFzTRB-_F-KN1OYQCMQprhcZ-jFS0YR3R9gVV7TzX4qx4QbCz1bmiDGx6cGGCK3b9Ci3u9wEL3M6tPMu-6s4_D9yddwVwfSBOK-tpW1qAiDm3sB-iQDudDMgav1GjVlpf1j7yi9-2leuaZ202tHqTsaJ-cLjZAqcPYlJwpE4CfIUTephP1495HfA4puK_9NrBEh-NdyEQz0dNIFgZEjZgsLVqnELpAIZXDb1H_2aPl2ZyCJwa0r3rZKVN9rTrLt1UCv-OasgMleGLMgZmgIbfb7IpIiU_M1dG0b_gMkXfhnVqaBBveWH89LkP7qTRYFa836_LT-8eNEZmrXJMZVqCeg2SC36GE8t0u-Rf5MAR3gb5LKqoZd9IGnD3wLitouPWFGdiV1BGdTZXWuAwdeHT-4qxUN4Fw4oi18IDgBVHXgOk9Tk0HzfNc7ni0xS0xlksjRW3AVrIzm_4qY4KMvrExensxgqK9ovHfeWo4ZQNl_-DadGNOq_sNEGK5cWL1oFWANq5HfHvV0cRd9b3Xh8ZhvxT1CMuSp-k4c_jXA';
const TEST_TOKEN_VALUES = {
  client_id: 1,
  token_id: 'unique-id',
  issued_at: 1584965966,
  not_before: 1584965966,
  expiration: 9999999999,
  user_id: 22,
  scopes: ['custom', 'scopes'],
};
const TEST_EXPIRED_ENCODED_TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoidW5pcXVlLWlkIiwiaWF0IjoxNTg0OTY1OTY2LCJuYmYiOjE1ODQ5NjU5NjYsImV4cCI6MCwic3ViIjoiMjIiLCJzY29wZXMiOlsiY3VzdG9tIiwic2NvcGVzIl19.j7t9yvdPE2E-YEWN-cda9pUsdESHUFZxSpxjxa4MluLOecIoCL3RPZofTKQb6z2W0hSr4SQzhbSDEHSnMlDYd9hYdSZlt7F-c-p1l2_-Vwmy32fNILs9qE7iXmzxmS-mLPhENmNwNjvJ4ceh6eYCW4hGix8BDzKaZKs836oGuTY4Vh9Co70agkZDOGBpvm8da6VuZa3bhrd4ubZ5A8ak8VR7zvMs9GJrQtkGmrFSCbNFJtoZ6nrw3mB8FAgzteyIvOw2FbOEIp3BkMIPO_bQRF4kNULHoHL05fgGXS_Z4oGeTl2OlzSTSXkWftdsceW-nNQSFDFeIvzBQrfmV0RBna7v5o_KKXKlqB95LI70efCRKKtKfYt0AJIh_QkX2naqd-BrzUd9R7YMt7HSxgGEYV8SGRQIU7xnJlBTZCJYf-OocEBaEzb3tFMGyOAI3lJnIDFiQj5L44Azil71RPg32ueyJjf4yQ12onA_-mq9mcgPyZyj_-k4HQvE78TY--t1_phseJWL2W2-tkXSrl_gEKKp0y9KOB3WK8mfT09qEJacyC9vGkO80LjCWh06nddalRVV5dFvezXVkJFXAhrmwhmgFDSc13Me18t3MNAOdusjgQ32lHaZGmPkUlafVUQCN1PPY2kOkqWbapiqj7JAmesIUGbz2TgsQsoo-I-o0cM';
const TEST_EMPTY_SCOPE_ENCODED_TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoidW5pcXVlLWlkIiwiaWF0IjoxNTg0OTY1OTY2LCJuYmYiOjE1ODQ5NjU5NjYsImV4cCI6OTk5OTk5OTk5OSwic3ViIjoiMjIiLCJzY29wZXMiOltdfQ.fz80UGeoIKXZloSgS-1K0fnYQdQLIhxZmSTS94aBhX67iS-WdlIvWIXaUIr3JJoXOVvRUxDDzGALUw70xvRIhErCDv0LgOm6Z_nv1WuDhBFkAB4Up3PAH9k6iYi1C6wc7RkRsy4T1Ll_gzxDNnOg1duMM5sSbQ_oR6cF1vvVSM30mUyu34Eyx1WF94yTrDEQ05QpNqu52sqnV4IlQ0OOknNq2WeawWdMe772XIFCRdNrCFWtEs0Mv5c77PhLaakSNz2oZLbhouicNX3UaY9FXGmY9mKMZPrSfPNC5LItr0BZkNHSiZWnrYrBPEoPNG6dpp03BK8Ruce-kP2OVwfsDzzGfgzJj6rjrruZoNNgj_xGh46h33DrYHnI2gPegtdyYJtPWaipA5zAtYOJMe7E8ktHVn1CAGcWfOTjW5r2n4JYtqG0jTZ6pyZQubXwieaPfssQ5OfSsX7KyQwo-0g99H7ymaaodkibUBN3q8fAzLfTNuMhX-4Uij8V1SInN8yPrblLvJUECiD3jNjBvL9ETYlJX-2oov1hFDBNhrGPFmYNwCdkkOiioTBY2I__8tpPfFIAeh4f-o7U_ofU67XFYgv8cRTpHDIrs8io5zbyRrpkqU0wXW5St2-EmlZq-wZKQSeSWVqGdBeloRUpMmyXPpODUqY8ZCmoTpG5SXPgnhE';

describe('JWT', () => {
  it('cannot parse invalid string', () => {
    const wrapper = (): any => new JWT('invalid-string');

    expect(wrapper).toThrowError('Token could not be decoded');
  });

  it('can parse valid string', () => {
    const token = new JWT(TEST_ENCODED_TOKEN);

    // check values
    expect(token.client_id).toBe(TEST_TOKEN_VALUES.client_id);
    expect(token.token_id).toBe(TEST_TOKEN_VALUES.token_id);
    expect(token.issued_at).toStrictEqual(new Date(TEST_TOKEN_VALUES.issued_at * 1000));
    expect(token.expiration).toStrictEqual(
      new Date((TEST_TOKEN_VALUES.expiration - DEFAULT_LEEWAY) * 1000),
    );
    expect(token.not_before).toStrictEqual(new Date(TEST_TOKEN_VALUES.not_before * 1000));
    expect(token.user_id).toBe(TEST_TOKEN_VALUES.user_id);
    expect(token.scopes).toStrictEqual(TEST_TOKEN_VALUES.scopes);
  });

  it('can check if expired', () => {
    const token = new JWT(TEST_ENCODED_TOKEN);
    expect(token.isExpired()).toBe(false);

    const tokenExpired = new JWT(TEST_EXPIRED_ENCODED_TOKEN);
    expect(tokenExpired.isExpired()).toBe(true);
  });

  it('returns scopes as string', () => {
    const token = new JWT(TEST_ENCODED_TOKEN);
    expect(token.scopesAsString()).toBe(TEST_TOKEN_VALUES.scopes.join(' '));

    const tokenEmtpyScope = new JWT(TEST_EMPTY_SCOPE_ENCODED_TOKEN);
    expect(tokenEmtpyScope.scopesAsString()).toBe('*');
  });
});
