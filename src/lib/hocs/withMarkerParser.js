import React, {useEffect, useState, useRef, forwardRef} from 'react';
import mergeRefs from '../helpers/mergeRefs';
import useImperativeForwarder from '../hooks/useImperativeForwarder';
import {blockMarkerUpdates} from '../helpers/blockMarkerUpdates';
import {
  getMarkerPartsSelections,
  getMarkerSelections,
} from './withMarkerSelection';

const DEFAULT_END = true;
const CURRENT_END = 1;
const NEXT_START = 2;

const newLines = {
  '\r': DEFAULT_END,
  '\n': DEFAULT_END,
};

const spaces = {
  ' ': DEFAULT_END,
  '\t': DEFAULT_END,
  '\v': DEFAULT_END,
  '\0': DEFAULT_END,
  ...newLines,
};

const getUuid = () => `${Math.round(Math.random() * 999999)}-${Date.now()}`;
const createMarker = ({
  uuid,
  version,
  anchor,
  type,
  start,
  end,
  partsConfig,
  parts = [],
  partsText = {},
  partsIds = {},
  partsData = {},
  lastResolvedPartIndex = -1,
  isLocked = false,
}) => ({
  uuid: uuid ?? getUuid(),
  version,
  anchor,
  type,
  start,
  end,
  partsConfig,
  parts,
  partsText,
  partsIds,
  partsData,
  lastResolvedPartIndex,
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

    const partsText = {};
    const parts = [];
    const partsConfig = anchor.parts;

    for (let j = 0; j < partsConfig.length; j++) {
      const partStart = i;
      let partStartChar = '';
      const {key, startChar, endChars} = partsConfig[j];
      if (startChar) {
        if (value[i] === startChar) {
          partStartChar = startChar;
          i++;
        } else {
          break;
        }
      }
      const partTextStart = i;
      while (i < value.length) {
        if (endChars[value[i]]) {
          break;
        }
        i++;
      }
      const partTextEnd = i;
      partsText[key] = value.substring(partTextStart, partTextEnd);
      const isPartEnd = endChars[value[i]] === CURRENT_END;
      const partEndChar = isPartEnd ? value[i] : '';
      if (isPartEnd) {
        i++;
      }
      const partEnd = i;
      parts.push({
        key,
        start: partStart,
        end: partEnd,
        startChar: partStartChar,
        endChar: partEndChar,
      });
      if (i >= value.length && !isPartEnd) {
        break;
      }
      if (endChars[value[i]] === DEFAULT_END) {
        break;
      }
    }

    markers.push({
      anchor: anchor.anchorChar,
      type: anchor.type,
      version: options.version,
      start,
      end: i,
      partsConfig,
      parts,
      partsText,
    });
  }
  return markers;
};

const wrapMarkerParser = (parseMarkers, options) => (value, markerOffset) =>
  parseMarkers(value, options).map(marker =>
    createMarker({
      isLocked: false,
      partsIds: {},
      partsData: {},
      lastResolvedPartIndex: -1,
      ...marker,
      parts: marker.parts.map(part => ({
        isLocked: false,
        ...part,
        start: part.start + markerOffset,
        end: part.end + markerOffset,
      })),
      start: marker.start + markerOffset,
      end: marker.end + markerOffset,
    })
  );

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
  let inEditMarkerIndex = -1;

  const newMarkers = [];

  if (midSelectedMarkerIndex >= 0) {
    const midSelectedMarker = markers[midSelectedMarkerIndex];
    if (!midSelectedMarker.isLocked) {
      inEditMarkerIndex = midSelectedMarkerIndex;

      const newSelections = updateMarkerParts({
        marker: midSelectedMarker,
        selectionStart,
        selectionEnd,
      });
      selectionStart = newSelections.selectionStart;
      selectionEnd = newSelections.selectionEnd;

      newMarkers.push(...markers.slice(0, midSelectedMarkerIndex));
      newMarkers.push({
        ...midSelectedMarker,
        end:
          midSelectedMarker.end +
          insertedText.length -
          (selectionEnd - selectionStart),
      });
    } else {
      selectionStart = selectionEnd = midSelectedMarker.end;

      newMarkers.push(...markers.slice(0, midSelectedMarkerIndex + 1));
    }
  } else {
    if (markerWithEndTouchedIndex >= 0) {
      const markerWithEndTouched = markers[markerWithEndTouchedIndex];

      newMarkers.push(...markers.slice(0, markerWithEndTouchedIndex));

      if (!markerWithEndTouched.isLocked) {
        inEditMarkerIndex = markerWithEndTouchedIndex;

        newMarkers.push({
          ...markerWithEndTouched,
          end: markerWithEndTouched.end + insertedText.length,
        });
      } else {
        newMarkers.push(markerWithEndTouched);
      }
    } else if (endSelectedMarkerIndex >= 0) {
      const endSelectedMarker = markers[endSelectedMarkerIndex];

      newMarkers.push(...markers.slice(0, endSelectedMarkerIndex));

      if (!endSelectedMarker.isLocked) {
        inEditMarkerIndex = endSelectedMarkerIndex;

        const newSelections = updateMarkerParts({
          marker: endSelectedMarker,
          selectionStart,
          selectionEnd,
        });
        selectionStart = newSelections.selectionStart;
        selectionEnd = newSelections.selectionEnd;

        newMarkers.push({
          ...endSelectedMarker,
          end: selectionStart + insertedText.length,
        });
      } else {
        selectionStart = endSelectedMarker.end;
        newMarkers.push(endSelectedMarker);
      }
    } else if (prevMarkerIndex >= 0) {
      newMarkers.push(...markers.slice(0, prevMarkerIndex + 1));
    }

    const lengthChange = insertedText.length - (selectionEnd - selectionStart);

    // here is where the selected markers whether fully selected or start selected are effectively deleted

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

  const newValue =
    prevValue.substring(0, selectionStart) +
    insertedText +
    prevValue.substring(selectionEnd);

  const inEditMarker = newMarkers[inEditMarkerIndex];
  if (inEditMarker) {
    const startParse = inEditMarker.start;
    let endParse = inEditMarker.end;

    const lastPossibleEndParse =
      newMarkers[nextMarkerIndex]?.start ?? newValue.length;
    for (
      ;
      endParse < lastPossibleEndParse && !spaces[newValue[endParse]];
      endParse++
    );

    const toParse = newValue.substring(startParse, endParse);

    const [newlyParsedInEditMarker, ...newParsedMarkers] = markerParser(
      toParse,
      startParse
    );

    let lastResolvedPartIndex = -1;
    const partsIds = {};
    const partsData = {};
    const parts = [];
    const oldInEditMarkerParts = inEditMarker.parts;
    const oldInEditMarkerpartsIds = inEditMarker.partsIds;
    const oldInEditMarkerPartsData = inEditMarker.partsData;
    const newInEditMarkerParts = newlyParsedInEditMarker.parts;
    for (let i = 0; i < newInEditMarkerParts.length; i++) {
      const oldPart = oldInEditMarkerParts[i];
      const newPart = newInEditMarkerParts[i];
      const key = newPart.key;

      const shouldLockPart = Boolean(
        oldPart?.isLocked &&
          newPart.end !== newPart.start &&
          prevValue.substring(oldPart.start, oldPart.end) ===
            newValue.substring(newPart.start, newPart.end)
      );
      parts.push({
        ...newPart,
        isLocked: shouldLockPart,
      });

      if (shouldLockPart) {
        lastResolvedPartIndex = i;
        partsIds[key] = oldInEditMarkerpartsIds[key];
        partsData[key] = oldInEditMarkerPartsData[key];
      }
    }

    const newInEditMarker = {
      ...newlyParsedInEditMarker,
      lastResolvedPartIndex,
      uuid: inEditMarker.uuid,
      partsIds,
      partsData,
      parts,
    };

    newMarkers.splice(
      // remove the old inEditMarker and insert in place of it the new one and the newParsedMarkers
      inEditMarkerIndex,
      1,
      newInEditMarker,
      ...newParsedMarkers
    );
  } else {
    const startParse = selectionStart;
    let endParse = selectionStart + insertedText.length;

    const lastPossibleEndParse =
      newMarkers[nextMarkerIndex]?.start ?? newValue.length;
    for (
      ;
      endParse < lastPossibleEndParse && !spaces[newValue[endParse]];
      endParse++
    );

    const toParse = newValue.substring(startParse, endParse);

    const parsedMarkers = markerParser(toParse, startParse);

    newMarkers.splice(
      // remove the old inEditMarker and insert in place of it the new one and the newParsedMarkers
      prevMarkerIndex + 1, // still correct even when prevMarkerIndex = -1
      0,
      ...parsedMarkers
    );
  }

  return {
    newValue,
    newMarkers,
    selectionStart,
    selectionEnd,
  };
};

const updateMarkerParts = ({marker, selectionStart, selectionEnd}) => {
  const lastResolvedPartIndex = marker.lastResolvedPartIndex;
  const parts = marker.parts;
  if (!parts?.length) {
    return {
      selectionStart,
      selectionEnd,
    };
  }

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

  if (midSelectedPartIndex >= 0) {
    const midSelectedPart = parts[midSelectedPartIndex];

    if (midSelectedPart.isLocked) {
      const lastResolvedPart = parts[lastResolvedPartIndex];
      selectionStart = selectionEnd = lastResolvedPart.end;
    }
    return {
      selectionStart,
      selectionEnd,
    };
  }
  if (endSelectedPartIndex >= 0) {
    const endSelectedPart = parts[endSelectedPartIndex];

    if (endSelectedPart.isLocked) {
      const lastResolvedPart = parts[lastResolvedPartIndex];
      selectionStart = lastResolvedPart.end;
      selectionEnd = Math.max(selectionEnd, lastResolvedPart.end);
    }
    return {
      selectionStart,
      selectionEnd,
    };
  }
  if (startSelectedPartIndex >= 0) {
    const startSelectedPart = parts[startSelectedPartIndex];

    if (startSelectedPart.isLocked) {
      const lastResolvedPart = parts[lastResolvedPartIndex];
      selectionStart = lastResolvedPart.end;
      selectionEnd = Math.max(selectionEnd, lastResolvedPart.end);
    }
    return {
      selectionStart,
      selectionEnd,
    };
  }
  if (
    selectedPartRange.endIndex >= 0 &&
    selectedPartRange.endIndex < lastResolvedPartIndex + 1
  ) {
    const lastResolvedPart = parts[lastResolvedPartIndex];
    selectionStart = lastResolvedPart.end;
    selectionEnd = Math.max(selectionEnd, lastResolvedPart.end);
    return {
      selectionStart,
      selectionEnd,
    };
  }

  return {
    selectionStart,
    selectionEnd,
  };
};

const preProcessMarkerParserOptions = markerParserOptions => {
  const anchors = {};
  const types = {};
  markerParserOptions.anchors.forEach(anchor => {
    const parts = anchor.parts.map(({startChar, endChar, key}, i, parts) => ({
      key,
      startChar: startChar || '',
      endChar: endChar || '',
      endChars: {
        ...(parts[i + 1]?.startChar
          ? {
              [parts[i + 1].startChar]: NEXT_START,
            }
          : null),
        ...(endChar ? {[endChar]: CURRENT_END} : null),
        ...newLines,
      },
    }));
    const anchorConfig = {
      ...anchor,
      parts,
    };
    types[anchor.type] = anchorConfig;
    anchors[anchor.anchorChar] = anchorConfig;
  });
  return {...markerParserOptions, anchors, types};
};

const getPartDelimitedText = (isLocked, part, partConfig, text) =>
  (isLocked ? partConfig.startChar : part.startChar) +
  text +
  (isLocked ? partConfig.endChar : part.endChar);
const getPartTextLengthChange = (isLocked, part, partConfig, text) =>
  (isLocked ? partConfig.startChar : part.startChar).length +
  text.length +
  (isLocked ? partConfig.endChar : part.endChar).length -
  (part.end - part.start);

const initMarker = (marker, markerParserOptions) => {
  const anchorConfig =
    markerParserOptions.types[marker.type] ||
    markerParserOptions.anchors[marker.anchor];
  const partsConfig = anchorConfig.parts;
  let lastResolvedPartIndex;
  for (let i = 0; i < partsConfig.length; i++) {
    if (marker.partsIds[partsConfig[i].key]) {
      lastResolvedPartIndex = i;
    }
  }
  const isMarkerLocked = lastResolvedPartIndex === partsConfig.length - 1;
  const parts = isMarkerLocked
    ? undefined
    : (marker.parts || []).map((part, i) => ({
        ...part,
        isLocked: i <= lastResolvedPartIndex,
      }));
  const partsText = isMarkerLocked ? undefined : marker.partsText;
  return createMarker({
    ...marker,
    type: anchorConfig.type,
    anchor: anchorConfig.anchor,
    parts,
    partsText,
    partsConfig,
    isLocked: isMarkerLocked,
    lastResolvedPartIndex,
  });
};

const withMarkerParser = ({markerParserOptions} = {}) => {
  markerParserOptions = preProcessMarkerParserOptions(markerParserOptions);
  const markerParser = wrapMarkerParser(parseMarkers, markerParserOptions);

  return (TextArea = 'textarea') =>
    forwardRef(
      (
        {
          initValue,
          initMarkers,
          onInput: onInputFromParent,
          onChange: onChangeFromParent,
          onMarkersChange,
          disabled,
          imperativeRef,
          ...props
        },
        ref
      ) => {
        const mutableRef = useRef();
        mutableRef.current = mutableRef.current || {
          value: initValue ?? '',
          markers:
            initMarkers
              ?.filter(
                ({anchor, type}) =>
                  markerParserOptions.types[type] ||
                  markerParserOptions.anchors[anchor]
              )
              .map(marker => initMarker(marker, markerParserOptions)) ?? [],
        };

        mutableRef.current.onMarkersChange = onMarkersChange;
        mutableRef.current.disabled = disabled;

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
            const deleteMarker = (marker, setCursor) => {
              const markers = mutableRef.current.markers;
              const value = mutableRef.current.value;
              const i = markers.findIndex(m => m.uuid === marker.uuid);
              if (i < 0) {
                return;
              }
              marker = markers[i];

              const {start: selectionStart, end: selectionEnd} = marker;
              const lengthChange = selectionEnd - selectionStart;

              const newValue =
                value.substring(0, marker.start) + value.substring(marker.end);

              const newMarkers = [
                ...markers.slice(0, i),
                ...markers.slice(i + 1).map(marker => ({
                  ...marker,
                  start: marker.start - lengthChange,
                  end: marker.end - lengthChange,
                })),
              ];

              setValue(newValue);
              setMarkers(newMarkers);

              if (setCursor) {
                const textarea = innerRef.current;
                innerRef.current.value = newValue;
                textarea.selectionStart = textarea.selectionEnd = marker.start;
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
            };
            const updateMarkerPart = ({marker, partKey}, update) => {
              const markerUuid = marker.uuid || marker;
              const markers = mutableRef.current.markers;
              const value = mutableRef.current.value;
              const i = markers.findIndex(m => m.uuid === markerUuid);
              if (i < 0) {
                return false;
              }
              marker = markers[i];
              const partIndex = marker.partsConfig.findIndex(
                ({key}) => key === partKey
              );
              if (partIndex < 0) {
                return false;
              }
              const part = marker.parts[partIndex];
              const partsConfig = marker.partsConfig;
              const partConfig = partsConfig[partIndex];

              const updateFunction = update => {
                if (!update) {
                  return marker;
                }

                const {text, cursor, data, id} = update;

                const isLocked = Boolean(id);
                const lastResolvedPartIndex = isLocked
                  ? partIndex
                  : marker.lastResolvedPartIndex;

                let {partsIds, partsData, parts, partsText} = marker;

                const isLastPart = partIndex === parts.length - 1;
                const isLastPossiblePart = partIndex === partsConfig.length - 1;
                const nextPartConfig = isLastPossiblePart
                  ? null
                  : partsConfig[partIndex + 1];

                const isMarkerLocked =
                  marker.isLocked ||
                  (isLocked && partIndex === partsConfig.length - 1);

                const appendText = isMarkerLocked
                  ? update.appendText || ''
                  : '';

                const hasNewText = text != null;
                const lengthChange = hasNewText
                  ? isMarkerLocked
                    ? text.length +
                      appendText.length -
                      (marker.end - marker.start)
                    : getPartTextLengthChange(isLocked, part, partConfig, text)
                  : 0;

                if (id) {
                  partsIds = {...partsIds, [partKey]: id};
                }
                if (data || data === null) {
                  partsData = {...partsData, [partKey]: data};
                }
                if (isMarkerLocked) {
                  parts = undefined;
                } else if (isLocked !== part.isLocked || hasNewText) {
                  const newParts = parts.slice(0, partIndex);
                  const newPart = {
                    ...parts[partIndex],
                    isLocked,
                    end: parts[partIndex].end + lengthChange,
                    ...(isLocked
                      ? {
                          startChar: partConfig.startChar,
                          endChar: partConfig.endChar,
                        }
                      : null),
                  };
                  newParts.push(newPart);
                  if (isLastPart) {
                    if (!isLastPossiblePart) {
                      newParts.push({
                        start: newPart.end,
                        end: newPart.end,
                        key: nextPartConfig.key,
                        endChar: '',
                        startChar: '',
                      });
                    }
                  } else if (lengthChange) {
                    newParts.push(
                      ...parts.slice(partIndex + 1).map(part => ({
                        ...part,
                        start: part.start + lengthChange,
                        end: part.end + lengthChange,
                      }))
                    );
                  } else {
                    newParts.push(...parts.slice(partIndex + 1));
                  }
                  parts = newParts;
                }
                if (isMarkerLocked) {
                  partsText = undefined;
                } else if (hasNewText) {
                  partsText = {...partsText, [partKey]: text};
                  if (isLastPart && !isLastPossiblePart) {
                    partsText[nextPartConfig.key] = '';
                  }
                }

                const newMarkers = [...markers.slice(0, i)];
                const newMarker = {
                  ...marker,
                  end: marker.end + lengthChange,
                  parts,
                  partsIds,
                  partsData,
                  partsText,
                  lastResolvedPartIndex,
                  isLocked: isMarkerLocked,
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

                let newValue = value;
                if (hasNewText) {
                  newValue = [
                    value.substring(
                      0,
                      isMarkerLocked ? marker.start : part.start
                    ),
                    isMarkerLocked
                      ? text + appendText
                      : getPartDelimitedText(isLocked, part, partConfig, text),
                    value.substring(isMarkerLocked ? marker.end : part.end),
                  ].join('');

                  setValue(newValue);
                }
                setMarkers(newMarkers);
                if (cursor) {
                  const textarea = innerRef.current;
                  innerRef.current.value = newValue;
                  const marker = newMarkers[i];
                  const part = marker.parts?.[partIndex];
                  if (cursor === 'start') {
                    textarea.selectionStart = textarea.selectionEnd =
                      isMarkerLocked ? marker.start : part.start;
                  } else if (cursor === 'end') {
                    textarea.selectionStart = textarea.selectionEnd =
                      isMarkerLocked
                        ? marker.end + appendText.length
                        : part.end;
                  }
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
                return updateFunction(
                  update({marker, partConfig, part, partIndex})
                );
              }
              return updateFunction(update);
            };
            return {
              deleteMarker,
              updateMarkerPart: ({marker, partKey}, update) =>
                updateMarkerPart(
                  {marker, partKey},
                  ({marker, part, partConfig, partIndex}) => {
                    if (typeof update === 'function') {
                      update = update({
                        marker,
                        partKey,
                        part,
                        partConfig,
                        partIndex,
                      });
                    }
                    if (mutableRef.current.disabled && update) {
                      // if disabled you can only update the data
                      return {
                        data: update.data,
                      };
                    }
                    if (update) {
                      return {
                        data:
                          update.data === undefined
                            ? marker.partsData[partKey]
                            : update.data,
                        id: update.id ?? marker.partsIds[partKey],
                        ...update,
                      };
                    }
                    return update;
                  }
                ),
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

          const selectionEnd = textarea.selectionEnd;
          const prevSelectionEnd =
            prevValue.length - (newValue.length - selectionEnd);
          const minSelectionEnd = Math.min(prevSelectionEnd, selectionEnd);

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

          const blockResult = blockMarkerUpdates({
            ...selection,
            selectionStart,
            selectionEnd: prevSelectionEnd,
          });

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

          const insertedText = newValue.substring(selectionStart, selectionEnd);

          const {
            prevMarkerIndex,
            midSelectedMarkerIndex,
            markerWithEndTouchedIndex,
            endSelectedMarkerIndex,
            nextMarkerIndex,
          } = selection;

          const {
            newValue: parsedValue,
            newMarkers: parsedMarkers,
            selectionEnd: newSelectionEnd,
          } = update({
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

          setValue(parsedValue);
          setMarkers(parsedMarkers);

          const newCursorPosition =
            parsedValue !== newValue ? newSelectionEnd : selectionEnd; // might need to be refined!!!
          textarea.value = parsedValue;
          textarea.selectionEnd = newCursorPosition;
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
            ref={mergeRefs(ref, innerRef)}
            imperativeRef={childImperativeRef}
            disabled={disabled}
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
