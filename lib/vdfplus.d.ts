/**
 * Convert a VDF string into a JavaScript Object
 *
 * @param {string} str VDF string that will be parsed into an object
 * @param {boolean} [types=true]  Set data type casting
 * @returns {object} Resulting object
 */
export declare function parse(str: string, types?: boolean): object;
/**
 * Convert a JavaScript object to a VDF string
 *
 * @param {*} value A JavaScript object to be converted
 * @param {(number | string)} [indentation=2] Indentation of whitespace characters. Accepts numbers or a string containing whitespace characters. Strings longer than 10 characters will be cut off. If an empty string is passed, the output will omit line breaks
 * @param {string} [separator="\t"] Separator character in between key-value pairs. Accepts number or a string containing whitespace characters.
 * @returns
 */
export declare function stringify(value: any, indentation?: number | string, separator?: number | string): string;
