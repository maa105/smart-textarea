import React, {forwardRef, useEffect, useRef} from 'react';
import mergeRefs from '../helpers/mergeRefs';
import {
  DEFAULT_HIDE,
  SKIP_HIDE,
  TOGGLE_VISIBLITY,
  TOTAL_HIDE,
} from './withTips';

const withBlurTipsOnOutsideClickOrFocusOnInsideClick = TextArea =>
  forwardRef(({id, updateTipVisibility, ...restProps}, ref) => {
    const innerRef = useRef();
    const mutableRef = useRef({});
    mutableRef.current.updateTipVisibility = updateTipVisibility;

    useEffect(() => {
      const mutable = mutableRef.current;
      const clickListener = e => {
        let elem = e.target;
        let onTextArea = false;
        let onTip = false;
        let onMarker = false;
        while (elem) {
          onTextArea = elem.id === id;
          onTip = elem.dataset?.tipForTextarea === id;
          onMarker = elem.dataset?.tipAnchorForTextarea === id;
          if (onTextArea || onTip || onMarker) {
            break;
          }
          elem = elem.parentNode;
        }
        if (!onTextArea && !onTip && !onMarker) {
          mutable.updateTipVisibility({
            visible: false,
          });
        } else {
          const anchorMarkerUuid = onMarker && elem.dataset.tipAnchorForMarker;
          mutable.updateTipVisibility({
            visible: false,
            type: 'clickOnTip',
            hideAction: ({markerUuid, visiblityStack}) => {
              if (markerUuid !== anchorMarkerUuid) {
                return DEFAULT_HIDE;
              }
              return SKIP_HIDE;
            },
          });
          if (onMarker) {
            mutable.updateTipVisibility({
              marker: anchorMarkerUuid,
              visible: TOGGLE_VISIBLITY,
              type: 'clickOnTip',
              hideAction: () => TOTAL_HIDE,
            });
          } else if (onTip) {
            mutable.updateTipVisibility({
              marker: elem.dataset.tipForMarker,
              visible: true,
              type: 'clickOnTip',
            });
          }
        }
      };
      document.addEventListener('click', clickListener);
      return () => document.removeEventListener('click', clickListener);
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
