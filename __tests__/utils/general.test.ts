import 'fast-text-encoding';
import { implodeMultiple } from '../../src/utils/general';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

describe('utils.general', () => {
  describe('implodeMultiple', () => {
    it('removes duplicates', () => {
      expect(implodeMultiple('openid openid', 'email')).toBe('openid email');
    });

    it('handles whitespace', () => {
      expect(implodeMultiple(' openid    profile  ', ' ')).toBe('openid profile');
    });

    it('handles undefined/empty/null', () => {
      expect(implodeMultiple('openid profile', 'email', undefined, '', null)).toBe(
        'openid profile email',
      );
    });
  });
});
