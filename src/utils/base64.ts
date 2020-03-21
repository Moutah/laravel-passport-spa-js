// https://stackoverflow.com/questions/30106476/
const decodeB64 = (input: string): string =>
  decodeURIComponent(
    atob(input)
      .split('')
      .map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(''),
  );

/**
 * Encode given string to base64.
 */
export const encodeState = (str: string): string => btoa(str);

/**
 * Decode given base64 string.
 */
export const decodeState = (str: string): string => atob(str);

/**
 * Encode given string to url compliant base64.
 */
export const urlEncodeB64 = (url: string): string => {
  const b64Chars: any = { '+': '-', '/': '_', '=': '' };
  return url.replace(/[\+\/=]/g, (m: string): string => b64Chars[m]);
};

/**
 * Decode given base64 url part.
 */
export const urlDecodeB64 = (urlPart: string): string =>
  decodeB64(urlPart.replace(/_/g, '/').replace(/-/g, '+'));

/**
 * Encode given array buffer to base64.
 */
export const bufferToBase64UrlEncoded = (arrBuffer: ArrayBuffer): string => {
  const ie11SafeInput = new Uint8Array(arrBuffer);
  return urlEncodeB64(window.btoa(String.fromCharCode(...Array.from(ie11SafeInput))));
};
