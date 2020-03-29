/**
 * The amount of seconds to wait on an authorization request before bailing.
 */
export const DEFAULT_AUTHORIZE_TIMEOUT_IN_SECONDS = 20;

/**
 * Duration in seconds to substract from JWT expiration date to avoid expiration occuring too
 * close from the request.
 */
export const DEFAULT_LEEWAY = 10;

/**
 * The prefix to use for all url endpoints on the authentication server domain.
 */
export const DEFAULT_OAUTH_PREFIX = 'oauth';

/**
 * The scope to use if none provided.
 */
export const DEFAULT_SCOPE = '*';

/**
 * If the client will automatically refresh its token.
 */
export const DEFAULT_AUTO_REFRESH = true;

/**
 * The prefix to use for the entires in client's storage.
 */
export const STORAGE_PREFIX = 'lpjs.';
