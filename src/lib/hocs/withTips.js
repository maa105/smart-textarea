import React, {
  useEffect,
  useState,
  forwardRef,
  useCallback,
  useRef,
} from 'react';
import useImperativeForwarder from '../hooks/useImperativeForwarder';

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
          ({marker, type, visibile, labelLineIndex}) => {
            const markerUuid = marker?.uuid || marker;
            if (!visibile && !markerUuid) {
              if (!type) {
                setVisibleTipsSettings({
                  data: {},
                  dataStack: {},
                });
                return;
              }
              setVisibleTipsSettings(visibleTipsSettings => {
                const {data: tipsData, dataStack: tipsDataStack} =
                  visibleTipsSettings;
                const newTipsData = {...tipsData};
                const newTipsDataStack = {...tipsDataStack};
                // eslint-disable-next-line guard-for-in
                for (const markerUuid in newTipsDataStack) {
                  newTipsDataStack[markerUuid] = newTipsDataStack[
                    markerUuid
                    // eslint-disable-next-line no-loop-func
                  ].filter(({type: currType}) => currType !== type);
                  if (newTipsDataStack[markerUuid].length) {
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

              if (!visibile) {
                const oldDataStack = tipsDataStack[markerUuid];
                if (oldDataStack) {
                  if (type) {
                    const newDataStack = oldDataStack.filter(
                      ({type: currType}) => type !== currType
                    );

                    if (newDataStack.length) {
                      const lastTipData = newDataStack[newDataStack.length - 1];
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
                          [markerUuid]: newDataStack,
                        },
                      };
                    }
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

                return visibleTipsSettings;
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
              const {inEditMarker, oldInEditMarker} = e;
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
