import React, {useEffect, useRef} from 'react';
import buildMarkerTipComponent from './buildMarkerTipComponent';

const buildTipComponent = ({tipsOptionsByType, isAbortError}) => {
  const ComponentsByType = {};
  // eslint-disable-next-line guard-for-in
  for (const type in tipsOptionsByType) {
    ComponentsByType[type] = buildMarkerTipComponent({
      tipOptions: tipsOptionsByType[type],
      isAbortError,
    });
  }
  return ({
    marker,
    markers,
    focusParent,
    onHide,
    markersHandlers,
    focusImperativeRef,
    menuListId,
    menuButtonId,
  }) => {
    const mutableRef = useRef({});

    mutableRef.current.onHide = onHide;

    const Component = ComponentsByType[marker.type];
    useEffect(() => {
      if (!Component) {
        mutableRef.current.onHide();
      }
    }, [Component]);

    if (Component) {
      return (
        <Component
          marker={marker}
          markers={markers}
          focusParent={focusParent}
          onHide={onHide}
          markersHandlers={markersHandlers}
          focusImperativeRef={focusImperativeRef}
          menuListId={menuListId}
          menuButtonId={menuButtonId}
        />
      );
    }
    return null;
  };
};

export default buildTipComponent;
