import 'fast-text-encoding';
import { cleanUrl } from '../../src/utils/xhr';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

describe('utils.xhr', () => {
  describe('getJSON', () => {
    let getJSON: any;
    let mockUnfetch: any;

    beforeEach(() => {
      jest.resetModules();
      jest.mock('unfetch');
      mockUnfetch = require('unfetch');
      getJSON = require('../../src/utils/xhr').getJSON;
    });

    it('calls runs the XTTHP request with the given url / options', async () => {
      mockUnfetch.mockReturnValue(
        new Promise(res => res({ ok: true, json: () => new Promise(ress => ress(true)) })),
      );

      const options = {
        method: 'POST',
        body: '{foo:"bar"}',
      };

      await getJSON('https://test.com', options);

      expect(mockUnfetch).toHaveBeenCalledWith('https://test.com', {
        ...options,
        headers: { 'Content-type': 'application/json' },
      });
    });

    it('handles error with error response', async () => {
      const theError = {
        error: 'the-error',
        error_description: 'the-error-description',
      };
      mockUnfetch.mockReturnValue(
        new Promise(res =>
          res({
            ok: false,
            json: () => new Promise(ress => ress(theError)),
          }),
        ),
      );
      try {
        await getJSON('https://test.com');
      } catch (error) {
        expect(error.message).toBe(theError.error_description);
        expect(error.error).toBe(theError.error);
        expect(error.error_description).toBe(theError.error_description);
      }
    });

    it('handles error without error response', async () => {
      mockUnfetch.mockReturnValue(
        new Promise(res =>
          res({
            ok: false,
            json: () => new Promise(ress => ress(false)),
          }),
        ),
      );
      try {
        await getJSON('https://test.com');
      } catch (error) {
        expect(error.message).toBe(`HTTP error. Unable to fetch https://test.com`);
        expect(error.error).toBe('request_error');
        expect(error.error_description).toBe(`HTTP error. Unable to fetch https://test.com`);
      }
    });
  });

  describe('cleanUrl', () => {
    it('builds url with no consecutive /', async () => {
      const cleanedUrl = cleanUrl('https://www.test.com//clumsy///url');
      expect(cleanedUrl).toBe('https://www.test.com/clumsy/url');
    });

    it('builds url with no trailing /', async () => {
      const cleanedUrl = cleanUrl('https://www.test.com/');
      expect(cleanedUrl).toBe('https://www.test.com');
    });

    it('builds url with https', async () => {
      const cleanedUrlA = cleanUrl('http://www.test.com');
      const cleanedUrlB = cleanUrl('www.test.com');
      expect(cleanedUrlA).toBe('https://www.test.com');
      expect(cleanedUrlB).toBe('https://www.test.com');
    });
  });
});
