import withMarkerParser from '../../withMarkerParser';
import withMarkableTextArea from '../../withMarkableTextArea';
import withResize from '../../withResize';
import withSelectionChange from '../../withSelectionChange';
import withMarkerSelection from '../../withMarkerSelection';
import withTips from '../../withTips';
import withFocusTipOnDown from '../../withFocusTipOnDown';
import withBlurTipsOnOutsideClickOrFocusOnInsideClick from '../../withBlurTipsOnOutsideClickOrFocusOnInsideClick';
import withBlockUndoRedoAndDragDropText from '../../withBlockUndoRedoAndDragDropText';
import withBaseTextArea from '../../withBaseTextArea';
import fortifyGetCache from '../helpers/fortifyGetCache.';
import defaultGetCache from '../helpers/defaultGetCache';
import mapAndKeyBy from '../../../helpers/mapAndKeyBy';
import searchArray from '../../../helpers/searchArray';
import ensureLoaderIsAsync from '../helpers/ensureLoaderIsAsync';
import withId from './withId';
import withStyle from './withStyle';
import buildTipComponent from '../builders/component/buildTipComponent';

/** @type {import('./types.jsdocs').WithSmartTextAreaHOC} */
const withSmartTextArea = ({
  anchors: baseAnchors,
  version = 0,
  LoaderComponent,
  ErrorComponent,
  hideTipOnEscape = true,
  debounceDuration = 300,
  getId = () => `${Math.round(Math.random() * 999999)}-${Date.now()}`,
  classNameGetters,
  getCache,
  backgroundColor,
  lineHeight,
  width,
  TextArea,
  tipsZIndex,
  isAbortError = error =>
    error.aborted || error.message.toLowerCase().includes('abort'),
}) => {
  getCache = getCache ? fortifyGetCache(getCache) : defaultGetCache;

  const tipsOptionsByType = mapAndKeyBy(
    baseAnchors,
    anchor => {
      const anchorGetCache = anchor.getCache
        ? fortifyGetCache(anchor.getCache)
        : getCache;
      const anchorLoaderComponent =
        anchor.LoaderComponent || LoaderComponent || (() => 'Loading...');
      const anchorErrorComponent =
        anchor.ErrorComponent ||
        ErrorComponent ||
        (({error}) => error?.message || 'Oops');
      const anchorDebounceDuration =
        anchor.debounceDuration || debounceDuration;

      return {
        markerType: anchor.type,
        parts: anchor.parts.map(
          (
            {
              key,
              searchConfig,
              detailsConfig,
              searchOptions,
              detailsOptions,
              LoaderComponent,
              ErrorComponent,
              debounceDuration,
              getCache,
            },
            i
          ) => {
            searchConfig = searchConfig || searchOptions;
            detailsConfig = detailsConfig || detailsOptions;
            let searchLoader;
            if (searchConfig.data) {
              searchLoader = (
                searchConfig.filterData ||
                ((data, searchData) => searchArray(data, searchData.searchText))
              ).bind(null, searchConfig.data);
            } else {
              searchLoader =
                searchConfig.loader ||
                searchConfig.search ||
                searchConfig.searchFunction;
            }
            if (!searchLoader) {
              throw new Error(
                `${anchor.type}'s ${key} part does not have a search "loader" function nor (a "data" field with optional "filterData" function)`
              );
            }
            let detailsLoader;
            if (detailsConfig) {
              if (searchConfig.data) {
                if (!detailsConfig.findInSearchData) {
                  throw new Error(
                    `${anchor.type}'s ${key} part which has a "data" search field does not provide a "findInSearchData" function. It is needed to locate an specific item by id in the search "data"`
                  );
                }
                detailsLoader = detailsConfig.findInSearchData.bind(
                  null,
                  searchConfig.data
                );
              } else {
                detailsLoader =
                  detailsConfig.loader ||
                  detailsConfig.loadDetails ||
                  detailsConfig.loadDetail;
              }
              if (!detailsLoader) {
                throw new Error(
                  `${anchor.type}'s ${key} part does not have a details "loader" function nor a (details "findInSearchData" function and a search "data" field)`
                );
              }
            } else if (i === anchor.parts[i].length - 1) {
              throw new Error(
                `detailsConfig is issing for last part (${key}) of marker ${anchor.type}. Last part of a marker must have a detailsConfig defined`
              );
            }

            return {
              key,
              search: {
                LoaderComponent: LoaderComponent || anchorLoaderComponent,
                ErrorComponent: ErrorComponent || anchorErrorComponent,
                debounceDuration: debounceDuration || anchorDebounceDuration,
                ...searchConfig,
                filterResults:
                  searchConfig.filterResults || (results => results),
                getCache:
                  searchConfig.getCache || getCache
                    ? fortifyGetCache(searchConfig.getCache || getCache)
                    : anchorGetCache,
                loader: ensureLoaderIsAsync(searchLoader),
              },
              details: detailsConfig
                ? {
                    LoaderComponent: LoaderComponent || anchorLoaderComponent,
                    ErrorComponent: ErrorComponent || anchorErrorComponent,
                    ...detailsConfig,
                    Component:
                      detailsConfig.Component ||
                      detailsConfig.DisplayComponent ||
                      detailsConfig.DetailsComponent ||
                      detailsConfig.DetailComponent,
                    getCache:
                      detailsConfig.getCache || getCache
                        ? fortifyGetCache(detailsConfig.getCache || getCache)
                        : anchorGetCache,
                    loader: ensureLoaderIsAsync(detailsLoader),
                  }
                : null,
            };
          }
        ),
      };
    },
    'type'
  );
  const anchors = baseAnchors.map(anchor => ({
    anchorChar: anchor.anchorChar,
    type: anchor.type,
    parts: anchor.parts.map(
      ({
        searchConfig,
        detailsConfig,
        searchOptions,
        detailsOptions,
        LoaderComponent,
        ErrorComponent,
        debounceDuration,
        getCache,
        ...restOptions
      }) => restOptions
    ),
  }));

  return withId(getId)(
    withStyle({
      defaultLineHeight: lineHeight,
      defaultWidth: width,
    })(
      withTips({
        hideOnEscape: hideTipOnEscape,
        TipComponent: buildTipComponent({
          tipsOptionsByType,
          isAbortError,
        }),
      })(
        withBlurTipsOnOutsideClickOrFocusOnInsideClick(
          withFocusTipOnDown(
            withMarkableTextArea({
              classNameGetters,
              tipsZIndex,
              defaultBackgroundColor: backgroundColor,
            })(
              withResize(
                withMarkerParser({
                  markerParserOptions: {
                    version,
                    anchors,
                  },
                })(
                  withMarkerSelection(
                    withSelectionChange(
                      withBlockUndoRedoAndDragDropText(
                        withBaseTextArea(TextArea)
                      )
                    )
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
