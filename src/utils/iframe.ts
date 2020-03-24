// unused yet
// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv

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
