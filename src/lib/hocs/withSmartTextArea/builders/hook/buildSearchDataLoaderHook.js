import useDebounceValue from 'lib/hooks/useDebounceValue';
import {useCallback, useEffect, useRef, useState} from 'react';
import AbortController from 'abort-controller';

const buildSearchDataLoaderHook = ({
  partKey,
  loader,
  cache,
  getSearchData = ({searchText, marker}) => ({
    searchText,
    partsIds: marker.partsIds,
  }),
  getCacheKey = searchData => JSON.stringify(searchData),
  filterResults,
  debounceDuration,
  isAbortError,
}) => {
  const useSearchDataLoader = ({marker, markers}) => {
    const mutableRef = useRef({});

    const searchText = marker.partsText[partKey];

    const searchData =
      getSearchData({
        searchText,
        partKey,
        marker,
        markers,
      }) ?? null;

    const cacheKey = searchData != null ? getCacheKey(searchData) : null;
    const debouncedCacheKey = useDebounceValue(cacheKey, debounceDuration);

    const noSearch = cacheKey === null;

    const [{loading, error, results, resultsCacheKey, retry}, setResultsData] =
      useState({});

    const isResultForCurrentSearch = resultsCacheKey === cacheKey;

    mutableRef.current.marker = marker;
    mutableRef.current.markers = markers;
    mutableRef.current.searchData = searchData;

    const retryFunction = useCallback(
      () =>
        setResultsData(resultsData => ({
          ...resultsData,
          retry: (resultsData.retry ?? 0) + 1,
        })),
      []
    );

    useEffect(() => {
      mutableRef.current.cacheKey = debouncedCacheKey;
      if (debouncedCacheKey === null) {
        setResultsData({});
        return undefined;
      }

      const searchData = mutableRef.current.searchData;

      const cachedResults = cache.getItem(debouncedCacheKey);
      if (cachedResults) {
        setResultsData({
          results: filterResults(cachedResults, searchData),
          resultsCacheKey: debouncedCacheKey,
        });
        return undefined;
      }
      const abortCtrl = new AbortController();
      setResultsData({loading: true});
      loader(searchData, abortCtrl.signal)
        .then(results => {
          cache.setItem(debouncedCacheKey, results);
          if (mutableRef.current.cacheKey === debouncedCacheKey) {
            setResultsData({
              results: filterResults(results, searchData),
              resultsCacheKey: debouncedCacheKey,
            });
          }
        })
        .catch(error => {
          if (isAbortError(error)) {
            return;
          }
          if (mutableRef.current.cacheKey === debouncedCacheKey) {
            setResultsData({error});
          }
        });
      return () => abortCtrl.abort();
    }, [debouncedCacheKey, retry]);

    return {
      noSearch,
      loading,
      error: isResultForCurrentSearch ? error : null,
      searchText,
      searchData,
      results: isResultForCurrentSearch ? results : null,
      retry: retryFunction,
    };
  };

  return useSearchDataLoader;
};

export default buildSearchDataLoaderHook;
