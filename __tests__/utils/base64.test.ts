import 'fast-text-encoding';
import {
  encodeState,
  decodeState,
  urlDecodeB64,
  bufferToBase64UrlEncoded,
} from '../../src/utils/base64';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

describe('utils.base64', () => {
  describe('encodeState', () => {
    it('encodes state', () => {
      expect(encodeState('test')).toBe('dGVzdA==');
    });
  });

  describe('decodeState', () => {
    it('decodes state', () => {
      expect(decodeState('dGVzdA==')).toBe('test');
    });
  });

  describe('urlDecodeB64', () => {
    let oldATOB: any;

    beforeEach(() => {
      oldATOB = global.atob;
      global.atob = jest.fn(s => s);
    });

    afterEach(() => {
      global.atob = oldATOB;
    });

    it('decodes string correctly', () => {
      expect(urlDecodeB64('abc@123-_')).toBe('abc@123+/');
      expect(atob).toHaveBeenCalledWith('abc@123+/');
    });

    it('decodes string with utf-8 chars', () => {
      // restore atob to the default atob
      global.atob = oldATOB;

      // first we use encodeURIComponent to get percent-encoded UTF-8,
      // then we convert the percent encodings into raw bytes which
      // can be fed into btoa.
      // https://stackoverflow.com/questions/30106476/
      const b64EncodeUnicode = (str: string): string =>
        btoa(
          encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
            String.fromCharCode(('0x' + p1) as any),
          ),
        );
      const input = 'Błżicz@123!!';
      const encoded = b64EncodeUnicode(input);
      const output = urlDecodeB64(encoded);
      expect(output).toBe(input);
    });
  });

  describe('bufferToBase64UrlEncoded ', () => {
    it('generates correct base64 encoded value from a buffer', async () => {
      const result = bufferToBase64UrlEncoded(new Uint16Array([116, 101, 115, 116]));
      expect(result).toBe('dGVzdA');
    });
  });

  describe('bufferToBase64UrlEncoded mock', () => {
    let oldBTOA: any;
    beforeEach(() => {
      oldBTOA = global.btoa;
      global.btoa = jest.fn(s => s);
    });
    afterEach(() => {
      global.btoa = oldBTOA;
    });
    it('decodes input in a safe way for urls', () => {
      const input = 'abc@123+/=';
      expect(bufferToBase64UrlEncoded(new TextEncoder().encode(input))).toBe('abc@123-_');
      expect(btoa).toHaveBeenCalledWith(input);
    });
  });
});
