import React, {useImperativeHandle, useRef} from 'react';
import mergeRefs from '../helpers/mergeRefs';

const BaseTextArea = React.forwardRef(
  ({markers, imperativeRef, id, ...restProps}, ref) => {
    const innerRef = useRef();
    useImperativeHandle(
      imperativeRef,
      () => ({
        focus: selection => {
          const textarea = innerRef.current;
          textarea.focus();
          if (selection) {
            if (typeof selection === 'number') {
              textarea.selectionStart = selection;
              textarea.selectionEnd = selection;
            } else {
              textarea.selectionStart = selection.selectionStart;
              textarea.selectionEnd = selection.selectionEnd;
            }
          }
        },
      }),
      []
    );
    return (
      <textarea
        ref={mergeRefs(ref, innerRef)}
        id={`${id}-textarea`}
        {...restProps}
      />
    );
  }
);

export default BaseTextArea;
