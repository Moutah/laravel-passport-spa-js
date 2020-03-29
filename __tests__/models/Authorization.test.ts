import 'fast-text-encoding';
import { Authorization } from '../../src/models/Authorization';
import { STORAGE_PREFIX } from '../../src/constants';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

const TEST_SCOPES = 'custom scopes';
const TEST_STATE = 'leState';
const TEST_CODE = 'leAwesomeCode';
const TEST_CODE_VERIFIER = 'leVerifier';

const setup = (): { authorization: Authorization } => {
  // create client
  const authorization = new Authorization({ code: TEST_CODE, state: TEST_STATE });

  // add stored state
  localStorage.setItem(
    STORAGE_PREFIX + TEST_STATE,
    JSON.stringify({ v: TEST_CODE_VERIFIER, s: TEST_SCOPES }),
  );

  return { authorization };
};

describe('Authorization', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is not loaded upon creation', () => {
    const { authorization } = setup();

    expect(authorization.code_verifier).toBeUndefined();
    expect(authorization.scope).toBeUndefined();
  });

  it('cannot load if no state stored', () => {
    const { authorization } = setup();

    // make sure storage is empty
    localStorage.clear();

    const wrapper = (): any => authorization.getSignature();

    expect(wrapper).toThrowError(`No code verifier for this state (${TEST_STATE}).`);

    // nothing loaded
    expect(authorization.code_verifier).toBeUndefined();
    expect(authorization.scope).toBeUndefined();
  });

  it('can load if state stored and cleanup storage', () => {
    const { authorization } = setup();

    const signature = authorization.getSignature();

    // extracted from storage
    expect(localStorage.getItem).toHaveBeenLastCalledWith(STORAGE_PREFIX + TEST_STATE);
    expect(localStorage.removeItem).toHaveBeenLastCalledWith(STORAGE_PREFIX + TEST_STATE);

    // filled signature
    expect(signature.code).toBe(TEST_CODE);
    expect(signature.code_verifier).toBe(TEST_CODE_VERIFIER);
  });

  it('loads only once', () => {
    const { authorization } = setup();

    // first time will load from storage
    const signature = authorization.getSignature();
    expect(localStorage.getItem).toHaveBeenCalledTimes(1);
    expect(signature.code).toBe(TEST_CODE);
    expect(signature.code_verifier).toBe(TEST_CODE_VERIFIER);

    // second time will not call storage again
    const signature_copy = authorization.getSignature();
    expect(localStorage.getItem).toHaveBeenCalledTimes(1);
    expect(signature_copy.code).toBe(TEST_CODE);
    expect(signature_copy.code_verifier).toBe(TEST_CODE_VERIFIER);
  });
});
