import negativeSupportingModulo from 'lib/helpers/negativeSupportingModulo';
import React, {useEffect, useImperativeHandle, useRef, useState} from 'react';

const buildSearchResultsPickerComponent = ({
  partKey,
  ItemComponent,
  ContainerComponent = ({ResultListComponent, ...props}) => (
    <ResultListComponent {...props} />
  ),
  onSelect,
}) => {
  const ResultListComponent = ({
    results,
    marker,
    markers,
    markersHandlers,
    onHide,
    focusParent,
    focusImperativeRef,
    menuListId,
    menuButtonId,
  }) => {
    const [focusedIndex, setFocusedIndex] = useState(null);
    useImperativeHandle(
      focusImperativeRef,
      () => ({
        focus: ({start, end, delta, index}) => {
          if (start) {
            setFocusedIndex(0);
          } else if (end) {
            setFocusedIndex(-1);
          } else if (delta != null) {
            setFocusedIndex(focusedIndex =>
              focusedIndex == null
                ? delta > 0
                  ? delta - 1
                  : delta
                : focusedIndex + delta
            );
          } else {
            setFocusedIndex(index);
          }
        },
      }),
      []
    );

    const select = data => {
      const update = onSelect({
        partKey,
        selectedItem: data,
        marker,
        markers,
      });
      if (!update.id) {
        throw new Error(
          `onSelect function in part "${partKey}"'s search options did not return an "id" field which is required`
        );
      }
      const newMarker = markersHandlers.updateMarkerPart(
        {
          marker,
          partKey,
        },
        {
          data,
          ...update,
          cursor: update.cursor ?? 'end',
          isLocked: update.isLocked ?? true,
        }
      );
      focusParent();
      if (update.hide || (update.hide === undefined && newMarker?.isLocked)) {
        setTimeout(() => onHide(false));
      }
    };

    const focused =
      focusedIndex == null
        ? null
        : negativeSupportingModulo(focusedIndex, results.length);
    const focusedRef = useRef();

    useEffect(() => {
      if (focused != null && focusedRef.current) {
        focusedRef.current.focus();
        const t = setTimeout(() => {
          if (
            document.activeElement !== focusedRef.current &&
            document.activeElement.getAttribute('tabIndex') === '-1'
          ) {
            document.activeElement.removeAttribute('tabIndex');
            focusedRef.current.focus();
          }
        });
        return () => clearTimeout(t);
      }
      return undefined;
    }, [focused]);

    const onKeyDown = e => {
      if (e.key === 'ArrowDown') {
        const next = focused + 1;
        if (next < results.length) {
          setFocusedIndex(next);
        } else {
          setFocusedIndex(null);
          focusParent();
        }
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'ArrowUp') {
        const next = focused - 1;
        if (next >= 0) {
          setFocusedIndex(next);
        } else {
          setFocusedIndex(null);
          focusParent();
        }
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'ArrowLeft') {
        setFocusedIndex(null);
        onHide({start: true});
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'ArrowRight') {
        setFocusedIndex(null);
        focusParent();
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'Enter') {
        if (results[focused]) {
          select(results[focused]);
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    return (
      <ul
        role="menu"
        id={menuListId}
        aria-labelledby={menuButtonId}
        className="search-results-list"
        onKeyDown={onKeyDown}>
        {results.map((item, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={i} role="none">
            <a
              ref={elem => {
                if (focused === i) {
                  focusedRef.current = elem;
                }
              }}
              role="menuitem"
              tabIndex="-1"
              className={`search-results-list-item${
                focused === i ? ' search-results-list-item--focused' : ''
              }`}
              onClick={() => select(item)}>
              <ItemComponent
                partKey={partKey}
                item={item}
                marker={marker}
                markers={markers}
              />
            </a>
          </li>
        ))}
      </ul>
    );
  };
  return props => (
    <ContainerComponent ResultListComponent={ResultListComponent} {...props} />
  );
};

export default buildSearchResultsPickerComponent;
