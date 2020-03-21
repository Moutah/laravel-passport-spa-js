/**
 * Returns an array with unique values of the given array.
 */
export const dedupe = (arr: any[]): any[] => arr.filter((x, i) => arr.indexOf(x) === i);

/**
 * Implode given `string` `string[]` inputs to a string with only unique values separated by `' '`.
 * Input strings containing coma separated list are splitted into arrays of string.
 */
export const implodeMultiple = (...input: string[]): string => {
  // remove falsy values
  const values = input.filter(Boolean).join();

  // get unique values
  const uniqueValues = dedupe(values.replace(/\s/g, ',').split(','));

  return uniqueValues.join(' ').trim();
};
