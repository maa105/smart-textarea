export const blockMarkerUpdates = ({selection, lastKey}) => {
  const {
    markers,
    markerWithStartTouchedIndex,
    markerWithEndTouchedIndex,
    selectionStart,
    selectionEnd,
  } = selection;

  if (selectionStart !== selectionEnd) {
    return {
      block: false,
    };
  }

  const markerWithStartTouched = markers[markerWithStartTouchedIndex];
  const markerWithEndTouched = markers[markerWithEndTouchedIndex];

  if (lastKey === 'Backspace') {
    if (markerWithEndTouched && markerWithEndTouched.isLocked) {
      return {
        block: true,
        selectionStart: markerWithEndTouched.start,
        selectionEnd: markerWithEndTouched.end,
      };
    }
  } else if (lastKey === 'Delete') {
    if (markerWithStartTouched && markerWithStartTouched.isLocked) {
      return {
        block: true,
        selectionStart: markerWithStartTouched.start,
        selectionEnd: markerWithStartTouched.end,
      };
    }
  }
  return {
    block: false,
  };
};
