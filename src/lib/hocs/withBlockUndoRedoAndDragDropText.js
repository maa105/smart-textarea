import React, {forwardRef, useRef, useEffect} from 'react';
import mergeRefs from '../helpers/mergeRefs';

const withBlockUndoRedoAndDragDropText = TextArea =>
  forwardRef((props, ref) => {
    const innerRef = useRef();

    useEffect(() => {
      /** @type {HTMLTextAreaElement} */
      const textarea = innerRef.current;
      const prevent = e => {
        e.preventDefault();
        return false;
      };
      const preventUndoRedo = e => {
        if ((e.keyCode === 90 || e.keyCode === 89) && e.ctrlKey) {
          // ctrl-z/ctrl-y
          e.preventDefault();
          return false;
        }
        return true;
      };
      textarea.addEventListener('dragstart', prevent);
      textarea.addEventListener('dragenter', prevent);
      textarea.addEventListener('dragover', prevent);
      textarea.addEventListener('dragend', prevent);
      textarea.addEventListener('keydown', preventUndoRedo);
      return () => {
        textarea.removeEventListener('dragstart', prevent);
        textarea.removeEventListener('dragenter', prevent);
        textarea.removeEventListener('dragover', prevent);
        textarea.removeEventListener('dragend', prevent);
        textarea.removeEventListener('keydown', preventUndoRedo);
      };
    }, []);

    return <TextArea ref={mergeRefs(ref, innerRef)} {...props} />;
  });

export default withBlockUndoRedoAndDragDropText;
