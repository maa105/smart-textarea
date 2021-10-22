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
            e.stopPropagation();
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

      const onInEditMarkerChange = e => {
        const inEditMarker = e.markers[e.inEditMarkerIndex];
        const prevInEditMarker = mutableRef.current.inEditMarker;
        if (prevInEditMarker && prevInEditMarker.uuid !== inEditMarker?.uuid) {
          mutableRef.current.updateTipVisibility({
            visibile: false,
            type: 'keyboard',
          });
        }
        mutableRef.current.inEditMarker = inEditMarker;
        onInEditMarkerChangeFromParent && onInEditMarkerChangeFromParent(e);
      };

      return (
        <TextArea
          ref={mergeRefs(ref, innerRef)}
          onInEditMarkerChange={onInEditMarkerChange}
          visibleTipsData={visibleTipsData}
          updateTipVisibility={updateTipVisibility}
          {...restProps}
        />
      );
    }
  );

export default withFocusTipOnDown;
