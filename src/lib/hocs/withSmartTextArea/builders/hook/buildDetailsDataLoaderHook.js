import {useRef, useState, useCallback, useEffect} from 'react';
import AbortController from 'abort-controller';

const buildDetailsDataLoaderHook = ({
  partKey,
  loader,
  cache,
  getLoadData,
  getCacheKey = loadData => JSON.stringify(loadData),
  shouldReloadData = () => false,
  isAbortError,
}) => {
  getLoadData =
    getLoadData ||
    (({marker}) => {
      const partsConfig = marker.partsConfig;
      const partsIds = marker.partsIds;
      const loadData = {};
      for (let i = 0; i < partsConfig.length; i++) {
        const currPartKey = partsConfig[i].key;
        loadData[currPartKey] = partsIds[currPartKey];
        if (currPartKey === partKey) {
          return loadData;
        }
      }
      return loadData;
    });

  const useDetailsDataLoader = ({marker, markers, markersHandlers}) => {
    const mutableRef = useRef({});

    const [{loading, error, retry}, setResultData] = useState({});

    const data = marker.partsData[partKey];
    const doLoad = data === undefined || shouldReloadData(data);
    const loadData = doLoad ? getLoadData({partKey, marker, markers}) : null;
    const cacheKey = loadData ? getCacheKey(loadData) : null;

    mutableRef.current.loadData = loadData;
    mutableRef.current.markersHandlers = markersHandlers;
    mutableRef.current.cacheKey = cacheKey;
    mutableRef.current.marker = marker;

    const retryFunction = useCallback(
      () =>
        setResultData(resultData => ({
          ...resultData,
          retry: (resultData.retry ?? 0) + 1,
        })),
      []
    );

    useEffect(() => {
      const {loadData, marker} = mutableRef.current;
      if (!loadData) {
        return undefined;
      }
      const cachedData = cache.getItem(cacheKey);
      if (cachedData || cachedData === null) {
        mutableRef.current.markersHandlers.updateMarkerPart(
          {
            partKey,
            marker,
          },
          {
            data: cachedData,
          }
        );
        setResultData({});
        return undefined;
      }
      const abortCtrl = new AbortController();
      setResultData({loading: true});
      loader(loadData, abortCtrl.signal)
        .then(result => {
          result = result ?? null;
          cache.setItem(cacheKey, result);
          if (cacheKey === mutableRef.current.cacheKey) {
            mutableRef.current.markersHandlers.updateMarkerPart(
              {
                partKey,
                marker,
              },
              {
                data: result,
              }
            );
            setResultData({});
          }
        })
        .catch(error => {
          if (isAbortError(error)) {
            return;
          }
          if (cacheKey === mutableRef.current.cacheKey) {
            setResultData({error});
          }
        });
      return () => abortCtrl.abort();
    }, [cacheKey, retry]);

    return {loading, error, loadData, data, retry: retryFunction};
  };
  return useDetailsDataLoader;
};

export default buildDetailsDataLoaderHook;
