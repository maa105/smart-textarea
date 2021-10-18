export const blockMarkerUpdates = selection => {
  const {
    markers,
    midSelectedMarkerIndex,
    endSelectedMarkerIndex,
    startSelectedMarkerIndex,
  } = selection;

  const midSelectedMarker = markers[midSelectedMarkerIndex];
  const endSelectedMarker = markers[endSelectedMarkerIndex];
  const startSelectedMarker = markers[startSelectedMarkerIndex];

  if (midSelectedMarker && midSelectedMarker.isLocked) {
    return {
      block: true,
      selectionStart: midSelectedMarker.start,
      selectionEnd: midSelectedMarker.end,
    };
  }
  if (endSelectedMarker && endSelectedMarker.isLocked) {
    return {
      block: true,
      selectionStart: endSelectedMarker.start,
      selectionEnd: endSelectedMarker.end,
    };
  }
  if (startSelectedMarker && startSelectedMarker.isLocked) {
    return {
      block: true,
      selectionStart: startSelectedMarker.start,
      selectionEnd: startSelectedMarker.end,
    };
  }
  return {
    block: false,
  };
};
