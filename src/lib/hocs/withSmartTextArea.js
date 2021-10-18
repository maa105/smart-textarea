import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import AbortController from 'abort-controller';

import withMarkerParser from './withMarkerParser';
import withMarkableTextArea from './withMarkableTextArea';
import withResize from './withResize';
import withSelectionChange from './withSelectionChange';
import withMarkerSelectionBlocker from './withSelectionBlocker';
import withTips from './withTips';

import BaseTextArea from '../components/BaseTextArea';
import useDebounceValue from '../hooks/useDebounceValue';
import withFocusTipOnDown from './withFocusTipOnDown';
import withBlurTipsOnOutsideClickOrFocusOnInsideClick from './withBlurTipsOnOutsideClickOrFocusOnInsideClick';
import usePrev from '../hooks/usePrev';
import withBlockUndoRedoAndDragDropText from './withBlockUndoRedoAndDragDropText';

const getDetailComponent = ({
  Component,
  NotFoundComponent,
  loader,
  preProcessMarkerData,
  getCacheKey,
  LoaderComponent,
  ErrorComponent,
  getCache,
}) => {
  const cache = getCache();

  NotFoundComponent = NotFoundComponent || Component;

  return ({marker, updateMarker}) => {
    const mutableRef = useRef({});

    const [{loading, error}, setResult] = useState({});

    const {data, markerData} = marker;
    const loadData = preProcessMarkerData(markerData);
    const cacheKey = getCacheKey(loadData);

    mutableRef.current.loadData = loadData;
    mutableRef.current.updateMarker = updateMarker;
    mutableRef.current.cacheKey = cacheKey;

    useEffect(() => {
      if (data || data === null) {
        return null;
      }
      const cachedData = cache.getItem(cacheKey);
      if (cachedData || cachedData === null) {
        mutableRef.current.updateMarker({
          data: cachedData,
        });
        setResult({});
        return null;
      }
      const abortCtrl = new AbortController();
      setResult({loading: true});
      loader(mutableRef.current.loadData, abortCtrl.signal)
        .then(result => {
          result = result ?? null;
          cache.setItem(cacheKey, result);
          if (cacheKey === mutableRef.current.cacheKey) {
            mutableRef.current.updateMarker({
              data: result,
            });
            setResult({});
          }
        })
        .catch(error => {
          if (error.aborted) {
            return;
          }
          if (cacheKey === mutableRef.current.cacheKey) {
            setResult({error});
          }
        });
      return () => abortCtrl.abort();
    }, [cacheKey, data]);

    if (loading) {
      return <LoaderComponent loadData={loadData} />;
    }

    if (error) {
      return <ErrorComponent error={error} />;
    }

    if (data === null) {
      return (
        <NotFoundComponent
          data={null}
          marker={marker}
          updateMarker={updateMarker}
        />
      );
    }

    if (data) {
      return (
        <Component data={data} marker={marker} updateMarker={updateMarker} />
      );
    }

    return null;
  };
};

const modulo = (num, mod) => {
  if (num < 0) {
    return mod - 1 - ((-num - 1) % mod);
  }
  return num % mod;
};

const getSearchResultPickerComponent = ({
  ItemComponent,
  NoItemsComponent = () => 'No matching entries found',
  ContainerComponent = ({ResultListComponent, ...props}) => (
    <ResultListComponent {...props} />
  ),
  onSelect,
}) => {
  const ResultListComponent = ({
    results,
    marker,
    updateMarker,
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
        selectedItem: data,
        marker,
      });
      updateMarker({
        data,
        ...update,
        isLocked: update.isLocked ?? true,
      });
      setTimeout(() => onHide());
    };

    const focused =
      focusedIndex == null ? null : modulo(focusedIndex, results.length);
    const toFocus = usePrev(focused) !== focused ? focused : null;

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
      } else if (e.key === 'ArrowUp') {
        const next = focused - 1;
        if (next >= 0) {
          setFocusedIndex(next);
        } else {
          setFocusedIndex(null);
          focusParent();
        }
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        setFocusedIndex(null);
        onHide({start: true});
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        setFocusedIndex(null);
        focusParent();
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (results[focused]) {
          select(results[focused]);
          e.preventDefault();
        }
      }
    };

    if (!results.length) {
      return <NoItemsComponent marker={marker} />;
    }

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
              ref={
                toFocus === i
                  ? elem => {
                      if (elem?.focus) {
                        elem.focus();
                      }
                    }
                  : null
              }
              role="menuitem"
              tabIndex="-1"
              className={`search-results-list-item${
                focused === i ? ' search-results-list-item--focused' : ''
              }`}
              onClick={() => select(item)}>
              <ItemComponent item={item} />
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

const getSingleTip = ({
  tipOptions: {
    search: {
      ResultsComponent: SearchResultsComponent,
      ResultItemComponent: SearchResultsItemComponent,
      resultItemComponentOnSelect,
      NoResultItemComponent,
      loader: searchFunction,
      preProcessMarkerData: preProcessMarkerDataForSearch = markerData =>
        markerData,
      getCacheKey: getSearchCacheKey = searchData => JSON.stringify(searchData),
      LoaderComponent: SearchLoaderComponent,
      ErrorComponent: SearchErrorComponent,
      debounceDuration = 350,
    },
    details: {
      Component: DetailComponent,
      loader: loadSingleFunction,
      NotFoundComponent: DetailNotFoundComponent,
      preProcessMarkerData: preProcessMarkerDataForSingleLoad = markerData =>
        markerData,
      getCacheKey: getDetailsCacheKey = searchData =>
        JSON.stringify(searchData),
      LoaderComponent: DetailLoaderComponent,
      ErrorComponent: DetailErrorComponent,
    },
  },
  LoaderComponent: CommonLoaderComponent,
  ErrorComponent: CommonErrorComponent,
  getCache,
}) => {
  DetailComponent = getDetailComponent({
    Component: DetailComponent,
    NotFoundComponent: DetailNotFoundComponent,
    loader: loadSingleFunction,
    getCacheKey: getDetailsCacheKey,
    preProcessMarkerData: preProcessMarkerDataForSingleLoad,
    LoaderComponent: DetailLoaderComponent || CommonLoaderComponent,
    ErrorComponent: DetailErrorComponent || CommonErrorComponent,
    getCache,
  });

  SearchResultsComponent = SearchResultsItemComponent
    ? getSearchResultPickerComponent({
        ItemComponent: SearchResultsItemComponent,
        NoItemsComponent: NoResultItemComponent,
        ContainerComponent: SearchResultsComponent,
        onSelect: resultItemComponentOnSelect,
      })
    : SearchResultsComponent;

  const cache = getCache();

  const LoaderComponent = SearchLoaderComponent || CommonLoaderComponent;
  const ErrorComponent = SearchErrorComponent || CommonErrorComponent;

  return ({
    marker,
    focusParent,
    onHide,
    markersHandlers,
    focusImperativeRef,
    menuListId,
    menuButtonId,
  }) => {
    const mutableRef = useRef({});

    const {markerData} = marker;
    const searchData = preProcessMarkerDataForSearch(markerData) ?? null;

    const [{loading, error, results}, setResults] = useState({});

    mutableRef.current.isLocked = marker.isLocked;
    mutableRef.current.onHide = onHide;
    mutableRef.current.searchData = searchData;

    const cacheKey = useDebounceValue(
      searchData != null ? getSearchCacheKey(searchData) : null,
      debounceDuration
    );
    useEffect(() => {
      if (mutableRef.current.isLocked) {
        setResults({});
        return null;
      }
      mutableRef.current.cacheKey = cacheKey;
      if (cacheKey === null) {
        mutableRef.current.onHide();
        return null;
      }

      const cachedResults = cache.getItem(cacheKey);
      if (cachedResults) {
        setResults({results: cachedResults});
        return null;
      }
      const abortCtrl = new AbortController();
      setResults({loading: true});
      searchFunction(mutableRef.current.searchData, abortCtrl.signal)
        .then(results => {
          if (mutableRef.current.isLocked) {
            return;
          }
          cache.setItem(cacheKey, results);
          if (mutableRef.current.cacheKey === cacheKey) {
            setResults({results});
          }
        })
        .catch(error => {
          if (mutableRef.current.isLocked) {
            return;
          }
          if (error.aborted) {
            return;
          }
          if (mutableRef.current.cacheKey === cacheKey) {
            setResults({error});
          }
        });
      return () => abortCtrl.abort();
    }, [cacheKey]); // , marker.isLocked, onHide, searchData

    if (marker.isLocked) {
      return (
        <DetailComponent
          marker={marker}
          focusParent={focusParent}
          onHide={onHide}
          focusImperativeRef={focusImperativeRef}
          menuListId={menuListId}
          menuButtonId={menuButtonId}
          updateMarker={update => {
            markersHandlers.updateMarker(marker, update);
          }}
        />
      );
    }

    if (loading) {
      return <LoaderComponent loadData={searchData} />;
    }
    if (error) {
      return <ErrorComponent error={error} />;
    }
    if (!results) {
      return null;
    }
    return (
      <SearchResultsComponent
        results={results}
        marker={marker}
        focusParent={focusParent}
        onHide={onHide}
        focusImperativeRef={focusImperativeRef}
        menuListId={menuListId}
        menuButtonId={menuButtonId}
        updateMarker={update => {
          markersHandlers.updateMarker(marker, update);
        }}
      />
    );
  };
};

const getTip = ({
  tipsOptionsByType,
  LoaderComponent,
  ErrorComponent,
  debounceDuration,
  getCache,
}) => {
  const ComponentsByType = {};
  // eslint-disable-next-line guard-for-in
  for (const type in tipsOptionsByType) {
    ComponentsByType[type] = getSingleTip({
      tipOptions: tipsOptionsByType[type],
      LoaderComponent,
      ErrorComponent,
      debounceDuration,
      getCache,
    });
  }
  return ({
    marker,
    focusParent,
    onHide,
    markersHandlers,
    focusImperativeRef,
    menuListId,
    menuButtonId,
  }) => {
    const mutableRef = useRef({});

    mutableRef.current.onHide = onHide;

    const Component = ComponentsByType[marker.type];
    useEffect(() => {
      if (!Component) {
        mutableRef.current.onHide();
      }
    }, [Component]);

    if (Component) {
      return (
        <Component
          marker={marker}
          focusParent={focusParent}
          onHide={onHide}
          markersHandlers={markersHandlers}
          focusImperativeRef={focusImperativeRef}
          menuListId={menuListId}
          menuButtonId={menuButtonId}
        />
      );
    }
    return null;
  };
};

const defaultGetCache = () => {
  const cache = {};
  return {
    getItem: cacheKey => cache[cacheKey],
    setItem: (cacheKey, value) => {
      cache[cacheKey] = value;
    },
  };
};

const wrapGetCache = getCache => () => {
  const cache = getCache();
  return {
    getItem: cacheKey => {
      try {
        return cache.getItem(cacheKey);
      } catch (err) {
        console.error('error getting cache item', err);
        return undefined;
      }
    },
    setItem: (cacheKey, value) => {
      try {
        cache[cacheKey] = value;
      } catch (err) {
        console.error('error setting cache item', err);
      }
    },
  };
};

const withId =
  getId =>
  (TextArea = 'textarea') =>
    forwardRef(({id, ...restProps}, ref) => {
      const textAreaId = useRef(id || getId()).current;
      return <TextArea ref={ref} id={textAreaId} {...restProps} />;
    });

const withSmartTextArea = ({
  anchors: baseAnchors,
  version,
  LoaderComponent,
  ErrorComponent,
  hideTipOnEscape = true,
  debounceDuration = 300,
  getId = () => `${Math.round(Math.random() * 999999)}-${Date.now()}`,
  classNameGetters,
  getCache,
  backgroundColor,
  lineHeight,
}) => {
  getCache = getCache ? wrapGetCache(getCache) : defaultGetCache;

  const tipsOptionsByType = {};
  const anchors = [];
  baseAnchors.forEach(anchor => {
    tipsOptionsByType[anchor.type] = {
      search: anchor.searchOptions,
      details: anchor.detailsOptions,
    };
    anchors.push({
      anchorChar: anchor.anchorChar,
      type: anchor.type,
      parts: anchor.parts,
    });
  });
  return withId(getId)(
    withTips({
      hideOnEscape: hideTipOnEscape,
      TipComponent: getTip({
        tipsOptionsByType,
        LoaderComponent,
        ErrorComponent,
        debounceDuration,
        getCache,
      }),
    })(
      withBlurTipsOnOutsideClickOrFocusOnInsideClick(
        withFocusTipOnDown(
          withMarkableTextArea({
            classNameGetters,
            defaultBackgroundColor: backgroundColor,
            defaultLineHeight: lineHeight,
          })(
            withResize(
              withMarkerParser({
                markerParserOptions: {
                  version,
                  anchors,
                },
              })(
                withMarkerSelectionBlocker(
                  withSelectionChange(
                    withBlockUndoRedoAndDragDropText(BaseTextArea)
                  )
                )
              )
            )
          )
        )
      )
    )
  );
};

export default withSmartTextArea;