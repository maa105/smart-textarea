import mapAndKeyBy from 'lib/helpers/mapAndKeyBy';
import React from 'react';
import buildDetailsComponent from './buildDetailsComponent';
import buildSearchComponent from './buildSearchComponent';
import buildSearchResultsPickerComponent from './buildSearchResultsPickerComponent';

const buildMarkerTipComponent = ({
  tipOptions: {markerType, anchorChar, parts},
  isAbortError,
}) => {
  const detailsComponents = mapAndKeyBy(
    parts,
    ({key, details}) => {
      if (!details) {
        return null;
      }
      const {
        Component,
        NotFoundComponent,
        loader,
        getCacheKey,
        shouldReloadData,
        getLoadData,
        LoaderComponent,
        ErrorComponent,
        getCache,
      } = details;
      return buildDetailsComponent({
        markerType,
        anchorChar,
        partKey: key,
        Component,
        NotFoundComponent,
        loader,
        getCacheKey,
        shouldReloadData,
        getLoadData,
        LoaderComponent,
        ErrorComponent,
        getCache,
        isAbortError,
      });
    },
    'key'
  );

  const searchComponents = mapAndKeyBy(
    parts,
    ({
      key,
      search: {
        ResultsComponent,
        ResultItemComponent,
        onItemSelect,
        ZeroSearchResultsComponent = () => 'No matching entries found',
        NoSearchComponent,
        loader,
        filterResults,
        getSearchData,
        autoSelect: baseAutoSelect,
        getCacheKey = searchData => JSON.stringify(searchData),
        LoaderComponent,
        ErrorComponent,
        debounceDuration,
        getCache,
      },
    }) => {
      if (baseAutoSelect && !onItemSelect) {
        throw new Error('autoSelect needs onItemSelect to be defined');
      }
      const autoSelect = baseAutoSelect
        ? params => {
            const {partKey, marker, markers} = params;
            const selectedItem = baseAutoSelect(params);
            if (!selectedItem) {
              return undefined;
            }
            const update = onItemSelect({
              partKey,
              selectedItem,
              marker,
              markers,
            });
            if (update) {
              return {
                data: selectedItem,
                ...update,
              };
            }
            return update;
          }
        : () => undefined;
      return buildSearchComponent({
        markerType,
        anchorChar,
        partKey: key,
        detailsComponents,
        loader,
        filterResults,
        getSearchData,
        getCacheKey,
        NoSearchComponent,
        ZeroSearchResultsComponent,
        ResultsComponent: ResultItemComponent
          ? buildSearchResultsPickerComponent({
              partKey: key,
              ItemComponent: ResultItemComponent,
              ContainerComponent: ResultsComponent,
              onSelect: onItemSelect,
            })
          : ResultsComponent,
        LoaderComponent,
        ErrorComponent,
        debounceDuration,
        getCache,
        autoSelect,
        isAbortError,
      });
    },
    'key'
  );

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
    if (marker.isLocked) {
      const lastPartConfig = marker.partsConfig[marker.partsConfig.length - 1];
      const DetailsComponent = detailsComponents[lastPartConfig.key];
      return (
        <DetailsComponent
          marker={marker}
          markers={markers}
          focusParent={focusParent}
          onHide={onHide}
          markersHandlers={markersHandlers}
          focusImperativeRef={focusImperativeRef}
          menuListId={menuListId}
          menuButtonId={menuButtonId}
        />
      );
    }

    const firstUnresolvedPartIndex = marker.lastResolvedPartIndex + 1;
    const firstUnresolvedPartConfig =
      marker.partsConfig[firstUnresolvedPartIndex];
    const SearchComponent = searchComponents[firstUnresolvedPartConfig.key];

    return (
      <SearchComponent
        marker={marker}
        markers={markers}
        focusParent={focusParent}
        onHide={onHide}
        markersHandlers={markersHandlers}
        focusImperativeRef={focusImperativeRef}
        menuListId={menuListId}
        menuButtonId={menuButtonId}
      />
    );
  };
};

export default buildMarkerTipComponent;
