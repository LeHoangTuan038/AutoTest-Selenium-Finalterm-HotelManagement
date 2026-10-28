/**
 * JSON Helper utilities for minified single-line serialization
 * Ensures JSON stored/sent is compact (no whitespace/newlines)
 */

/**
 * Safely stringify object to minified single-line JSON
 * @param {any} obj - Object to stringify
 * @param {boolean} [replacerOrSpace=false] - Optional replacer fn or space (ignored if truthy, forces minified)
 * @returns {string} Minified JSON string
 */
export const minifyJson = (obj, replacerOrSpace = false) => {
  try {
    // Always minified: no space arg
    return JSON.stringify(obj, replacerOrSpace && typeof replacerOrSpace === 'function' ? replacerOrSpace : null);
  } catch (error) {
    console.error('JSON stringify failed:', error);
    return '';
  }
};

/**
 * Stringify for display (pretty-print with indent)
 * @param {any} obj
 * @param {number} [space=2]
 * @returns {string}
 */
export const prettyJson = (obj, space = 2) => {
  try {
    return JSON.stringify(obj, null, space);
  } catch (error) {
    console.error('Pretty JSON failed:', error);
    return '[Error formatting JSON]';
  }
};

/**
 * Parse minified JSON safely
 * @param {string} jsonStr
 * @returns {any}
 */
export const safeJsonParse = (jsonStr) => {
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('JSON parse failed:', error);
    return null;
  }
};

