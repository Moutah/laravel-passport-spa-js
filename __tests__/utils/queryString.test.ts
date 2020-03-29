import 'fast-text-encoding';
import { parseQueryResult, createQueryParams } from '../../src/utils/queryString';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

describe('utils.queryString', () => {
  describe('parseQueryResult', () => {
    it('parses the query string', () => {
      expect(parseQueryResult('value=test&otherValue=another-test')).toMatchObject({
        value: 'test',
        otherValue: 'another-test',
      });
    });

    it('strips off hash values', () => {
      expect(parseQueryResult('code=some-code&state=some-state#__')).toMatchObject({
        code: 'some-code',
        state: 'some-state',
      });
    });
  });

  describe('createQueryParams', () => {
    it('creates query string from object', () => {
      expect(
        createQueryParams({
          id: 1,
          value: 'test',
          url: 'http://example.com',
          nope: undefined,
        }),
      ).toBe('id=1&value=test&url=http%3A%2F%2Fexample.com');
    });
  });
});
