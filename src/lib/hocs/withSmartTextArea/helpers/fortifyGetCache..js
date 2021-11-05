const fortifyGetCache = getCache => options => {
  const cache = getCache(options);
  return {
    getItem: cacheKey => {
      try {
        return cache.getItem(cacheKey);
      } catch (err) {
        console.error('error getting cache item', err);
        return undefined;
      }
    },
    setItem: (cacheKey, value) => {
      try {
        cache[cacheKey] = value;
      } catch (err) {
        console.error('error setting cache item', err);
      }
    },
  };
};

export default fortifyGetCache;
