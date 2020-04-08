import 'fast-text-encoding';
import { runIframe } from '../../src/utils/iframe';
import { DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS } from '../../src/constants';

const TEST_QUERY_STRING = 'query=string';

// define global context
declare const global: any;
global.TextEncoder = TextEncoder;

const setup = (): any => {
  const iframeEvents: { [eventName: string]: () => any } = {};
  const mockedIframe = {
    setAttribute: jest.fn(),
    contentWindow: {
      addEventListener: jest.fn((eventName: string, callback: () => any): void => {
        iframeEvents['contentWindow.' + eventName] = callback;
      }),
      location: {
        search: `?${TEST_QUERY_STRING}`,
      },
    },
    addEventListener: jest.fn((eventName: string, callback: () => any): void => {
      iframeEvents['iframe.' + eventName] = callback;
    }),
    style: { display: '' },
    isDeleted: false,
    manuallyTriggerEvent(eventName: string): any {
      if (iframeEvents[eventName]) {
        iframeEvents[eventName]();
      }
    },
  };

  // mock createElement expecting iframe element
  window.document.createElement = jest.fn(type => {
    expect(type).toBe('iframe');
    return mockedIframe;
  }) as any;

  // mock append / remove child
  window.document.body.appendChild = jest.fn();
  window.document.body.removeChild = jest.fn();
  window.document.body.contains = jest.fn((node: any) => node && !node.isDeleted);

  return { iframe: mockedIframe };
};

describe('utils.iframe', () => {
  describe('runIframe', () => {
    it('handles iframe correctly', async () => {
      jest.useFakeTimers();
      const { iframe } = setup();

      const url = `https://www.url.com/?${TEST_QUERY_STRING}`;

      // manually tirgger event on next loop
      Promise.resolve().then(() => {
        iframe.manuallyTriggerEvent('contentWindow.DOMContentLoaded');

        // manually remove iframe
        iframe.isDeleted = true;

        // subsequent load-like events are ignored
        iframe.manuallyTriggerEvent('contentWindow.DOMContentLoaded');
      });
      const iframeResult = await runIframe(url);

      expect(window.document.body.appendChild).toHaveBeenCalledWith(iframe);
      expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
      expect(iframe.setAttribute.mock.calls).toMatchObject([
        ['width', '0'],
        ['height', '0'],
        ['src', url],
      ]);
      expect(iframe.style.display).toBe('none');
      expect(iframe.contentWindow.addEventListener).toHaveBeenCalledWith(
        'DOMContentLoaded',
        expect.any(Function),
      );
      expect(iframeResult).toBe(TEST_QUERY_STRING);
    });

    it('handles empty response', async () => {
      jest.useFakeTimers();
      const { iframe } = setup();

      const url = `https://www.url.com/`;

      // manually tirgger event on next loop
      Promise.resolve().then(() => {
        iframe.contentWindow = null;
        iframe.manuallyTriggerEvent('contentWindow.DOMContentLoaded');
      });
      const iframeResult = await runIframe(url);

      expect(iframeResult).toBe('');
    });

    it('handles timeout', async () => {
      jest.useFakeTimers();
      const { iframe } = setup();

      const url = `https://www.url.com/?${TEST_QUERY_STRING}`;

      // fast forward on next loop
      Promise.resolve().then(() => {
        jest.runAllTimers();
      });

      expect.assertions(3); // third is in addElement mock
      await expect(runIframe(url)).rejects.toEqual('Timeout');
      expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
    });

    it('handles timeout even if node removed already', async () => {
      jest.useFakeTimers();
      const { iframe } = setup();

      const url = `https://www.url.com/?${TEST_QUERY_STRING}`;

      Promise.resolve().then(() => {
        // mark iframe as removed
        iframe.isDeleted = true;

        // fast forward on next loop
        jest.runAllTimers();
      });

      expect.assertions(3); // third is in addElement mock
      await expect(runIframe(url)).rejects.toEqual('Timeout');
      expect(window.document.body.removeChild).not.toHaveBeenCalled();
    });

    it('handles custom timeout', async () => {
      jest.useFakeTimers();
      const { iframe } = setup();

      const url = `https://www.url.com/?${TEST_QUERY_STRING}`;
      const customTimeout = 3 * DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS;

      let isIframeDone = false;
      let iframeStatus = '';
      runIframe(url, customTimeout)
        .then((): any => {
          iframeStatus = 'success';
          isIframeDone = true;
        })
        .catch((): any => {
          iframeStatus = 'failure';
          isIframeDone = true;
        });

      // nothing happened
      expect(isIframeDone).toBe(false);
      expect(iframeStatus).toBe('');

      // advance timers by the usual timeout delay
      jest.advanceTimersByTime(1.1 * DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS * 1000);

      await Promise.resolve().then(() => {
        // nothing happened
        expect(isIframeDone).toBe(false);
        expect(iframeStatus).toBe('');
      });

      // fast forward to the end
      jest.runAllTimers();

      // wait for promise resolution
      // we need the two promises in order for the runIframe promise's callbacks to
      // have been called
      await Promise.resolve();
      await Promise.resolve().then(() => {
        // iframe timed out
        expect(isIframeDone).toBe(true);
        expect(iframeStatus).toBe('failure');
        expect(window.document.body.removeChild).toHaveBeenCalledWith(iframe);
      });
    });
  });
});
