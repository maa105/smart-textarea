import React, {forwardRef, useEffect, useRef} from 'react';
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

export const getMarkerSelections = ({
  markers,
  selectionStart: start,
  selectionEnd: end,
}) => {
  const selectedMarkersRange = {startIndex: -1, endIndex: -1};
  let startSelectedMarkerIndex = -1;
  let endSelectedMarkerIndex = -1;
  let midSelectedMarkerIndex = -1;
  let markerWithStartTouchedIndex = -1;
  let markerWithEndTouchedIndex = -1;
  let prevMarkerIndex;
  let nextMarkerIndex;
  let i = 0;

  const getReturn = () =>
    withInEditMarkerIndex({
      markers,
      selectedMarkersRange,
      startSelectedMarkerIndex,
      endSelectedMarkerIndex,
      midSelectedMarkerIndex,
      markerWithStartTouchedIndex,
      markerWithEndTouchedIndex,
      prevMarkerIndex,
      nextMarkerIndex:
        (nextMarkerIndex ?? -1) >= markers.length ? -1 : nextMarkerIndex ?? -1,
    });

  for (; i < markers.length && markers[i].end < start; i++);

  prevMarkerIndex = i - 1;

  let marker = markers[i];
  if (!marker) {
    return getReturn();
  }

  if (marker.end === start) {
    markerWithEndTouchedIndex = prevMarkerIndex = i;
    i++;
    marker = markers[i];
    if (!marker) {
      return getReturn();
    }
  }

  if (marker.start >= end) {
    nextMarkerIndex = i;
    if (marker.start === end) {
      markerWithStartTouchedIndex = i;
    }
    return getReturn();
  }

  let startTotallySelected = start <= marker.start && marker.start < end;
  let endTotallySelected = start < marker.end && marker.end <= end;
  let totalySelected = startTotallySelected && endTotallySelected;
  const midSelected = !startTotallySelected && !endTotallySelected;

  if (midSelected) {
    midSelectedMarkerIndex = i;
    return getReturn();
  }
  if (!totalySelected) {
    if (startTotallySelected) {
      startSelectedMarkerIndex = i;
      nextMarkerIndex = i + 1;
      return getReturn();
    }

    endSelectedMarkerIndex = i;
    i++;
    marker = markers[i];
    if (!marker) {
      return getReturn();
    }

    startTotallySelected = start <= marker.start && marker.start < end;
    endTotallySelected = start < marker.end && marker.end <= end;
    totalySelected = startTotallySelected && endTotallySelected;

    if (!totalySelected) {
      if (startTotallySelected) {
        nextMarkerIndex = i + 1;
        startSelectedMarkerIndex = i;
      } else {
        nextMarkerIndex = i;
        if (marker.start === end) {
          markerWithStartTouchedIndex = i;
        }
      }
      return getReturn();
    }
  }
  selectedMarkersRange.startIndex = i;

  i++;
  for (; i < markers.length; i++) {
    marker = markers[i];

    startTotallySelected = start <= marker.start && marker.start < end;
    endTotallySelected = start < marker.end && marker.end <= end;
    totalySelected = startTotallySelected && endTotallySelected;

    if (!totalySelected) {
      if (startTotallySelected) {
        nextMarkerIndex = i + 1;
        startSelectedMarkerIndex = i;
      } else {
        nextMarkerIndex = i;
        if (marker.start === end) {
          markerWithStartTouchedIndex = i;
        }
      }
      break;
    }
  }
  selectedMarkersRange.endIndex = i;
  return getReturn();
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

        let start = selectionStart;
        let end = selectionEnd;

        const prevSelection = mutableRef.current.selection;
        const startCursorMoved =
          !prevSelection || prevSelection?.selectionStart === selectionStart
            ? 0
            : selectionStart - prevSelection.selectionStart;
        const endCursorMoved =
          !prevSelection || prevSelection?.selectionEnd === selectionEnd
            ? 0
            : selectionEnd - prevSelection.selectionEnd;

        let {
          midSelectedMarkerIndex,
          markerWithEndTouchedIndex,
          endSelectedMarkerIndex,
          // eslint-disable-next-line prefer-const
          selectedMarkersRange,
          startSelectedMarkerIndex,
          markerWithStartTouchedIndex,
          // eslint-disable-next-line prefer-const
          prevMarkerIndex,
          // eslint-disable-next-line prefer-const
          nextMarkerIndex,
        } = getMarkerSelections({
          markers,
          selectionStart,
          selectionEnd,
        });

        if (midSelectedMarkerIndex >= 0) {
          const midSelectedMarker = markers[midSelectedMarkerIndex];
          if (midSelectedMarker.isLocked) {
            if (isSingleSelection) {
              if (startCursorMoved < 0) {
                start = end = midSelectedMarker.start;
                markerWithStartTouchedIndex = midSelectedMarkerIndex;
              } else {
                start = end = midSelectedMarker.end;
                markerWithEndTouchedIndex = midSelectedMarkerIndex;
              }
              midSelectedMarkerIndex = -1;
            } else {
              start = midSelectedMarker.start;
              end = midSelectedMarker.end;
              selectedMarkersRange.startIndex = midSelectedMarkerIndex;
              selectedMarkersRange.endIndex = midSelectedMarkerIndex;
              midSelectedMarkerIndex = -1;
            }
          }
        } else {
          if (endSelectedMarkerIndex >= 0) {
            const endSelectedMarker = markers[endSelectedMarkerIndex];
            if (endSelectedMarker.isLocked) {
              if (startCursorMoved < 0) {
                start = endSelectedMarker.start;
                selectedMarkersRange.startIndex = endSelectedMarkerIndex;
                if (selectedMarkersRange.endIndex === -1) {
                  selectedMarkersRange.endIndex = endSelectedMarkerIndex;
                }
                endSelectedMarkerIndex = -1;
              } else {
                start = endSelectedMarker.end;
                markerWithEndTouchedIndex = endSelectedMarkerIndex;
                endSelectedMarkerIndex = -1;
              }
            }
          }
          if (startSelectedMarkerIndex >= 0) {
            const startSelectedMarker = markers[startSelectedMarkerIndex];
            if (startSelectedMarker.isLocked) {
              if (endCursorMoved > 0) {
                end = startSelectedMarker.end;
                selectedMarkersRange.endIndex = startSelectedMarkerIndex;
                if (selectedMarkersRange.startIndex === -1) {
                  selectedMarkersRange.startIndex = startSelectedMarkerIndex;
                }
                startSelectedMarkerIndex = -1;
              } else {
                end = startSelectedMarker.start;
                markerWithStartTouchedIndex = startSelectedMarkerIndex;
                startSelectedMarkerIndex = -1;
              }
            }
          }
        }

        if (selectionEnd !== end) {
          textarea.selectionEnd = end;
        }
        if (selectionStart !== start) {
          textarea.selectionStart = start;
        }

        const newSelection = withInEditMarkerIndex({
          markers,

          selectionStart: start,
          selectionEnd: end,

          prevMarkerIndex,
          midSelectedMarkerIndex,
          markerWithEndTouchedIndex,
          endSelectedMarkerIndex,
          selectedMarkersRange,
          startSelectedMarkerIndex,
          markerWithStartTouchedIndex,
          nextMarkerIndex,
        });

        if (!mutableRef.current.pointerDown || !prevSelection) {
          mutableRef.current.selection = newSelection;
          onInEditMarkerChange &&
            onInEditMarkerChange({
              target: textarea,
              value,
              markers,
              inEditMarkerIndex: newSelection.inEditMarkerIndex,
              oldInEditMarkerIndex: prevSelection?.inEditMarkerIndex,
            });
        }

        onSelectionChangeFromParent &&
          onSelectionChangeFromParent({
            ...e,
            ...newSelection,
          });
      };

      useEffect(() => {
        const textarea = innerRef.current;
        const onPointerDownListener = () => {
          mutableRef.current.pointerDown = true;
        };
        const onPointerUpListener = () => {
          mutableRef.current.pointerDown = false;
        };
        textarea.addEventListener('pointerdown', onPointerDownListener);
        document.addEventListener('pointerup', onPointerUpListener);
        return () => {
          textarea.removeEventListener('pointerdown', onPointerDownListener);
          document.removeEventListener('pointerup', onPointerUpListener);
        };
      }, []);

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
