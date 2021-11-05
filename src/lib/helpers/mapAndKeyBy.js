/**
 * @template I
 * @template O
 * @callback MapFunction
 * @param {I} item
 * @param {number} index
 * @param {I[]} array
 * @returns {O}
 */

/**
 * @template I
 * @callback KeyFunction
 * @param {I} item
 * @returns {string}
 */

/**
 * @template I
 * @template O
 * @param {I[]} array
 * @param {MapFunction<I,O>} mapFunction
 * @param {KeyFunction<I> | string} keyFunction
 * @returns {Object<string, O>}
 */
const mapAndKeyBy = (array, mapFunction, keyFunction) => {
  if (typeof keyFunction !== 'function') {
    const key = keyFunction;
    keyFunction = item => item[key];
  }
  const keyed = {};
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    keyed[keyFunction(item)] = mapFunction(item, i, array);
  }
  return keyed;
};

export default mapAndKeyBy;
