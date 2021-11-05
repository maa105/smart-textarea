import {getMarkerPartsSelections} from 'lib/hocs/withMarkerSelection';

const blockPartUpdates = ({marker, selectionStart, selectionEnd}) => {
  const {
    midSelectedPartIndex,
    endSelectedPartIndex,
    startSelectedPartIndex,
    selectedPartRange,
    anchorSelected,
  } = getMarkerPartsSelections({
    marker,
    selectionStart,
    selectionEnd,
  });
  const parts = marker.parts;
  const lastResolvedPartIndex = marker.lastResolvedPartIndex;
  if (midSelectedPartIndex >= 0) {
    const midSelectedPart = parts[midSelectedPartIndex];

    if (midSelectedPart.isLocked) {
      const lastResolvedPart = parts[lastResolvedPartIndex];
      return {
        block: true,
        selectionStart: midSelectedPart.start,
        selectionEnd: lastResolvedPart.end,
      };
    }
  }
  if (endSelectedPartIndex >= 0) {
    const endSelectedPart = parts[endSelectedPartIndex];

    if (endSelectedPart.isLocked) {
      const lastResolvedPart = parts[lastResolvedPartIndex];
      return {
        block: true,
        selectionStart: endSelectedPart.start,
        selectionEnd: Math.max(selectionEnd, lastResolvedPart.end),
      };
    }
  }

  if (
    selectedPartRange.endIndex >= 0 &&
    selectedPartRange.endIndex < lastResolvedPartIndex + 1
  ) {
    const lastResolvedPart = parts[lastResolvedPartIndex];
    return {
      block: true,
      selectionStart,
      selectionEnd: Math.max(selectionEnd, lastResolvedPart.end),
    };
  }

  if (!anchorSelected && startSelectedPartIndex >= 0) {
    const startSelectedPart = parts[startSelectedPartIndex];

    if (startSelectedPart.isLocked) {
      const lastResolvedPart = parts[lastResolvedPartIndex];
      return {
        block: true,
        selectionStart,
        selectionEnd: lastResolvedPart.end,
      };
    }
  }

  return {block: false};
};

export const blockMarkerUpdates = selection => {
  const {
    markers,
    midSelectedMarkerIndex,
    endSelectedMarkerIndex,
    startSelectedMarkerIndex,
  } = selection;

  let {selectionStart, selectionEnd} = selection;

  const midSelectedMarker = markers[midSelectedMarkerIndex];
  const endSelectedMarker = markers[endSelectedMarkerIndex];
  const startSelectedMarker = markers[startSelectedMarkerIndex];

  if (midSelectedMarker) {
    if (midSelectedMarker.isLocked) {
      return {
        block: true,
        selectionStart: midSelectedMarker.start,
        selectionEnd: midSelectedMarker.end,
      };
    }
    return blockPartUpdates({
      marker: midSelectedMarker,
      selectionStart,
      selectionEnd,
    });
  }
  let block = false;
  if (endSelectedMarker) {
    if (endSelectedMarker.isLocked) {
      block = true;
      selectionStart = endSelectedMarker.start;
      selectionEnd = endSelectedMarker.end;
    } else {
      const partBlock = blockPartUpdates({
        marker: endSelectedMarker,
        selectionStart,
        selectionEnd,
      });
      if (partBlock.block) {
        block = true;
        selectionStart = partBlock.selectionStart;
        selectionEnd = partBlock.selectionEnd;
      }
    }
  }
  if (startSelectedMarker) {
    if (startSelectedMarker.isLocked) {
      block = true;
      selectionStart = startSelectedMarker.start;
      selectionEnd = startSelectedMarker.end;
    } else {
      const partBlock = blockPartUpdates({
        marker: startSelectedMarker,
        selectionStart,
        selectionEnd,
      });
      if (partBlock.block) {
        block = true;
        selectionStart = partBlock.selectionStart;
        selectionEnd = partBlock.selectionEnd;
      }
    }
  }
  if (!block) {
    return {
      block: false,
    };
  }
  return {
    block: true,
    selectionStart,
    selectionEnd,
  };
};
