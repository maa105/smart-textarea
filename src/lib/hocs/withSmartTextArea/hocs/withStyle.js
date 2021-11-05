import React, {forwardRef} from 'react';

const withStyle =
  ({defaultLineHeight = '135%', defaultWidth}) =>
  (TextArea = 'textarea') =>
    forwardRef(({width, lineHeight, ...restProps}, ref) => (
      <TextArea
        ref={ref}
        {...restProps}
        style={{
          ...restProps.style,
          width: width ?? restProps.style?.width ?? defaultWidth,
          lineHeight:
            lineHeight ?? restProps.style?.lineHeight ?? defaultLineHeight,
        }}
      />
    ));

export default withStyle;
