import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useCallback,
} from 'react';
import TetherComponent from 'react-tether';
import mergeRefs from '../helpers/mergeRefs';

// We'll copy the properties below into the mirror div.
// Note that some browsers, such as Firefox, do not concatenate properties
// into their shorthand (e.g. padding-top, padding-bottom etc. -> padding),
// so we have to list every single property explicitly.
const properties = [
  'direction', // RTL support
  'boxSizing',
  'width', // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
  'height',
  'overflowX',
  'overflowY', // copy the scrollbar for IE

  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',

  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',

  // https://developer.mozilla.org/en-US/docs/Web/CSS/font
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',

  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration', // might not make a difference, but better be safe

  'letterSpacing',
  'wordSpacing',

  'tabSize',
  'MozTabSize',
];

function getCoordinatesAtPositions(element, positions, options) {
  const debug = (options && options.debug) || false;
  if (debug) {
    const el = document.querySelector(
      '#input-textarea-caret-position-mirror-div'
    );
    if (el) el.parentNode.removeChild(el);
  }

  // The mirror div will replicate the textarea's style
  const div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  const style = div.style;
  const computed = window.getComputedStyle
    ? window.getComputedStyle(element)
    : element.currentStyle; // currentStyle for IE < 9
  const isInput = element.nodeName === 'INPUT';

  // Default textarea styles
  style.whiteSpace = 'pre-wrap';
  if (!isInput) style.wordWrap = 'break-word'; // only for textarea-s

  // Position off-screen
  style.position = 'absolute'; // required to return coordinates properly
  if (!debug) style.visibility = 'hidden'; // not 'display: none' because we want rendering

  // Transfer the element's properties to the div
  properties.forEach(prop => {
    if (isInput && prop === 'lineHeight') {
      // Special case for <input>s because text is rendered centered and line height may be != height
      if (computed.boxSizing === 'border-box') {
        const height = parseInt(computed.height, 10);
        const outerHeight =
          parseInt(computed.paddingTop, 10) +
          parseInt(computed.paddingBottom, 10) +
          parseInt(computed.borderTopWidth, 10) +
          parseInt(computed.borderBottomWidth, 10);
        const targetHeight = outerHeight + parseInt(computed.lineHeight, 10);
        if (height > targetHeight) {
          style.lineHeight = `${height - outerHeight}px`;
        } else if (height === targetHeight) {
          style.lineHeight = computed.lineHeight;
        } else {
          style.lineHeight = 0;
        }
      } else {
        style.lineHeight = computed.height;
      }
    } else {
      style[prop] = computed[prop];
    }
  });

  // The thrid special handling for input type="text" vs textarea:
  // inputs has no scroll bar
  if (!isInput && element.clientHeight < element.scrollHeight) {
    style.overflowY = 'scroll';
  } else {
    style.overflowY = 'hidden';
  }
  if (!isInput && element.clientWidth < element.scrollWidth) {
    style.overflowX = 'scroll';
  } else {
    style.overflowX = 'hidden';
  }

  const value = element.value;
  const contentBuilder = [value.substring(0, positions[0])];
  const last = value.length;
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] >= last) {
      contentBuilder.push(null);
      break;
    }
    // The thrid special handling for input type="text" vs textarea:
    // spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
    if (isInput) {
      contentBuilder.push(value[positions[i]].replace(/\s/g, '\u00a0'));
      contentBuilder.push(
        value
          .substring(positions[i] + 1, positions[i + 1])
          .replace(/\s/g, '\u00a0')
      );
    } else {
      contentBuilder.push(value[positions[i]]);
      contentBuilder.push(value.substring(positions[i] + 1, positions[i + 1]));
    }
  }

  const spans = [];
  for (let i = 0; i < contentBuilder.length; i++) {
    const span = document.createElement('span');
    if (contentBuilder[i] === null) {
      span.textContent = ' '; // || because a completely empty faux span doesn't render at all
    } else {
      span.textContent = contentBuilder[i];
    }
    if (i % 2) {
      spans.push(span);
      if (debug) {
        span.style.backgroundColor = '#aaa';
      }
    }
    div.appendChild(span);
  }

  const coordinates = [];

  const topCorrection =
    parseInt(computed.borderTopWidth, 10) +
    parseInt(computed.marginTop, 10) -
    element.scrollTop;
  const leftCorrection =
    parseInt(computed.borderLeftWidth, 10) +
    parseInt(computed.marginLeft, 10) -
    element.scrollLeft;
  const height = parseInt(computed.lineHeight, 10);
  for (let i = 0; i < spans.length; i++) {
    coordinates.push({
      top: spans[i].offsetTop + topCorrection,
      left: spans[i].offsetLeft + leftCorrection,
      height,
    });
  }

  if (debug) {
    style.top = '0';
    style.right = '0';
  } else {
    document.body.removeChild(div);
  }

  return coordinates;
}

const markers2Labels = (textarea, markers, {debug} = {}) => {
  if (!textarea) {
    return [];
  }
  const positions = [];

  for (let i = 0; i < markers.length; i++) {
    positions.push(markers[i].start, markers[i].end);
  }

  const positionsWithNoDuplicates = [];
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] !== positions[i - 1]) {
      positionsWithNoDuplicates.push(positions[i]);
    }
  }

  const coordinatesWithNoDuplicates = getCoordinatesAtPositions(
    textarea,
    positionsWithNoDuplicates,
    {debug}
  );
  const coordinates = [];

  for (let i = 0, j = 0; i < positions.length; i++) {
    coordinates.push(coordinatesWithNoDuplicates[j]);
    if (positions[i] !== positions[i + 1]) {
      j++;
    }
  }

  const labels = [];
  const clientWidth = textarea.clientWidth;
  for (let i = 0; i < coordinates.length; i += 2) {
    const {left: x, top: y, height: h} = coordinates[i];
    const {left: x2, top: y2} = coordinates[i + 1];
    if (y !== y2) {
      const parts = [{x, y, w: clientWidth - x, h}];
      const lines = Math.round((y2 - y) / h) - 1;
      for (let j = 0; j < lines; j++) {
        parts.push({x: 0, y: y + (j + 1) * h, w: clientWidth, h});
      }
      parts.push({x: 0, y: y + (lines + 1) * h, w: x2, h});
      labels.push(parts);
    } else {
      labels.push([{x, y, w: x2 - x, h}]);
    }
  }
  return labels;
};

const getStyleFromLableLine = ({x, y, w, h}) => ({
  left: `${x}px`,
  top: `${y}px`,
  height: `${h}px`,
  width: `${w}px`,
});

const LabelLine = forwardRef(({labelLine, ...restProps}, ref) => (
  <div ref={ref} {...restProps} style={getStyleFromLableLine(labelLine)} />
));

const TipAnchor = forwardRef(
  ({anchorProps, TipComponent, ...restProps}, ref) => (
    <div ref={ref} {...anchorProps}>
      <TipComponent {...restProps} />
    </div>
  )
);

const FrontLabelLines = ({
  marker,
  markers,
  labelLines,
  getClassName,
  tipClassName,
  InnerComponent,
  TipComponent,
  visibleTipData: visibleTipDataFromParent,
  updateTipVisibility,
  updateTipFocusFunction,
  markersHandlers,
  textAreaId,
  tipsZIndex,
}) => {
  const [visibleTipLabelLineIndex, setVisibleTipLabelLineIndex] = useState(-1);
  let visibleTipIndex =
    visibleTipDataFromParent == null
      ? visibleTipLabelLineIndex
      : visibleTipDataFromParent.labelLineIndex;

  if (visibleTipIndex === true) {
    visibleTipIndex = labelLines.length - 1;
  }

  const mutableRef = useRef({});

  const showTip = (type, labelLineIndex) => {
    if (visibleTipDataFromParent == null) {
      setVisibleTipLabelLineIndex(labelLineIndex);
    } else {
      updateTipVisibility({
        marker,
        visible: true,
        labelLineIndex,
        type,
      });
    }
  };
  const mouseEnter = labelLineIndex => {
    clearTimeout(mutableRef.current.timer);
    showTip('mouseOver', labelLineIndex);
  };

  const hideTip = type => {
    if (!visibleTipDataFromParent == null) {
      setVisibleTipLabelLineIndex(-1);
    } else {
      updateTipVisibility({
        marker,
        visible: false,
        type,
      });
    }
  };
  const mouseLeave = () => {
    mutableRef.current.timer = setTimeout(() => {
      hideTip('mouseOver');
    }, 250);
  };

  useEffect(() => () => clearTimeout(mutableRef.current.timer), []);

  const focus = (whereToFocus = {}) => {
    const {start, end} = whereToFocus;
    const delta = whereToFocus.delta ?? 0;
    if (start) {
      markersHandlers.focus(marker.start - delta);
    } else if (end) {
      markersHandlers.focus(marker.end + delta);
    } else {
      markersHandlers.focus();
    }
  };
  const focusEnd = () => focus({end: true});

  const markerUuid = marker.uuid;
  const focusImperativeRef = useCallback(
    obj => {
      updateTipFocusFunction({marker: markerUuid, focus: obj?.focus});
    },
    [updateTipFocusFunction, markerUuid]
  );

  const hasVisibleTip = visibleTipIndex >= 0;
  const last = labelLines.length - 1;
  return labelLines.map((labelLine, i) => {
    const isFirstLine = i === 0;
    const isLastLine = i === last;
    const menuButtonId = `${marker.uuid}[${i}].button`;
    const menuListId = `${marker.uuid}[${i}].list`;
    const isTipVisible = TipComponent && visibleTipIndex === i;
    const renderLabelLine = ref => (
      <LabelLine
        ref={ref}
        // eslint-disable-next-line react/no-array-index-key
        key={i}
        id={menuButtonId}
        role="button"
        aria-haspopup="true"
        aria-controls={menuListId}
        aria-expanded={isTipVisible}
        labelLine={labelLine}
        onMouseEnter={() => mouseEnter(i)}
        onMouseLeave={mouseLeave}
        onPointerDown={focusEnd}
        onPointerUp={focusEnd}
        onClick={focusEnd}
        data-tip-anchor-for-textarea={textAreaId}
        data-tip-anchor-for-marker={marker.uuid}
        className={getClassName({
          isFirstLine,
          isLastLine,
          isTipVisible: hasVisibleTip,
        })}>
        {InnerComponent ? (
          <InnerComponent
            marker={marker}
            markersHandlers={markersHandlers}
            labelLine={labelLine}
            labelLineIndex={i}
            labelLines={labelLines}
          />
        ) : null}
      </LabelLine>
    );
    return isTipVisible ? (
      <TetherComponent
        key="visible-tip"
        attachment="top left"
        targetAttachment="bottom left"
        style={{zIndex: tipsZIndex}}
        constraints={[
          {
            to: 'scrollParent',
            attachment: 'together',
          },
          {
            to: 'window',
            attachment: 'together',
          },
        ]}
        renderTarget={renderLabelLine}
        renderElement={ref => (
          <TipAnchor
            ref={ref}
            focusImperativeRef={focusImperativeRef}
            TipComponent={TipComponent}
            menuListId={menuListId}
            menuButtonId={menuButtonId}
            marker={marker}
            markers={markers}
            markersHandlers={markersHandlers}
            focusParent={focus}
            onHide={whereToFocus => {
              hideTip();
              if (whereToFocus !== false) {
                focus(whereToFocus); // when tip hides itself focus textarea
              }
            }}
            anchorProps={{
              className: tipClassName,
              onMouseEnter: () => mouseEnter(i),
              onMouseLeave: mouseLeave,
              'data-tip-for-textarea': textAreaId,
              'data-tip-for-marker': marker.uuid,
            }}
          />
        )}
      />
    ) : (
      renderLabelLine()
    );
  });
};

const DefaultTip = ({marker}) => <pre>{JSON.stringify(marker, null, 3)}</pre>;

const FrontMarkers = ({
  markers,
  inEditMarker,
  labels,
  getClassName,
  getTipClassName,
  InnerComponent,
  TipComponent = DefaultTip,
  visibleTipsData,
  updateTipVisibility,
  updateTipFocusFunction,
  markersHandlers,
  textAreaId,
  tipsZIndex,
}) =>
  markers.map((marker, i) => {
    const labelLines = labels[i];
    if (!labelLines) {
      return null;
    }
    return (
      <FrontLabelLines
        key={marker.uuid}
        marker={marker}
        markers={markers}
        labelLines={labelLines}
        getClassName={isFirstLastOrTipVisible =>
          getClassName({
            ...isFirstLastOrTipVisible,
            isInEdit: marker.uuid === inEditMarker?.uuid,
            marker,
          })
        }
        tipClassName={getTipClassName({
          marker,
          isInEdit: marker.uuid === inEditMarker?.uuid,
        })}
        InnerComponent={InnerComponent}
        TipComponent={TipComponent}
        visibleTipData={
          visibleTipsData
            ? visibleTipsData[marker.uuid] != null
              ? visibleTipsData[marker.uuid]
              : false
            : null
        }
        updateTipVisibility={updateTipVisibility}
        updateTipFocusFunction={updateTipFocusFunction}
        markersHandlers={markersHandlers}
        textAreaId={textAreaId}
        tipsZIndex={tipsZIndex}
      />
    );
  });

const BackLabelLines = ({labelLines, getClassName}) => {
  const last = labelLines.length - 1;
  return labelLines.map((labelLine, i) => {
    const isFirstLine = i === 0;
    const isLastLine = i === last;
    return (
      <LabelLine
        // eslint-disable-next-line react/no-array-index-key
        key={i}
        labelLine={labelLine}
        className={getClassName({isFirstLine, isLastLine})}
      />
    );
  });
};

const BackMarkers = ({
  markers,
  labels,
  inEditMarker,
  visibleTipsData,
  getClassName,
}) =>
  markers.map((marker, i) => {
    const labelLines = labels[i];
    if (!labelLines) {
      return null;
    }
    return (
      <BackLabelLines
        key={marker.uuid}
        labelLines={labelLines}
        getClassName={isFirstLast =>
          getClassName({
            ...isFirstLast,
            isInEdit: marker.uuid === inEditMarker?.uuid,
            isTipVisible: Boolean(visibleTipsData[marker.uuid]),
            marker,
          })
        }
      />
    );
  });

const defaultClassNameGetters = {
  back: ({isFirstLine, isLastLine, isInEdit, isTipVisible, marker}) =>
    `textarea-back-label textarea-back-${marker.type}-label${
      isFirstLine ? ' textarea-back-label-first-line' : ''
    }${isLastLine ? ' textarea-back-label-last-line' : ''}${
      isInEdit ? ' textarea-back-label-inedit' : ''
    }${isTipVisible ? ' textarea-back-label-tip-shown' : ''}`,
  front: ({isFirstLine, isLastLine, isInEdit, isTipVisible, marker}) =>
    `textarea-front-label textarea-front-${marker.type}-label${
      isFirstLine ? ' textarea-front-label-first-line' : ''
    }${isLastLine ? ' textarea-front-label-last-line' : ''}${
      isInEdit ? ' textarea-front-label-inedit' : ''
    }${isTipVisible ? ' textarea-front-label-tip-shown' : ''}`,
  tip: ({marker}) =>
    `textarea-tip-container textarea-tip-${marker.type}-container`,
};

const withMarkableTextArea = ({
  defaultBackgroundColor = 'white',
  tipsZIndex = 99999999,
  classNameGetters: baseClassNameGetters,
} = {}) => {
  const classNameGetters = {
    front: baseClassNameGetters?.front
      ? params =>
          baseClassNameGetters.front(
            params,
            defaultClassNameGetters.front(params)
          ) ?? defaultClassNameGetters.front(params)
      : defaultClassNameGetters.front,
    back: baseClassNameGetters?.back
      ? params =>
          baseClassNameGetters.back(
            params,
            defaultClassNameGetters.back(params)
          ) ?? defaultClassNameGetters.back(params)
      : defaultClassNameGetters.back,
    tip: baseClassNameGetters?.tip
      ? params =>
          baseClassNameGetters.tip(
            params,
            defaultClassNameGetters.tip(params)
          ) ?? defaultClassNameGetters.tip(params)
      : defaultClassNameGetters.tip,
  };
  return (TextArea = 'textarea') =>
    forwardRef(
      (
        {
          backgroundColor = defaultBackgroundColor,
          InnerComponent,
          TipComponent,
          visibleTipsData,
          updateTipVisibility,
          updateTipFocusFunction,
          onResize: onResizeFromParent,
          onScroll: onScrollFromParent,
          onMarkersChange: onMarkersChangeFromParent,
          onInEditMarkerChange: onInEditMarkerChangeFromParent,
          imperativeRef: imperativeRefFromParent,
          id,
          ...restProps
        },
        ref
      ) => {
        const mutableRef = useRef({markers: []});
        const imperativeRef = useRef();

        const innerRef = useRef();

        const [labels, setLabels] = useState([]);
        const [markers, setMarkers] = useState(mutableRef.current.markers);
        const [inEditMarker, setInEditMarker] = useState(null);

        const onResize = e => {
          const textarea = innerRef.current;
          setLabels(markers2Labels(textarea, markers));
          onResizeFromParent && onResizeFromParent(e);
        };
        const onScroll = e => {
          const textarea = innerRef.current;
          setLabels(markers2Labels(textarea, markers));
          onScrollFromParent && onScrollFromParent(e);
        };
        const onMarkersChange = e => {
          const markers = e.markers;
          setMarkers(markers);
          onMarkersChangeFromParent && onMarkersChangeFromParent(e);
        };
        const onInEditMarkerChange = e => {
          const inEditMarker = e.markers[e.inEditMarkerIndex];
          setInEditMarker(inEditMarker);
          onInEditMarkerChangeFromParent && onInEditMarkerChangeFromParent(e);
        };
        useEffect(() => {
          const textarea = innerRef.current;
          mutableRef.current.markers = markers;
          setLabels(markers2Labels(textarea, markers));
        }, [markers]);

        return (
          <div
            id={id}
            className="textarea-container"
            style={{backgroundColor, width: restProps.style?.width}}>
            <div className="textarea-back">
              <BackMarkers
                markers={mutableRef.current.markers}
                inEditMarker={inEditMarker}
                labels={labels}
                visibleTipsData={visibleTipsData}
                getClassName={classNameGetters.back}
              />
            </div>
            <TextArea
              ref={mergeRefs(ref, innerRef)}
              {...restProps}
              id={id}
              imperativeRef={mergeRefs(imperativeRef, imperativeRefFromParent)}
              onScroll={onScroll}
              onResize={onResize}
              onMarkersChange={onMarkersChange}
              onInEditMarkerChange={onInEditMarkerChange}
            />
            <div className="textarea-front">
              <FrontMarkers
                markers={mutableRef.current.markers}
                inEditMarker={inEditMarker}
                labels={labels}
                getClassName={classNameGetters.front}
                getTipClassName={classNameGetters.tip}
                InnerComponent={InnerComponent}
                TipComponent={TipComponent}
                visibleTipsData={visibleTipsData}
                updateTipVisibility={updateTipVisibility}
                updateTipFocusFunction={updateTipFocusFunction}
                markersHandlers={imperativeRef.current}
                textAreaId={id}
                tipsZIndex={tipsZIndex}
              />
            </div>
          </div>
        );
      }
    );
};

export default withMarkableTextArea;
