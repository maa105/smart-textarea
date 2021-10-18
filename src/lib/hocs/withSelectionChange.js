import React, {useEffect, useRef, forwardRef} from 'react';
import mergeRefs from '../helpers/mergeRefs';

const withSelectionChange = (TextArea = 'textarea') =>
  forwardRef(({onSelectionChange, ...restProps}, ref) => {
    const mutableRef = useRef({});
    mutableRef.current.onSelectionChange = onSelectionChange;

    const innerRef = useRef();

    useEffect(() => {
      const textarea = innerRef.current;
      const onSelectionChangeListener = e => {
        const textarea = innerRef.current;
        if (
          textarea === document.activeElement &&
          mutableRef.current.onSelectionChange
        ) {
          mutableRef.current.onSelectionChange({target: textarea});
        }
      };
      document.addEventListener('selectionchange', onSelectionChangeListener);
      const onKeyUpListener = e => {
        // for some reason delete and backspace do not fire selectionChange
        const textarea = innerRef.current;
        if (e.key === 'Delete' || e.key === 'Backspace') {
          mutableRef.current.onSelectionChange({target: textarea});
        }
      };
      textarea.addEventListener('keyup', onKeyUpListener);
      return () => {
        document.removeEventListener(
          'selectionchange',
          onSelectionChangeListener
        );
        textarea.removeEventListener('keyup', onKeyUpListener);
      };
    }, []);
    return <TextArea ref={mergeRefs(ref, innerRef)} {...restProps} />;
  });

export default withSelectionChange;
