import React, {forwardRef, useEffect, useRef} from 'react';
import mergeRefs from '../helpers/mergeRefs';

const withBlurTipsOnOutsideClickOrFocusOnInsideClick = TextArea =>
  forwardRef(({id, updateTipVisibility, ...restProps}, ref) => {
    const innerRef = useRef();
    const mutableRef = useRef({});
    mutableRef.current.updateTipVisibility = updateTipVisibility;

    useEffect(() => {
      const mutable = mutableRef.current;
      const listener = e => {
        let elem = e.target;
        let inMe = false;
        while (elem) {
          if (
            elem.id === id ||
            elem.dataset?.tipForTextarea === id ||
            elem.dataset?.tipAnchorForTextarea === id
          ) {
            inMe = true;
            break;
          }
          elem = elem.parentNode;
        }
        if (!inMe) {
          mutable.updateTipVisibility({
            visibile: false,
          });
          e.preventDefault();
        } else {
          mutable.updateTipVisibility({
            visibile: false,
            type: 'clickOnTip',
          });
          const markerUuid =
            elem.dataset?.tipForMarker || elem.dataset?.tipAnchorForMarker;
          if (markerUuid) {
            mutable.updateTipVisibility({
              marker: markerUuid,
              visibile: true,
              type: 'clickOnTip',
            });
          }
        }
      };
      document.addEventListener('click', listener);
      return () => document.removeEventListener('click', listener);
    }, [id]);

    return (
      <TextArea
        id={id}
        ref={mergeRefs(ref, innerRef)}
        updateTipVisibility={updateTipVisibility}
        {...restProps}
      />
    );
  });

export default withBlurTipsOnOutsideClickOrFocusOnInsideClick;
