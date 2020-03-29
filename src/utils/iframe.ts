import { DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS } from './../constants';

/**
 * Inject an iframe to the DOM with the given url as `src` attribute. When the `'DOMContentLoaded'`
 * event is fired on the iframe, resolves on its `location.search` value and remove the iframe from
 * the DOM. The function rejects if the event is not captured before the given `timeoutInSeconds`.
 * @param url
 * @param timeoutInSeconds
 */
export const runIframe = (
  url: string,
  timeoutInSeconds: number = DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    // make iframe element
    const iframe = window.document.createElement('iframe');
    iframe.setAttribute('width', '0');
    iframe.setAttribute('height', '0');
    iframe.style.display = 'none';

    // timeout fallback
    const cleanupTimeout = setTimeout(() => {
      window.document.body.removeChild(iframe);
      reject('Timeout');
    }, timeoutInSeconds * 1000);

    // handle iframe loaded
    const iframeLoadedHandler = (): void => {
      let search = '';
      try {
        search = iframe.contentWindow ? iframe.contentWindow.location.search : '';
      } catch {
        // iframe cannot be accessed
      }

      // remove iframe and resolve
      clearTimeout(cleanupTimeout);
      window.document.body.removeChild(iframe);
      resolve(search.substr(1));
    };

    // add iframe to DOM
    window.document.body.appendChild(iframe);
    (iframe.contentWindow as Window).addEventListener('DOMContentLoaded', iframeLoadedHandler);
    iframe.addEventListener('load', iframeLoadedHandler);
    iframe.setAttribute('src', url);
  });
};
