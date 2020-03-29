// polyfill bar minimum fetch module
import fetch from 'unfetch';

/**
 * Fetch the given url with given options. Add the `"Content-type": "application/json"` header.
 * @param url
 * @param options
 */
export const getJSON = async (url: string, options: any): Promise<any> => {
  // create option with headers key
  const opt = {
    headers: {},
    ...options,
  };

  // set the headers' content-type
  opt.headers['Content-type'] = 'application/json';

  // run fetch
  const response = await fetch(url, opt);
  const { error, error_description, ...success } = await response.json();

  // error
  if (!response.ok) {
    const errorMessage = error_description || `HTTP error. Unable to fetch ${url}`;
    const e = new Error(errorMessage) as any;
    e.error = error || 'request_error';
    e.error_description = errorMessage;
    throw e;
  }

  return success;
};

/**
 * Cleans the given url and enforces https protocol.
 * @param url
 */
export const cleanUrl = (url: string): string => {
  const protocolLessUrl = url
    .replace(/http(s*)\:\/\//, '')
    .replace(/\/$/, '')
    .replace(/\/{2,}/g, '/');
  return `https://${protocolLessUrl}`;
};
