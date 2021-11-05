const defaultGetCache = () => {
  const cache = {};
  return {
    getItem: cacheKey => cache[cacheKey],
    setItem: (cacheKey, value) => {
      cache[cacheKey] = value;
    },
  };
};

export default defaultGetCache;
