import React, {forwardRef, useRef} from 'react';
import mergeRefs from '../helpers/mergeRefs';

const getInEditMarkerIndex = selection =>
  selection.midSelectedMarkerIndex >= 0
    ? selection.midSelectedMarkerIndex
    : selection.endSelectedMarkerIndex >= 0
    ? selection.endSelectedMarkerIndex
    : selection.markerWithEndTouchedIndex >= 0
    ? selection.markerWithEndTouchedIndex
    : -1;
const withInEditMarkerIndex = selection => {
  const inEditMarkerIndex = getInEditMarkerIndex(selection);
  selection.inEditMarkerIndex = inEditMarkerIndex;
  return selection;
};

export const getSelections = ({
  partsOrMarkers,
  selectionStart,
  selectionEnd,
}) => {
  const selectedRange = {startIndex: -1, endIndex: -1};
  let startSelectedIndex = -1;
  let endSelectedIndex = -1;
  let midSelectedIndex = -1;
  let startTouchedIndex = -1;
  let endTouchedIndex = -1;
  let prevIndex;
  let nextIndex;
  let i = 0;

  const getReturn = () => ({
    selectedRange,
    startSelectedIndex,
    endSelectedIndex,
    midSelectedIndex,
    startTouchedIndex,
    endTouchedIndex,
    prevIndex,
    nextIndex:
      (nextIndex ?? -1) >= partsOrMarkers.length ? -1 : nextIndex ?? -1,
  });

  for (
    ;
    i < partsOrMarkers.length && partsOrMarkers[i].end < selectionStart;
    i++
  );

  prevIndex = i - 1;

  let part = partsOrMarkers[i];
  if (!part) {
    return getReturn();
  }

  if (part.end === selectionStart) {
    endTouchedIndex = prevIndex = i;
    i++;
    part = partsOrMarkers[i];
    if (!part) {
      return getReturn();
    }
  }

  if (part.start >= selectionEnd) {
    nextIndex = i;
    if (part.start === selectionEnd) {
      startTouchedIndex = i;
    }
    return getReturn();
  }

  let startTotallySelected =
    selectionStart <= part.start && part.start < selectionEnd;
  let endTotallySelected =
    selectionStart < part.end && part.end <= selectionEnd;
  let totalySelected = startTotallySelected && endTotallySelected;
  const midSelected = !startTotallySelected && !endTotallySelected;

  if (midSelected) {
    midSelectedIndex = i;
    nextIndex = i + 1;
    return getReturn();
  }
  if (!totalySelected) {
    if (startTotallySelected) {
      startSelectedIndex = i;
      nextIndex = i + 1;
      return getReturn();
    }

    endSelectedIndex = i;
    i++;
    part = partsOrMarkers[i];
    if (!part) {
      return getReturn();
    }

    startTotallySelected =
      selectionStart <= part.start && part.start < selectionEnd;
    endTotallySelected = selectionStart < part.end && part.end <= selectionEnd;
    totalySelected = startTotallySelected && endTotallySelected;

    if (!totalySelected) {
      if (startTotallySelected) {
        nextIndex = i + 1;
        startSelectedIndex = i;
      } else {
        nextIndex = i;
        if (part.start === selectionEnd) {
          startTouchedIndex = i;
        }
      }
      return getReturn();
    }
  }
  selectedRange.startIndex = i;

  i++;
  for (; i < partsOrMarkers.length; i++) {
    part = partsOrMarkers[i];

    startTotallySelected =
      selectionStart <= part.start && part.start < selectionEnd;
    endTotallySelected = selectionStart < part.end && part.end <= selectionEnd;
    totalySelected = startTotallySelected && endTotallySelected;

    if (!totalySelected) {
      if (startTotallySelected) {
        nextIndex = i + 1;
        startSelectedIndex = i;
      } else {
        nextIndex = i;
        if (part.start === selectionEnd) {
          startTouchedIndex = i;
        }
      }
      break;
    }
  }
  selectedRange.endIndex = i;
  return getReturn();
};

export const getMarkerSelections = ({
  markers,
  selectionStart,
  selectionEnd,
}) => {
  const {
    selectedRange: selectedMarkersRange,
    startSelectedIndex: startSelectedMarkerIndex,
    endSelectedIndex: endSelectedMarkerIndex,
    midSelectedIndex: midSelectedMarkerIndex,
    startTouchedIndex: markerWithStartTouchedIndex,
    endTouchedIndex: markerWithEndTouchedIndex,
    prevIndex: prevMarkerIndex,
    nextIndex: nextMarkerIndex,
  } = getSelections({
    partsOrMarkers: markers,
    selectionStart,
    selectionEnd,
  });
  return withInEditMarkerIndex({
    markers,
    selectedMarkersRange,
    startSelectedMarkerIndex,
    endSelectedMarkerIndex,
    midSelectedMarkerIndex,
    markerWithStartTouchedIndex,
    markerWithEndTouchedIndex,
    prevMarkerIndex,
    nextMarkerIndex,
  });
};

export const getMarkerPartsSelections = ({
  marker,
  selectionStart,
  selectionEnd,
}) => {
  const parts = marker.parts;

  const {
    selectedRange: selectedPartRange,
    startSelectedIndex: startSelectedPartIndex,
    endSelectedIndex: endSelectedPartIndex,
    midSelectedIndex: midSelectedPartIndex,
    startTouchedIndex: partWithStartTouchedIndex,
    endTouchedIndex: partWithEndTouchedIndex,
    prevIndex: prevPartIndex,
    nextIndex: nextPartIndex,
  } = getSelections({
    partsOrMarkers: parts,
    selectionStart,
    selectionEnd,
  });

  const anchorIndex = parts[0].start - 1;
  const anchorSelected =
    selectionStart <= anchorIndex && selectionEnd > anchorIndex;

  return {
    markerUuid: marker.uuid,
    parts: marker.parts,
    selectedPartRange,
    startSelectedPartIndex,
    endSelectedPartIndex,
    midSelectedPartIndex,
    partWithStartTouchedIndex,
    partWithEndTouchedIndex,
    prevPartIndex,
    nextPartIndex,
    anchorSelected,
  };
};

const fixPartSelections = ({
  marker,
  selectionStart,
  selectionEnd,
  isSingleSelection,
  startCursorMoved,
  endCursorMoved,
}) => {
  const {
    midSelectedPartIndex,
    endSelectedPartIndex,
    startSelectedPartIndex,
    selectedPartRange,
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
      if (isSingleSelection) {
        if (startCursorMoved < 0) {
          return {
            selectionStart: midSelectedPart.start,
            selectionEnd: midSelectedPart.start,
          };
        }
        return {
          selectionStart: midSelectedPart.end,
          selectionEnd: midSelectedPart.end,
        };
      }
      const lastResolvedPart = parts[lastResolvedPartIndex];
      return {
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
        selectionStart:
          startCursorMoved > 0 ? endSelectedPart.end : endSelectedPart.start,
        selectionEnd: Math.max(selectionEnd, lastResolvedPart.end),
      };
    }
  }

  if (startSelectedPartIndex >= 0) {
    const startSelectedPart = parts[startSelectedPartIndex];

    if (startSelectedPart.isLocked) {
      const lastResolvedPart = parts[lastResolvedPartIndex];
      return {
        selectionStart: Math.min(selectionStart, parts[0].start),
        selectionEnd:
          endCursorMoved < 0 ? parts[0].start : lastResolvedPart.end,
      };
    }
  }

  if (
    selectedPartRange.endIndex >= 0 &&
    selectedPartRange.endIndex < lastResolvedPartIndex + 1
  ) {
    const lastResolvedPart = parts[lastResolvedPartIndex];
    return {
      selectionStart,
      selectionEnd: Math.max(selectionEnd, lastResolvedPart.end),
    };
  }

  return {
    selectionStart,
    selectionEnd,
  };
};

const fixMarkerSelections = ({
  markers,
  selectionStart,
  selectionEnd,
  isSingleSelection,
  startCursorMoved,
  endCursorMoved,
}) => {
  const {
    midSelectedMarkerIndex,
    endSelectedMarkerIndex,
    startSelectedMarkerIndex,
  } = getMarkerSelections({
    markers,
    selectionStart,
    selectionEnd,
  });

  if (midSelectedMarkerIndex >= 0) {
    const midSelectedMarker = markers[midSelectedMarkerIndex];
    if (midSelectedMarker.isLocked) {
      if (isSingleSelection) {
        const selection =
          startCursorMoved < 0
            ? midSelectedMarker.start
            : midSelectedMarker.end;
        return {
          selectionStart: selection,
          selectionEnd: selection,
        };
      }
      return {
        selectionStart: midSelectedMarker.start,
        selectionEnd: midSelectedMarker.end,
      };
    }
    return fixPartSelections({
      marker: midSelectedMarker,
      selectionStart,
      selectionEnd,
      isSingleSelection,
      startCursorMoved,
      endCursorMoved,
    });
  }
  if (endSelectedMarkerIndex >= 0) {
    const endSelectedMarker = markers[endSelectedMarkerIndex];
    if (endSelectedMarker.isLocked) {
      if (startCursorMoved < 0) {
        selectionStart = endSelectedMarker.start;
      } else {
        selectionStart = endSelectedMarker.end;
      }
    } else {
      const newSelections = fixPartSelections({
        marker: endSelectedMarker,
        selectionStart,
        selectionEnd,
        isSingleSelection,
        startCursorMoved,
        endCursorMoved,
      });
      selectionStart = newSelections.selectionStart;
      selectionEnd = newSelections.selectionEnd;
    }
  }
  if (startSelectedMarkerIndex >= 0) {
    const startSelectedMarker = markers[startSelectedMarkerIndex];
    if (startSelectedMarker.isLocked) {
      if (endCursorMoved > 0) {
        selectionEnd = startSelectedMarker.end;
      } else {
        selectionEnd = startSelectedMarker.start;
      }
    } else {
      const newSelections = fixPartSelections({
        marker: startSelectedMarker,
        selectionStart,
        selectionEnd,
        isSingleSelection,
        startCursorMoved,
        endCursorMoved,
      });
      selectionStart = newSelections.selectionStart;
      selectionEnd = newSelections.selectionEnd;
    }
  }
  return {
    selectionStart,
    selectionEnd,
  };
};

const withMarkerSelection = (TextArea = 'textarea') =>
  forwardRef(
    (
      {
        onSelectionChange: onSelectionChangeFromParent,
        value,
        markers,
        onInEditMarkerChange,
        ...restProps
      },
      ref
    ) => {
      const mutableRef = useRef({});

      const innerRef = useRef();

      const onSelectionChange = e => {
        /** @type {HTMLTextAreaElement} */
        const textarea = e.target;

        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;

        const isSingleSelection = selectionStart === selectionEnd;

        const prevSelection = mutableRef.current.selection;
        const startCursorMoved =
          !prevSelection || prevSelection?.selectionStart === selectionStart
            ? 0
            : selectionStart - prevSelection.selectionStart;
        const endCursorMoved =
          !prevSelection || prevSelection?.selectionEnd === selectionEnd
            ? 0
            : selectionEnd - prevSelection.selectionEnd;

        const {
          selectionStart: newSelectionStart,
          selectionEnd: newSelectionEnd,
        } = fixMarkerSelections({
          markers,
          selectionStart,
          selectionEnd,
          isSingleSelection,
          startCursorMoved,
          endCursorMoved,
        });

        if (selectionEnd !== newSelectionEnd) {
          textarea.selectionEnd = newSelectionEnd;
        }
        if (selectionStart !== newSelectionStart) {
          textarea.selectionStart = newSelectionStart;
        }

        const newSelection = withInEditMarkerIndex({
          markers,

          selectionStart: newSelectionStart,
          selectionEnd: newSelectionEnd,

          ...getMarkerSelections({
            markers,
            selectionStart: newSelectionStart,
            selectionEnd: newSelectionEnd,
          }),
        });

        mutableRef.current.selection = newSelection;

        onInEditMarkerChange &&
          onInEditMarkerChange({
            target: textarea,
            value,
            markers,
            inEditMarkerIndex: newSelection.inEditMarkerIndex,
            oldInEditMarkerIndex: prevSelection?.inEditMarkerIndex,
          });

        onSelectionChangeFromParent &&
          onSelectionChangeFromParent({
            ...e,
            ...newSelection,
          });
      };

      return (
        <TextArea
          ref={mergeRefs(ref, innerRef)}
          {...restProps}
          value={value}
          markers={markers}
          onSelectionChange={onSelectionChange}
        />
      );
    }
  );

export default withMarkerSelection;
