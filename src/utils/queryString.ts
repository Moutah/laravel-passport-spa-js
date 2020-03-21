/**
 * Parse the given query string and returns it as a key-value dictionnary.
 */
export const parseQueryResult = (queryString: string): any => {
  if (queryString.indexOf('#') > -1) {
    queryString = queryString.substr(0, queryString.indexOf('#'));
  }

  const queryParams = queryString.split('&');

  const parsedQuery: any = {};
  queryParams.forEach(qp => {
    const [key, val] = qp.split('=');
    parsedQuery[key] = decodeURIComponent(val);
  });

  return {
    ...parsedQuery,
    expires_in: parseInt(parsedQuery.expires_in),
  };
};

/**
 * Concatenates the given key-value dictionnary into a query string.
 *
 * Note that is not prefiexed with a question mark!
 */
export const createQueryParams = (params: any): string => {
  return Object.keys(params)
    .filter(k => typeof params[k] !== 'undefined')
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    .join('&');
};
