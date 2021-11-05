import {useEffect, useRef} from 'react';

const buildAutoSelectHook = ({partKey, autoSelect}) => {
  const useAutoSelect = ({
    searchText,
    searchData,
    results,
    marker,
    markers,
    focusParent,
    onHide,
    markersHandlers,
  }) => {
    const mutableRef = useRef({});
    mutableRef.current.searchData = searchData;
    mutableRef.current.marker = marker;
    mutableRef.current.markers = markers;
    mutableRef.current.focusParent = focusParent;
    mutableRef.current.onHide = onHide;
    mutableRef.current.markersHandlers = markersHandlers;

    const isLastPart = marker.parts[marker.parts.length - 1].key === partKey;
    useEffect(() => {
      if (!results) {
        return;
      }
      const {
        searchData,
        marker,
        markers,
        focusParent,
        onHide,
        markersHandlers,
      } = mutableRef.current;
      const update = autoSelect({
        marker,
        markers,
        searchText,
        searchData,
        results,
        isLastPart,
      });
      if (!update) {
        return;
      }
      if (!update.id) {
        throw new Error(
          `autoSelect function in part "${partKey}"'s search options did not return an "id" field which is required`
        );
      }
      const newMarker = markersHandlers.updateMarkerPart(
        {
          marker,
          partKey,
        },
        {
          ...update,
          cursor: update.cursor ?? 'end',
          isLocked: update.isLocked ?? true,
        }
      );
      focusParent();
      if (update.hide || (update.hide === undefined && newMarker?.isLocked)) {
        setTimeout(() => onHide(false));
      }
    }, [results, searchText, isLastPart]);
  };

  return useAutoSelect;
};

export default buildAutoSelectHook;
