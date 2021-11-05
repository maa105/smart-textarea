import React, {useEffect} from 'react';

import buildSearchDataLoaderHook from '../hook/buildSearchDataLoaderHook';
import buildAutoSelectHook from '../hook/buildAutoSelectHook';

const buildSearchComponent = ({
  markerType,
  partKey,
  detailsComponents,
  loader,
  filterResults,
  getSearchData,
  getCacheKey,
  getCache,
  ZeroSearchResultsComponent,
  NoSearchComponent,
  ResultsComponent,
  LoaderComponent,
  ErrorComponent,
  debounceDuration,
  autoSelect,
  isAbortError,
}) => {
  const cache = getCache({type: 'search', markerType, partKey});

  const useSearchDataLoader = buildSearchDataLoaderHook({
    partKey,
    loader,
    cache,
    getSearchData,
    getCacheKey,
    filterResults,
    debounceDuration,
    isAbortError,
  });

  const useAutoSelect = buildAutoSelectHook({
    partKey,
    autoSelect,
  });

  return ({
    marker,
    markers,
    focusParent,
    onHide,
    markersHandlers,
    focusImperativeRef,
    menuListId,
    menuButtonId,
  }) => {
    const {noSearch, loading, error, searchText, searchData, results, retry} =
      useSearchDataLoader({
        marker,
        markers,
      });

    useEffect(() => {
      if (noSearch && !NoSearchComponent) {
        onHide();
      }
    }, [noSearch, onHide]);

    useAutoSelect({
      searchText,
      searchData,
      results,
      marker,
      markers,
      focusParent,
      onHide,
      markersHandlers,
    });

    if (noSearch && NoSearchComponent) {
      return (
        <NoSearchComponent
          detailsComponents={detailsComponents}
          partKey={partKey}
          searchText={searchText}
          searchData={searchData}
          marker={marker}
          markers={markers}
          focusParent={focusParent}
          onHide={onHide}
          focusImperativeRef={focusImperativeRef}
          menuListId={menuListId}
          menuButtonId={menuButtonId}
          markersHandlers={markersHandlers}
        />
      );
    }
    if (error) {
      return (
        <ErrorComponent
          error={error}
          retry={retry}
          detailsComponents={detailsComponents}
          partKey={partKey}
          searchText={searchText}
          searchData={searchData}
          marker={marker}
          markers={markers}
          focusParent={focusParent}
          onHide={onHide}
          focusImperativeRef={focusImperativeRef}
          menuListId={menuListId}
          menuButtonId={menuButtonId}
          markersHandlers={markersHandlers}
        />
      );
    }
    if (loading || !results) {
      return (
        <LoaderComponent
          detailsComponents={detailsComponents}
          partKey={partKey}
          searchText={searchText}
          searchData={searchData}
          marker={marker}
          markers={markers}
          focusParent={focusParent}
          onHide={onHide}
          focusImperativeRef={focusImperativeRef}
          menuListId={menuListId}
          menuButtonId={menuButtonId}
          markersHandlers={markersHandlers}
        />
      );
    }
    if (!results.length) {
      return (
        <ZeroSearchResultsComponent
          results={results}
          detailsComponents={detailsComponents}
          partKey={partKey}
          searchText={searchText}
          searchData={searchData}
          marker={marker}
          markers={markers}
          focusParent={focusParent}
          onHide={onHide}
          focusImperativeRef={focusImperativeRef}
          menuListId={menuListId}
          menuButtonId={menuButtonId}
          markersHandlers={markersHandlers}
        />
      );
    }
    return (
      <ResultsComponent
        results={results}
        detailsComponents={detailsComponents}
        partKey={partKey}
        searchText={searchText}
        searchData={searchData}
        marker={marker}
        markers={markers}
        focusParent={focusParent}
        onHide={onHide}
        focusImperativeRef={focusImperativeRef}
        menuListId={menuListId}
        menuButtonId={menuButtonId}
        markersHandlers={markersHandlers}
      />
    );
  };
};

export default buildSearchComponent;
