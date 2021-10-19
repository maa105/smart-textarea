import React, {useEffect, useState, useRef, forwardRef} from 'react';
import mergeRefs from '../helpers/mergeRefs';
import useImperativeForwarder from '../hooks/useImperativeForwarder';
import {blockMarkerUpdates} from '../helpers/blockMarkerUpdates';
import {getMarkerSelections} from './withSelectionBlocker';

const DEFAULT_END = true;
const CURRENT_END = 1;
const NEXT_START = 2;

const spaces = {
  ' ': DEFAULT_END,
  '\t': DEFAULT_END,
  '\r': DEFAULT_END,
  '\n': DEFAULT_END,
  '\v': DEFAULT_END,
  '\0': DEFAULT_END,
};

const getUuid = () => `${Math.round(Math.random() * 999999)}-${Date.now()}`;
const createMarker = ({
  uuid,
  anchor,
  type,
  start,
  end,
  markerData = {},
  data,
  isLocked = false,
}) => ({
  uuid: uuid ?? getUuid(),
  anchor,
  type,
  start,
  end,
  markerData,
  data,
  isLocked,
});
const parseMarkers = (value, options) => {
  let i = 0;
  const anchors = options.anchors;
  const markers = [];
  while (i < value.length) {
    let anchor;
    while (i < value.length) {
      if ((i === 0 || spaces[value[i - 1]]) && anchors[value[i]]) {
        anchor = anchors[value[i]];
        break;
      }
      i++;
    }
    if (!anchor) {
      break;
    }

    const start = i;
    i = start + 1;

    const markerData = {};

    const parts = anchor.parts;
    for (let j = 0; j < parts.length; j++) {
      const {key, startChar, endChars} = parts[j];
      if (startChar) {
        if (value[i] === startChar) {
          i++;
        } else {
          break;
        }
      }
      const partStart = i;
      while (i < value.length) {
        if (endChars[value[i]]) {
          break;
        }
        i++;
      }
      markerData[key] = value.substring(partStart, i);
      if (i >= value.length || endChars[value[i]] === DEFAULT_END) {
        break;
      }
      if (endChars[value[i]] === CURRENT_END) {
        i++;
      }
    }

    markers.push({
      anchor: anchor.anchorChar,
      type: anchor.type,
      version: options.version,
      start,
      end: i,
      markerData,
    });
  }
  return markers;
};

const wrapMarkerParser =
  (parseMarkers, options) => (value, markerOffset, oldFirstMarker) => {
    const markers = parseMarkers(value, options).map((marker, i) => {
      const updatedMarker = createMarker({
        isLocked: false,
        ...(i === 0 && marker.start === 0 ? oldFirstMarker : {}),
        ...marker,
        uuid:
          i === 0 && marker.start === 0 && oldFirstMarker
            ? oldFirstMarker.uuid
            : null,
        start: marker.start + markerOffset,
        end: marker.end + markerOffset,
        value,
      });
      return updatedMarker;
    });
    return [value, markers];
  };

const update = ({
  markers,
  prevValue,
  selectionStart,
  selectionEnd,
  insertedText,

  prevMarkerIndex,
  midSelectedMarkerIndex,
  markerWithEndTouchedIndex,
  endSelectedMarkerIndex,
  nextMarkerIndex,
  markerParser,
}) => {
  let newValue =
    prevValue.substring(0, selectionStart) +
    insertedText +
    prevValue.substring(selectionEnd);

  let lengthChange = newValue.length - prevValue.length;
  let inEditMarkerIndex = -1;

  let newMarkers = [];

  if (midSelectedMarkerIndex >= 0) {
    inEditMarkerIndex = midSelectedMarkerIndex;
    const midSelectedMarker = markers[midSelectedMarkerIndex];
    if (!midSelectedMarker.isLocked) {
      newMarkers.push(...markers.slice(0, midSelectedMarkerIndex));
      newMarkers.push({
        ...midSelectedMarker,
        end: selectionEnd,
      });
    } else {
      selectionStart = selectionEnd = midSelectedMarker.end;
      newMarkers.push(...markers.slice(0, midSelectedMarkerIndex + 1));
      lengthChange = insertedText.length;
      newValue =
        prevValue.substring(0, selectionStart) +
        insertedText +
        prevValue.substring(selectionEnd);
    }
    newMarkers.push(
      ...markers.slice(midSelectedMarkerIndex + 1).map(marker => ({
        ...marker,
        start: marker.start + lengthChange,
        end: marker.end + lengthChange,
      }))
    );
  } else {
    if (markerWithEndTouchedIndex >= 0) {
      inEditMarkerIndex = markerWithEndTouchedIndex;
      newMarkers.push(...markers.slice(0, markerWithEndTouchedIndex + 1));
    } else if (endSelectedMarkerIndex >= 0) {
      inEditMarkerIndex = endSelectedMarkerIndex;
      const endSelectedMarker = markers[endSelectedMarkerIndex];
      if (!endSelectedMarker.isLocked) {
        newMarkers.push(...markers.slice(0, endSelectedMarkerIndex));
        newMarkers.push({
          ...endSelectedMarker,
          end: selectionStart,
        });
      } else {
        selectionStart = selectionEnd = endSelectedMarker.end;
        newMarkers.push(...markers.slice(0, endSelectedMarkerIndex + 1));
        lengthChange = insertedText.length;
        newValue =
          prevValue.substring(0, selectionStart) +
          insertedText +
          prevValue.substring(selectionEnd);
      }
    } else if (prevMarkerIndex >= 0) {
      newMarkers.push(...markers.slice(0, prevMarkerIndex + 1));
    }

    if (nextMarkerIndex >= 0) {
      const nextMarkers = markers.slice(nextMarkerIndex).map(marker => ({
        ...marker,
        start: marker.start + lengthChange,
        end: marker.end + lengthChange,
      }));

      nextMarkerIndex = newMarkers.length;
      newMarkers.push(...nextMarkers);

      nextMarkerIndex =
        nextMarkerIndex >= newMarkers.length ? -1 : nextMarkerIndex;
    }
  }

  const inEditMarker = newMarkers[inEditMarkerIndex];
  if (inEditMarker && !inEditMarker.isLocked) {
    const startParse = inEditMarker.start;
    const endParse =
      nextMarkerIndex >= 0
        ? newMarkers[nextMarkerIndex].start
        : newValue.length;
    const toParse = newValue.substring(startParse, endParse);

    const [parsedValue, parsedMarkers] = markerParser(
      toParse,
      startParse,
      inEditMarker // will just update him and should be returned as first element
    );

    if (parsedValue !== toParse) {
      const lengthChange = parsedValue - toParse;
      if (lengthChange && nextMarkerIndex >= 0) {
        for (let i = nextMarkerIndex; i < newMarkers.length; i++) {
          const marker = newMarkers[i];
          newMarkers[i] = {
            ...marker,
            start: marker.start + lengthChange,
            end: marker.end + lengthChange,
          };
        }
      }
      newValue =
        newValue.substring(0, startParse) +
        parsedValue +
        newValue.substring(endParse);
    }

    newMarkers = [
      ...newMarkers.slice(0, inEditMarkerIndex),
      ...parsedMarkers,
      ...newMarkers.slice(inEditMarkerIndex + 1),
    ];
  } else {
    const startParse =
      prevMarkerIndex >= 0 ? newMarkers[prevMarkerIndex].end : 0;
    const endParse =
      nextMarkerIndex >= 0
        ? newMarkers[nextMarkerIndex].start
        : newValue.length;
    const toParse = newValue.substring(startParse, endParse);

    const [parsedValue, parsedMarkers] = markerParser(toParse, startParse);

    if (parsedValue !== toParse) {
      const lengthChange = parsedValue - toParse;
      if (lengthChange && nextMarkerIndex >= 0) {
        for (let i = nextMarkerIndex; i < newMarkers.length; i++) {
          const marker = newMarkers[i];
          newMarkers[i] = {
            ...marker,
            start: marker.start + lengthChange,
            end: marker.end + lengthChange,
          };
        }
      }
      newValue =
        newValue.substring(0, startParse) +
        parsedValue +
        newValue.substring(endParse);
    }

    const nextNewMarkers = [];
    if (prevMarkerIndex >= 0) {
      nextNewMarkers.push(...newMarkers.slice(0, prevMarkerIndex + 1));
    }
    nextNewMarkers.push(...parsedMarkers);
    if (nextMarkerIndex >= 0) {
      nextNewMarkers.push(...newMarkers.slice(nextMarkerIndex));
    }
    newMarkers = nextNewMarkers;
  }

  return {
    newValue,
    newMarkers,
    selectionStart,
    selectionEnd,
  };
};

const withMarkerParser = ({
  markerParser = parseMarkers,
  markerParserOptions = {
    version: 0,
    anchors: [
      {
        anchorChar: '@',
        type: 'person',
        parts: [
          {
            key: 'username',
          },
        ],
      },
      {
        anchorChar: '#',
        type: 'rfi',
        parts: [
          {
            key: 'rifId',
          },
        ],
      },
    ],
  },
} = {}) => {
  if (markerParser === parseMarkers) {
    const anchors = {};
    markerParserOptions.anchors.forEach(anchor => {
      const parts = anchor.parts.map(({startChar, endChar, key}, i, parts) => ({
        key,
        startChar,
        endChars: {
          ...(endChar ? {[endChar]: CURRENT_END} : spaces),
          ...(parts[i + 1]?.startChar
            ? {
                [parts[i + 1].startChar]: NEXT_START,
              }
            : null),
        },
      }));
      anchors[anchor.anchorChar] = {
        ...anchor,
        parts,
      };
    });
    markerParserOptions = {...markerParserOptions, anchors};
  }

  markerParser = wrapMarkerParser(markerParser, markerParserOptions);

  return (TextArea = 'textarea') =>
    forwardRef(
      (
        {
          initValue,
          initMarkers,
          onInput: onInputFromParent,
          onChange: onChangeFromParent,
          onMarkersChange,
          imperativeRef,
          ...props
        },
        ref
      ) => {
        const mutableRef = useRef();
        mutableRef.current = mutableRef.current || {
          value: initValue ?? '',
          markers: (initMarkers ?? []).map(marker =>
            createMarker({
              ...marker,
              isLocked: true,
            })
          ),
        };

        mutableRef.current.onMarkersChange = onMarkersChange;

        const innerRef = useRef();

        if (props.value || props.markers) {
          console.warn(
            `Do not use props "value" and "markers". Use "initValue" and "initMarkers" instead`
          );
          delete props.markers;
          delete props.value;
        }

        const [value, setInternalValue] = useState(mutableRef.current.value);
        const [markers, setInternalMarkers] = useState(
          mutableRef.current.markers
        );
        const setValue = value => {
          mutableRef.current.value = value;
          setInternalValue(value);
        };
        const setMarkers = markers => {
          mutableRef.current.markers = markers;
          setInternalMarkers(markers);
        };

        const [childImperativeRef] = useImperativeForwarder(
          imperativeRef,
          () => {
            const updateMarker = (marker, update) => {
              const markers = mutableRef.current.markers;
              const value = mutableRef.current.value;
              const i = markers.findIndex(m => m.uuid === marker.uuid);
              if (i < 0) {
                return false;
              }
              marker = markers[i];
              const updateFunction = update => {
                if (!update && update !== null) {
                  return marker;
                }

                let newValue;
                let newMarkers;
                let newMarker = null;

                if (update) {
                  const {textValue, appendText = '', ...markerUpdates} = update;
                  const hasNewText = textValue != null;
                  const lengthChange = hasNewText
                    ? textValue.length +
                      appendText.length -
                      (marker.end - marker.start)
                    : 0;

                  newMarkers = [...markers.slice(0, i)];
                  newMarker = {
                    ...marker,
                    end: hasNewText
                      ? marker.start + textValue.length
                      : marker.end,
                    ...markerUpdates,
                  };
                  newMarkers.push(newMarker);
                  if (lengthChange) {
                    newMarkers.push(
                      ...markers.slice(i + 1).map(marker => ({
                        ...marker,
                        start: marker.start + lengthChange,
                        end: marker.end + lengthChange,
                      }))
                    );
                  } else {
                    newMarkers.push(...markers.slice(i + 1));
                  }

                  newValue = value;
                  if (hasNewText) {
                    newValue = [
                      value.substring(0, marker.start),
                      textValue,
                      appendText,
                      value.substring(marker.end),
                    ].join('');

                    setValue(newValue);
                  }
                  setMarkers(newMarkers);
                } else {
                  const {start: selectionStart, end: selectionEnd} = marker;
                  const lengthChange = selectionEnd - selectionStart;

                  newValue =
                    value.substring(0, marker.start) +
                    value.substring(marker.end);

                  newMarkers = [
                    ...markers.slice(0, i),
                    ...markers.slice(i + 1).map(marker => ({
                      ...marker,
                      start: marker.start - lengthChange,
                      end: marker.end - lengthChange,
                    })),
                  ];

                  setValue(newValue);
                  setMarkers(newMarkers);
                }

                onMarkersChange &&
                  onMarkersChange({
                    target: innerRef.current,
                    init: false,
                    value: newValue,
                    oldValue: value,
                    markers: newMarkers,
                    oldMarkers: markers,
                  });

                onChangeFromParent &&
                  onChangeFromParent({
                    target: innerRef.current,
                    value: newValue,
                    markers: newMarkers,
                  });

                return newMarker;
              };
              if (typeof update === 'function') {
                return updateFunction(update(marker));
              }
              return updateFunction(update);
            };
            return {
              updateMarker: (marker, update) =>
                updateMarker(marker, marker => {
                  if (typeof update === 'function') {
                    update = update(marker);
                  }
                  if (update) {
                    let isLocked;
                    if (marker.isLocked) {
                      isLocked = true;
                      if (update.isLocked === false) {
                        console.warn(
                          'cannot unloack a locked marker. Will keep it locked!'
                        );
                      }
                    } else {
                      isLocked = update.isLocked ?? false;
                    }
                    return {
                      isLocked,
                      textValue: update.textValue,
                      data:
                        update.data === undefined ? marker.data : update.data,
                      markerData: update.markerData ?? marker.markerData,
                    };
                  }
                  return update;
                }),
            };
          },
          []
        );

        const onInput = e => {
          const textarea = e.target;
          const newValue = textarea.value;
          const prevValue = value;
          if (prevValue === newValue) {
            return true;
          }

          const newSelectionEnd = textarea.selectionEnd;
          const prevSelectionEnd =
            prevValue.length - (newValue.length - newSelectionEnd);
          const minSelectionEnd = Math.min(prevSelectionEnd, newSelectionEnd);

          let selectionStart;
          for (
            selectionStart = 0;
            selectionStart < minSelectionEnd &&
            prevValue[selectionStart] === newValue[selectionStart];
            selectionStart++
          );

          let selection = getMarkerSelections({
            markers,
            selectionStart,
            selectionEnd: prevSelectionEnd,
          });

          const blockResult = blockMarkerUpdates(selection);

          if (mutableRef.current.blockTimer) {
            clearTimeout(mutableRef.current.blockTimer);
            mutableRef.current.blockTimer = null;
          }
          if (blockResult.block) {
            textarea.selectionStart = blockResult.selectionStart;
            textarea.selectionEnd = blockResult.selectionEnd;
            mutableRef.current.blockTimer = setTimeout(() => {
              mutableRef.current.blockTimer = null;
              try {
                textarea.selectionStart = blockResult.selectionStart;
                textarea.selectionEnd = blockResult.selectionEnd;
                // eslint-disable-next-line no-empty
              } catch (err) {}
            });
            e.preventDefault();
            return false;
          }

          const insertedText = newValue.substring(
            selectionStart,
            newSelectionEnd
          );

          const {
            prevMarkerIndex,
            midSelectedMarkerIndex,
            markerWithEndTouchedIndex,
            endSelectedMarkerIndex,
            nextMarkerIndex,
          } = selection;

          const {newValue: parsedValue, newMarkers: parsedMarkers} = update({
            markers,
            prevValue,
            selectionStart,
            selectionEnd: prevSelectionEnd,
            insertedText,

            prevMarkerIndex,
            midSelectedMarkerIndex,
            markerWithEndTouchedIndex,
            endSelectedMarkerIndex,
            nextMarkerIndex,

            markerParser,
          });

          if (parsedValue !== newValue) {
            console.error(
              `OOPS! input tracking is broken. Expected "${newValue}" got "${parsedValue}"`
            );
          }
          setValue(parsedValue);
          setMarkers(parsedMarkers);

          const newCursorPosition = newSelectionEnd; // might need to be refined!!!
          textarea.selectionStart = newCursorPosition; // forcing it for now if it isnt "should" always be though

          selection = {
            selectionStart: newCursorPosition,
            selectionEnd: newCursorPosition,
            ...getMarkerSelections({
              markers: parsedMarkers,
              selectionStart: newCursorPosition,
              selectionEnd: newCursorPosition,
            }),
          };

          onMarkersChange &&
            onMarkersChange({
              target: textarea,
              init: false,
              value: parsedValue,
              oldValue: value,
              markers: parsedMarkers,
              oldMarkers: markers,
            });

          onInputFromParent &&
            onInputFromParent({
              target: textarea,
              value: parsedValue,
              markers: parsedMarkers,
            });

          return true;
        };

        const onChange = e => {
          onChangeFromParent &&
            onChangeFromParent({
              target: e.target,
              value: mutableRef.current.value,
              markers: mutableRef.current.markers,
            });
        };

        useEffect(() => {
          const textarea = innerRef.current;
          const onMarkersChange = mutableRef.current.onMarkersChange;
          onMarkersChange &&
            onMarkersChange({
              target: textarea,
              init: true,
              value: mutableRef.current.value,
              oldValue: '',
              markers: mutableRef.current.markers,
              oldMarkers: [],
            });
        }, []);

        return (
          <TextArea
            {...props}
            ref={mergeRefs('withMarkerParser', ref, innerRef)}
            imperativeRef={childImperativeRef}
            value={value}
            markers={markers}
            onInput={onInput}
            onChange={onChange}
          />
        );
      }
    );
};

export default withMarkerParser;
