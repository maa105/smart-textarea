const ensureLoaderIsAsync =
  loader =>
  (...args) => {
    const ret = loader(...args);
    return Promise.resolve().then(() => ret);
  };

export default ensureLoaderIsAsync;
