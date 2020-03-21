// publishes utils modules
export { dedupe, implodeMultiple } from './utils/general';
export { parseQueryResult, createQueryParams } from './utils/queryString';
export {
  encodeState,
  decodeState,
  urlEncodeB64,
  urlDecodeB64,
  bufferToBase64UrlEncoded,
} from './utils/base64';
export {
  getCrypto,
  getCryptoSubtle,
  validateCrypto,
  createRandomString,
  sha256,
} from './utils/crypto';

// unused yet
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv

// import fetch from 'unfetch';

// import {
//   DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
//   CLEANUP_IFRAME_TIMEOUT_IN_SECONDS,
// } from './constants';
// import AuthenticationResult from './models/AuthenticationResult';

// const TIMEOUT_ERROR = { error: 'timeout', errorDescription: 'Timeout' };

// export const runIframe = (
//   authorizeUrl: string,
//   eventOrigin: string,
//   timeoutInSeconds: number = DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS,
// ): Promise<AuthenticationResult> => {
//   return new Promise<AuthenticationResult>((res, rej) => {
//     const iframe = window.document.createElement('iframe');
//     iframe.setAttribute('width', '0');
//     iframe.setAttribute('height', '0');
//     iframe.style.display = 'none';

//     const timeoutSetTimeoutId = setTimeout(() => {
//       rej(TIMEOUT_ERROR);
//       window.document.body.removeChild(iframe);
//     }, timeoutInSeconds * 1000);

//     const iframeEventHandler = function(e: MessageEvent): void {
//       if (e.origin != eventOrigin) return;
//       if (!e.data || e.data.type !== 'authorization_response') return;
//       (e.source as any).close();
//       e.data.response.error ? rej(e.data.response) : res(e.data.response);
//       clearTimeout(timeoutSetTimeoutId);
//       window.removeEventListener('message', iframeEventHandler, false);
//       // Delay the removal of the iframe to prevent hanging loading status
//       // in Chrome: https://github.com/auth0/auth0-spa-js/issues/240
//       setTimeout(
//         () => window.document.body.removeChild(iframe),
//         CLEANUP_IFRAME_TIMEOUT_IN_SECONDS * 1000,
//       );
//     };
//     window.addEventListener('message', iframeEventHandler, false);
//     window.document.body.appendChild(iframe);
//     iframe.setAttribute('src', authorizeUrl);
//   });
// };

// const getJSON = async (url: string, options: any): Promise<any> => {
//   const response = await fetch(url, options);
//   const { error, error_description, ...success } = await response.json();
//   if (!response.ok) {
//     const errorMessage = error_description || `HTTP error. Unable to fetch ${url}`;
//     const e = new Error(errorMessage) as any;
//     e.error = error || 'request_error';
//     e.error_description = errorMessage;
//     throw e;
//   }
//   return success;
// };

// export const oauthToken = async ({ baseUrl, ...options }: OAuthTokenOptions): Promise<any> =>
//   await getJSON(`${baseUrl}/oauth/token`, {
//     method: 'POST',
//     body: JSON.stringify({
//       grant_type: 'authorization_code',
//       redirect_uri: window.location.origin,
//       ...options,
//     }),
//     headers: {
//       'Content-type': 'application/json',
//     },
//   });
