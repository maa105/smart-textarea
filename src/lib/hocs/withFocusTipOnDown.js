import React, {forwardRef, useEffect, useRef} from 'react';
import mergeRefs from '../helpers/mergeRefs';

const withFocusTipOnDown = TextArea =>
  forwardRef(
    (
      {
        visibleTipsData,
        updateTipVisibility,
        onInEditMarkerChange: onInEditMarkerChangeFromParent,
        ...restProps
      },
      ref
    ) => {
      const innerRef = useRef();
      const mutableRef = useRef({});
      mutableRef.current.visibleTipsData = visibleTipsData;
      mutableRef.current.updateTipVisibility = updateTipVisibility;

      useEffect(() => {
        const textarea = innerRef.current;
        const listener = e => {
          const inEditMarker = mutableRef.current.inEditMarker;
          if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && inEditMarker) {
            mutableRef.current.updateTipVisibility({
              marker: inEditMarker,
              visibile: true,
              type: 'keyboard',
            });
            const markerUuid = inEditMarker.uuid;
            setTimeout(() => {
              const tipData = mutableRef.current.visibleTipsData[markerUuid];
              if (tipData?.focus) {
                tipData.focus({
                  delta: e.key === 'ArrowDown' ? 1 : -1,
                });
              }
            });
            e.preventDefault();
          } else {
            mutableRef.current.updateTipVisibility({
              visibile: false,
              type: 'keyboard',
            });
          }
        };
        textarea.addEventListener('keydown', listener);
        return () => textarea.removeEventListener('keydow', listener);
      }, []);

      return (
        <TextArea
          ref={mergeRefs(ref, innerRef)}
          onInEditMarkerChange={e => {
            mutableRef.current.inEditMarker = e.markers[e.inEditMarkerIndex];
            onInEditMarkerChangeFromParent && onInEditMarkerChangeFromParent(e);
          }}
          visibleTipsData={visibleTipsData}
          updateTipVisibility={updateTipVisibility}
          {...restProps}
        />
      );
    }
  );

export default withFocusTipOnDown;
