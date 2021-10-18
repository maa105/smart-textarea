import React, {useEffect, useRef, forwardRef} from 'react';

const withResize = (TextArea = 'textarea') =>
  forwardRef(({onResize, ...restProps}, ref) => {
    const mutableRef = useRef({});
    mutableRef.current.onResize = onResize;

    const iframeRef = useRef();

    useEffect(() => {
      const iframeElem = iframeRef.current;
      const iframeWindow = iframeElem.contentWindow;
      const onResizeListener = e => {
        if (mutableRef.current.onResize) {
          mutableRef.current.onResize(e);
        }
      };
      iframeWindow.onresize = onResizeListener;
      return () => {
        iframeWindow.onresize = null;
      };
    }, []);
    return (
      <div className="textarea-with-resize-container">
        <iframe ref={iframeRef} title="resize-frame" />
        <TextArea ref={ref} {...restProps} />
      </div>
    );
  });

export default withResize;
