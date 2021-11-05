import React from 'react';
import buildDetailsDataLoaderHook from '../hook/buildDetailsDataLoaderHook';

const buildDetailsComponent = ({
  markerType,
  partKey,
  Component,
  NotFoundComponent,
  loader,
  shouldReloadData,
  getLoadData,
  getCacheKey,
  LoaderComponent,
  ErrorComponent,
  getCache,
  isAbortError,
}) => {
  const cache = getCache({type: 'details', markerType, partKey});

  NotFoundComponent = NotFoundComponent || Component;

  const useDetailDataLoader = buildDetailsDataLoaderHook({
    partKey,
    loader,
    cache,
    getLoadData,
    getCacheKey,
    shouldReloadData,
    isAbortError,
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
    const {loading, error, data, loadData, retry} = useDetailDataLoader({
      marker,
      markers,
      markersHandlers,
    });

    if (error) {
      return (
        <ErrorComponent
          error={error}
          retry={retry}
          partKey={partKey}
          loadData={loadData}
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

    if (data === null) {
      return (
        <NotFoundComponent
          data={null}
          partKey={partKey}
          loadData={loadData}
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

    if (loading || !data) {
      return (
        <LoaderComponent
          partKey={partKey}
          loadData={loadData}
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
      <Component
        data={data}
        partKey={partKey}
        loadData={loadData}
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

export default buildDetailsComponent;
