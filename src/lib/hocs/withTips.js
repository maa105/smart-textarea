import React, {
  useEffect,
  useState,
  forwardRef,
  useCallback,
  useRef,
} from 'react';
import useImperativeForwarder from '../hooks/useImperativeForwarder';

export const TOTAL_HIDE = 1;
export const SKIP_HIDE = false;
export const DEFAULT_HIDE = true;

export const VISIBLE = true;
export const NOT_VISIBLE = false;
export const TOGGLE_VISIBLITY = 'toggle';

const withHideTipOnEscape =
  TipComponent =>
  ({onHide, ...restProps}) => {
    const mutableRef = useRef({});

    mutableRef.current.onHide = onHide;

    useEffect(() => {
      const listener = e => {
        if (e.key === 'Escape') {
          mutableRef.current.onHide();
        }
      };
      document.addEventListener('keyup', listener);
      return () => document.removeEventListener('keyup', listener);
    }, []);
    return <TipComponent onHide={onHide} {...restProps} />;
  };

const wrapHideAction =
  (baseHideAction = () => DEFAULT_HIDE) =>
  ({markerUuid, visiblityStack, requestedHideType}) => {
    const hideOrNewVisiblityStack = baseHideAction({
      markerUuid,
      visiblityStack,
    });
    if (Array.isArray(hideOrNewVisiblityStack)) {
      return hideOrNewVisiblityStack;
    }
    if (hideOrNewVisiblityStack === SKIP_HIDE) {
      return visiblityStack;
    }
    if (hideOrNewVisiblityStack === TOTAL_HIDE || !requestedHideType) {
      return [];
    }
    return visiblityStack.filter(({type}) => type !== requestedHideType);
  };

const withTips = ({TipComponent, hideOnEscape = true} = {}) => {
  if (hideOnEscape) {
    TipComponent = withHideTipOnEscape(TipComponent);
  }
  return (TextArea = 'textarea') =>
    forwardRef(
      (
        {
          imperativeRef,
          onInEditMarkerChange: onInEditMarkerChangeFromParent,
          ...restProps
        },
        ref
      ) => {
        const [{data: visibleTipsData}, setVisibleTipsSettings] = useState({
          data: {},
          dataStack: {},
        });

        const updateTipFocusFunction = useCallback(({marker, focus}) => {
          const markerUuid = marker?.uuid || marker;
          setVisibleTipsSettings(visibleTipsSettings => {
            const {data: tipsData, dataStack: tipsDataStack} =
              visibleTipsSettings;

            if (!tipsData[markerUuid]) {
              return visibleTipsSettings;
            }

            return {
              data: {
                ...tipsData,
                [markerUuid]: {
                  ...tipsData[markerUuid],
                  focus,
                },
              },
              dataStack: tipsDataStack,
            };
          });
        }, []);
        const updateTipVisibility = useCallback(
          ({marker, type, visibile, labelLineIndex, hideAction}) => {
            hideAction = wrapHideAction(hideAction);
            const markerUuid = marker?.uuid || marker;
            if (!visibile && !markerUuid) {
              setVisibleTipsSettings(visibleTipsSettings => {
                const {data: tipsData, dataStack: tipsDataStack} =
                  visibleTipsSettings;
                const newTipsData = {...tipsData};
                const newTipsDataStack = {...tipsDataStack};
                // eslint-disable-next-line guard-for-in
                for (const markerUuid in newTipsDataStack) {
                  const newCurrMarkerDataStack = hideAction({
                    markerUuid,
                    visiblityStack: tipsDataStack[markerUuid],
                    requestedHideType: type,
                  });
                  if (newCurrMarkerDataStack.length) {
                    newTipsDataStack[markerUuid] = newCurrMarkerDataStack;

                    const focus = newTipsData[markerUuid].focus;
                    const lastTipData =
                      newTipsDataStack[markerUuid][
                        newTipsDataStack[markerUuid].length - 1
                      ];
                    newTipsData[markerUuid] = {
                      type: lastTipData.type,
                      labelLineIndex: lastTipData.labelLineIndex,
                      focus,
                    };
                  } else {
                    delete newTipsDataStack[markerUuid];
                    delete newTipsData[markerUuid];
                  }
                }
                return {
                  data: newTipsData,
                  dataStack: newTipsDataStack,
                };
              });
              return;
            }
            setVisibleTipsSettings(visibleTipsSettings => {
              const {data: tipsData, dataStack: tipsDataStack} =
                visibleTipsSettings;

              visibile =
                visibile === TOGGLE_VISIBLITY
                  ? !tipsDataStack[markerUuid]?.find(data => data.type === type)
                  : Boolean(visibile);

              if (!visibile) {
                const oldDataStack = tipsDataStack[markerUuid];
                if (!oldDataStack) {
                  return visibleTipsSettings;
                }
                const newCurrMarkerDataStack = hideAction({
                  markerUuid,
                  visiblityStack: oldDataStack,
                  requestedHideType: type,
                });

                if (newCurrMarkerDataStack.length) {
                  const lastTipData =
                    newCurrMarkerDataStack[newCurrMarkerDataStack.length - 1];
                  return {
                    data: {
                      ...tipsData,
                      [markerUuid]: {
                        type: lastTipData.type,
                        labelLineIndex: lastTipData.labelLineIndex,
                        focus: tipsData[markerUuid].focus,
                      },
                    },
                    dataStack: {
                      ...tipsDataStack,
                      [markerUuid]: newCurrMarkerDataStack,
                    },
                  };
                }

                const newTipsData = {...tipsData};
                delete newTipsData[markerUuid];

                const newDataStack = {...tipsDataStack};
                delete newDataStack[markerUuid];

                return {
                  data: newTipsData,
                  dataStack: newDataStack,
                };
              }
              type = type || 'default-inner';
              return {
                data: {
                  ...tipsData,
                  [markerUuid]: {
                    type,
                    labelLineIndex: labelLineIndex ?? true,
                    focus: tipsData[markerUuid]?.focus,
                  },
                },
                dataStack: {
                  ...tipsDataStack,
                  [markerUuid]: [
                    ...(tipsDataStack[markerUuid] || []).filter(
                      data => data.type !== type
                    ),
                    {type, labelLineIndex: labelLineIndex ?? true},
                  ],
                },
              };
            });
          },
          []
        );

        const [childImperativeRef] = useImperativeForwarder(
          imperativeRef,
          () => ({
            updateTipVisibility,
          }),
          [updateTipVisibility]
        );

        return (
          <TextArea
            ref={ref}
            {...restProps}
            imperativeRef={childImperativeRef}
            TipComponent={TipComponent}
            visibleTipsData={visibleTipsData}
            updateTipVisibility={updateTipVisibility}
            updateTipFocusFunction={updateTipFocusFunction}
            onInEditMarkerChange={e => {
              const {markers, inEditMarkerIndex, oldInEditMarkerIndex} = e;
              const inEditMarker = markers[inEditMarkerIndex];
              const oldInEditMarker = markers[oldInEditMarkerIndex];
              if (
                oldInEditMarker &&
                oldInEditMarker.uuid !== inEditMarker?.uuid
              ) {
                updateTipVisibility({
                  marker: oldInEditMarker,
                  visibile: false,
                  type: 'inEdit',
                });
              }
              if (inEditMarker) {
                updateTipVisibility({
                  marker: inEditMarker,
                  visibile: true,
                  type: 'inEdit',
                });
              }
              onInEditMarkerChangeFromParent &&
                onInEditMarkerChangeFromParent(e);
            }}
          />
        );
      }
    );
};

export default withTips;
