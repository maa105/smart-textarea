import React, {forwardRef, useRef} from 'react';

const withId =
  getId =>
  (TextArea = 'textarea') =>
    forwardRef(({id, ...restProps}, ref) => {
      const textAreaId = useRef(id || getId()).current;
      return <TextArea ref={ref} id={textAreaId} {...restProps} />;
    });

export default withId;
