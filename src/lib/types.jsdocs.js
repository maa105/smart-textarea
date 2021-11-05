/**
 * @typedef {import('react').Component} Component
 */

/**
 * the partsIds upto and including the current part
 * @typedef {Object<string, any>} LoadData
 */

/**
 * @callback GetDetailsLoadDataFunction
 * @param {string} partKey the key of the marker's part related to the details load
 * @param {Marker} marker the marker related to the details load
 * @param {Marker[]} markers all the markers in the textarea
 * @returns {LoadData | any} the data to send to the load function
 */

/**
 * @callback ShouldReloadDataFunction
 * @param {Object} data the data of the current part
 * @returns {boolean} return true to force reload. BE AWARE OF INFINITE LOOP POSSIBILITY!
 */

/**
 * @callback DetailsLoaderFunction
 * @param {LoadData | any} loadData the load data for the current part
 * @property {import('abort-controller').AbortSignal} signal an abort controller signal used to signal the loader function to abort (only useful if it is async)
 * @returns {Promise<Object> | Object} the details object
 */

/**
 * @callback FindInSearchDataFunction
 * @param {Object[]} data the data of the part (specified in searchConfig.data)
 * @param {LoadData | any} loadData the load data for the current part
 * @property {import('abort-controller').AbortSignal} signal an abort controller signal used to signal the loader function to abort (only useful if it is async)
 * @returns {Promise<Object> | Object} the details object
 */

/**
 * @typedef {Object} DetailsConfig
 * @property {FindInSearchDataFunction} [findInSearchData] this is used in combination with SearchConfig.data to locate the relevant item. if this is provided together with SearchConfig.data it will have preference over the "loader" function
 * @property {DetailsLoaderFunction} [loader] a function to load an specific item by id
 * @property {DetailsLoaderFunction} [loadDetails] alias for loader
 * @property {DetailsLoaderFunction} [loadDetail] alias for loader
 * @property {import('react').Component<DetailsComponentProps>} Component the component to display the details of the item after it is loaded
 * @property {import('react').Component<DetailsComponentProps>} DisplayComponent alias for Component
 * @property {import('react').Component<DetailsComponentProps>} DetailsComponent alias for Component
 * @property {import('react').Component<DetailsComponentProps>} DetailComponent alias for Component
 * @property {import('react').Component<NotFoundComponentProps>} [NotFoundComponent] the component to display if the item was not found (null was returned)
 * @property {GetDetailsCacheKeyFunction} [getCacheKey] a function to get the cache key for the load. defaults to JSON.stringify(searchData)
 * @property {ShouldReloadDataFunction} [shouldReloadData] if the part has data already this function is used to check if there is a need to reload the data again (say if more fields are needed). this is because the data is also populated from the search items which might not have all necessary fields. defaults to always false
 * @property {GetDetailsLoadDataFunction} [getLoadData] a function to get the loadData a.k.a. the data to send to the loader (DetailsConfig.loader)
 * @property {import('react').Component<LoaderComponentProps>} [LoaderComponent] a component to display while loading search or details data
 * @property {import('react').Component<ErrorComponentProps>} [ErrorComponent] a component to display errors due to search or load details
 * @property {GetCacheFunction} [getCache] a function to get a cache class/object. defaults to using a simple object
 */

/**
 * @typedef {Object} SearchData
 * @property {string} searchText the search text the user entered
 * @property {Object<string, any>} partsIds the ids of the previous parts keyed by the part key
 */

/**
 * @callback GetSearchCacheKeyFunction
 * @param {SearchData | any} searchData the search data that will be sent to the loader function
 * @returns {string} the cache key that will be used to prime the cache for this search
 */

/**
 * @callback GetDetailsCacheKeyFunction
 * @param {LoadData | any} loadData the load data that will be sent to the loader function
 * @returns {string} the cache key that will be used to prime the cache for this details load
 */

/**
 * @typedef {Object} GetSearchDataData
 * @property {string} searchText the search text the user entered
 * @property {string} partKey the key of the marker's part related to the search
 * @property {Marker} marker the marker of the current search
 * @property {Marker[]} markers all the markers in the textarea
 */

/**
 * @callback GetSearchDataFunction
 * @param {GetSearchDataData} data some useful data to help determain the search data
 * @returns {SearchData | any} the cache key that will be used to prime the cache for this search
 */

/**
 * @typedef {Object} PartUpdateData
 * @property {string} [text] the text to set for this part. will be set in the text area and on marker.partsText[partKey]. Note that if this is the last part and an id is specified the text of the entire marker will be updated and the marker will be locked
 * @property {Object} [data] the data to the for this part. will be set on this parts marker.partsData[partKey]. defaults to the search item itself
 * @property {any} [id] the id to the for this part. will be set on this parts marker.partsIds[partKey]. if specified the part will be locked, and if the last part the whole marker will be locked
 * @property {"start" | "end"} [cursor] where to set the cursor after the update. defaults to end
 * @property {boolean} [hide] whether to hide the tip after the update. defults to hide if the marker gets locked
 */

/**
 * @callback OnItemSelectFunction
 * @property {Object} selectedItem the search item selected by the user
 * @property {string} partKey the key of the marker's part related to the search
 * @property {Marker} marker the marker of the current search
 * @property {Marker[]} markers all the markers in the textarea
 * @returns {PartUpdateData} data to update the part with
 */

/**
 * @callback FilterSearchDataFunction
 * @property {Object[]} data the data of the part (specified in searchConfig.data)
 * @property {SearchData | any} searchData the search data
 * @property {import('abort-controller').AbortSignal} signal an abort controller signal used to signal the filterData function to abort (only useful if it is async)
 * @returns {Promise<Object[]> | Object[]} a filtered subset of the data
 */

/**
 * @callback SearchLoaderFunction
 * @property {SearchData | any} searchData the search data
 * @property {import('abort-controller').AbortSignal} signal an abort controller signal used to signal the filterData function to abort (only useful if it is async)
 * @returns {Promise<Object[]> | Object[]} the search results
 */

/**
 * @callback FilterSearchResultsFunction
 * @property {Object[]} results the search results
 * @property {SearchData | any} searchData the search data
 * @returns {Object[]} a filtered subset of the results
 */

/**
 * @typedef {Object} SearchConfig
 * @property {Object[]} [data] the data to use as a source for the marker part (has higher priority than the loader function)
 * @property {FilterSearchDataFunction} [filterData] if data is provided this is a function to filter the data and return relevant results for the user search. defaults to searching all fields in the data items using string.prototype.includes
 * @property {SearchLoaderFunction} [loader] a loader function to load data from a remote source
 * @property {SearchLoaderFunction} [search] an alias for loader
 * @property {SearchLoaderFunction} [searchFunction] an alias for loader
 * @property {FilterSearchResultsFunction} [filterResults] a function to use to further filter search results before displaying them defaults to not filtering anything. this could be used if say you have lookup items that are small in size, so your loader functions returns evverything and your getCacheKey returns a fixed value, then this function will be used to do the actual filtering
 * @property {import('react').Component<ResultsComponentProps>} [ResultsComponent] the results component used to display the search results. Note it is sent a prop "ResultListComponent" which is a component to display results list that is cunstructed using "ResultItemComponent" and "onItemSelect". defaults to just using "ResultListComponent" to display a list for the user to select from. So this can be used as a wrapper around the constructed "ResultListComponent" or if you optout of using "ResultListComponent" youll have to build your own selecttion component
 * @property {import('react').Component<ResultItemComponentProps>} [ResultItemComponent] a component to display a result item from the search results (used in a list so the user can pick one)
 * @property {OnItemSelectFunction} [onItemSelect] a function that is called when the user selects an item from the search results
 * @property {import('react').Component<ZeroSearchResultsComponentProps>} [ZeroSearchResultsComponent] a component to display if there is zero (0) results in the search. defaults to a generic message "No matching entries found"
 * @property {import('react').Component<NoSearchComponentProps>} [NoSearchComponent] a component to display if the search was not activated (getCacheKey returned null)
 * @property {GetSearchDataFunction} [getSearchData] a function to get the searchData a.k.a. the data to send to the loader (SearchConfig.loader)
 * @property {GetSearchCacheKeyFunction} [getCacheKey] a function to get the cache key for the search. return null to disable searching/loading. defaults to JSON.stringify(searchData)
 * @property {import('react').Component<LoaderComponentProps>} [LoaderComponent] a component to display while loading search or details data
 * @property {import('react').Component<ErrorComponentProps>} [ErrorComponent] a component to display errors due to search or load details
 * @property {number} [debounceDuration] the debounce duration for the search
 * @property {GetCacheFunction} [getCache] a function to get a cache class/object. defaults to using a simple object
 */

/**
 * @callback CacheGetItemFunction
 * @param {string} key the cache key to get
 * @returns {any | undefined} the cached data for the specified key or undefined if none exists
 */

/**
 * @callback CacheSetItemFunction
 * @param {string} key the cache key to get
 * @param {any | undefined} data the data to cache for the specified key
 */

/**
 * @typedef {Object} Cache
 * @property {CacheGetItemFunction} getItem a function to get a cache item by key
 * @property {CacheSetItemFunction} setItem a function to set data for a cache item by key
 */

/**
 * @typedef {Object} GetCacheData
 * @property {"details" | "search"} type the type of the cache data to be stored in the cache
 * @property {string} markerType the type of the marker requesting this cache
 * @property {string} partKey the marker's part key requesting this cache
 */

/**
 * @callback GetCacheFunction
 * @param {GetCacheData} data useful info about the cache being requested
 * @returns {Cache} true if the error is due to an abort
 */

/**
 * @typedef {Object} AnchorPartConfig
 * @property {string} key the key of the part (sort of like a name/id to be used as a key in an object that represents parts of the marker like partsIds, partsData...)
 * @property {string} endChar the char that is considered the end of the part
 * @property {SearchConfig} searchConfig the search configuration
 * @property {DetailsConfig} detailsConfig the details configuration
 * @property {SearchConfig} searchOptions alias for Options searchConfig
 * @property {DetailsConfig} detailsOptions alias for Options detailsConfig
 * @property {import('react').Component<LoaderComponentProps>} [LoaderComponent] a component to display while loading search or details data
 * @property {import('react').Component<ErrorComponentProps>} [ErrorComponent] a component to display errors due to search or load details
 * @property {number} [debounceDuration] the debounce duration for the search
 * @property {GetCacheFunction} [getCache] a function to get a cache class/object. defaults to using a simple object
 */

/**
 * @typedef {Object} AnchorConfig
 * @property {string} type the type of the anchor for example for @ anchor something like "person" or "mention"
 * @property {string} anchorChar the char that activates the marker e.g. '@' or '#'
 * @property {AnchorPartConfig[]} parts the parts config of this marker (can have multiple part say for loading multiple level entity)
 * @property {import('react').Component<LoaderComponentProps>} [LoaderComponent] a component to display while loading search or details data
 * @property {import('react').Component<ErrorComponentProps>} [ErrorComponent] a component to display errors due to search or load details
 * @property {number} [debounceDuration] the debounce duration for the search
 * @property {GetCacheFunction} [getCache] a function to get a cache class/object. defaults to using a simple object
 */

/**
 * @callback GetIdFunction
 * @returns {string} a unique id
 */

/**
 * @callback IsAbortErrorFunction
 * @param {Error} error the error that was captured
 * @returns {boolean} true if the error is due to an abort
 */

/**
 * @typedef {Object} GetTipClassFunctionData
 * @property {boolean} isInEdit whether the marker is in edit mode
 * @property {Marker} marker the marker we want to get the class name of
 */

/**
 * @callback GetTipClassFunction
 * @param {GetTipClassFunctionData} data useful data about the marker that we want to get the class name of
 * @param {string} defaultClassName the default class name that would have been set (use if you just want to update the class name)
 * @returns {string} the class name to set
 */

/**
 * @typedef {GetTipClassFunctionData} GetMarkerClassFunctionData
 * @property {boolean} isFirstLine a marker can span multiple lines this is true when getting the class name of the first line
 * @property {boolean} isLastLine a marker can span multiple lines this is true when getting the class name of the last line
 * @property {boolean} isTipVisible whether the tip of the marker is visible or not
 */

/**
 * @callback GetMarkerClassFunction
 * @param {GetMarkerClassFunctionData} data useful data about the marker line that we want to get the class name of
 * @param {string} defaultClassName the default class name that would have been set (use if you just want to update the class name)
 * @returns {string} the class name to set
 */

/**
 * @typedef {Object} ClassNameGettersConfig
 * @property {GetMarkerClassFunction} front a function to get the class name of the front labels. put curson here as  this is where the user interacts with the marker
 * @property {GetMarkerClassFunction} back a function to get the class name of the back labels. put bgcolor here so as not to mask text from text area
 * @property {GetTipClassFunction} tip a function to get class name of the Tip container
 */

/**
 * @typedef {Object} FocusImperativeFocusFunctionOptions
 * @property {boolean} start if true should focus the first item
 * @property {boolean} end if true should focus the last item
 * @property {number} delta if true should move the by this amount from the current focused element
 * @property {number} index specify the exact item index to focus
 */

/**
 * @callback FocusImperativeFocusFunction
 * @param {FocusImperativeFocusFunctionOptions} options used to tell the focus function about the intent of the focus
 */

/**
 * @typedef {Object} FocusImerativeObject
 * @property {FocusImperativeFocusFunction} focus a function to signal the tip to focus from the text area used for keyboard navigation from textarea to the tip
 */

/**
 * @typedef {Object} FocusParentFunctionOptions
 * @property {boolean} [start] set to true to focus at the start of the current tip's marker
 * @property {boolean} [end] set to true to focus at the end of the current tip's marker
 * @property {number} [delta] used in conjunction with start/end to shift the focus by a delta from start or end of marker
 */

/**
 * @callback FocusParentFunction
 * @param {FocusParentFunctionOptions} [options] used to tell the text area where to focus. if nullish will just focus without moving cursor
 */

/**
 * @callback OnHideFunction
 * @param {FocusParentFunctionOptions | false} [whereToFocus] used to tell the text area where to focus after hide. set to false to not focus text area. if nullish will just focus without moving cursor
 */

/**
 * @typedef {Object} FocusTextAreaFunctionData
 * @property {number} selectionStart the start of the selection
 * @property {number} selectionEnd the end of the selection
 */

/**
 * @callback FocusTextAreaFunction
 * @param {FocusTextAreaFunctionData | number} [cursorData] used to tell the text area where to set cursor upon focus. if just number will set selectionStart = selectionEnd = the number. if falsey will not change the cursor location
 */

/**
 * @callback DeleteMarkerFunction
 * @param {Marker} marker the marker to delete
 * @param {boolean} setCursor if true will set the cursor location to where the deleted marker is
 */

/**
 * @typedef {Object} UpdateMarkerPartFunctionCallbackData
 * @property {Marker} marker the marker we want to update
 * @property {string} partKey the marker part key we want to update
 * @property {Part} part the marker's part we want to update. (NOTE: will be null if marker is locked)
 * @property {PartConfig} partConfig the part config of the part we want to update
 * @property {number} partIndex the index of the part we want to update
 */

/**
 * @callback UpdateMarkerPartFunctionCallback
 * @param {UpdateMarkerPartFunctionCallbackData} data
 * @returns {UpdateMarkerPartFunctionData}
 */

/**
 * @typedef {Object} UpdateMarkerPartFunctionData
 * @property {string} text the text to set on the marker.partsText and the textarea. also if this is the last part and an id exists in the update object the whole marker text will be set to `text` and the marker will be locked
 * @property {"start" | "end"} [cursor] where to put the cursor after the updarte leave empty to not change the cursor location
 * @property {any} [data] the data to set on the marker.partsData
 * @property {any} [id] the id to set on the marker.partsIds. if specified the marker's part will be locked and if this is the last part the whole marker will be locked
 * @property {string} [appendText] the text to append at the end of the marker but not to be included in the marker itself. only applies when this is the last part and id is set (i.e. when locking the entire marker)
 */

/**
 * @callback UpdateMarkerPartFunction
 * @param {{ marker: Marker, partKey: string}} options the marker and the part key to update
 * @param {UpdateMarkerPartFunctionData | UpdateMarkerPartFunctionCallback} update the update object or a function to get the update object
 */

/**
 * @typedef {Object} VisibilityShowConfig
 * @property {string} type a type/reason why this tip is shown (mouseOver, inEdit, clickOnTip, keyboard)
 * @property {number | true} labelLineIndex since markers can span multiple lines this represents the line index you want the tip to be teathered to (true is equivelent to last line)
 */

/**
 * @typedef {Object} UpdateTipVisibilityHideActionFunctionData
 * @property {string} markerUuid the uuid of the marker
 * @property {VisibilityShowConfig[]} visiblityStack an array of all requests/reasons why this marker is shown (like mouseOver and keyboard)
 * @property {any} requestedHideType the type you requested to hide for
 */

/**
 * @typedef {boolean | 1} TipHideActionEnum
 * @description true to hide the current requested type only (default hide), false to skip the hide request for the current marker under consideration, 1 to totally hide the tip equivelent to returning empty array[] to the UpdateTipVisibilityHideActionFunction
 */

/**
 * @callback UpdateTipVisibilityHideActionFunction
 * @param UpdateTipVisibilityHideActionFunctionData some useful information to help you decide what to hide and what to keep
 * @returns {TipHideActionEnum | VisibilityShowConfig[]} an action enum or a custom visibility stack you built
 */

/**
 * @typedef {boolean | "toggle"} TipVisibilityEnum
 * @description true to show, false to hide, "toggle" to toggle visibility
 */

/**
 * @typedef {Object} UpdateTipVisibilityFunctionData
 * @property {Marker | string} [marker] the marker (or its uuid) to hide/show the tip for. required case of of show. if not specified when hide will hide all markers with type if type is specified otherwise if also type is not specified will hide all tips. for more granular control on the hiding mechanism use `hideAction`
 * @property {string} [type] the type of the show/hide. e.g. for mouseOver i use "mouseOver" for click i use "clickOnTip". This way each method can control the visibility of the tip independantly and when the tip has 0 types requesting its visibility it will be hidden. required case of of show.
 * @property {TipVisibilityEnum} [visible] whether to hide show or just toggle the visibility of this type. for toggle and show marker uuid and type are required.
 * @property {number | boolean} [labelLineIndex] since a marker can span multiple line this tells which line to show the tip at (if true will show it to last line). if different types request different lineIndexes the max will be chosen
 * @property {UpdateTipVisibilityHideActionFunction} [hideAction] a function that is called when hide on each tip that the hide criteria applies
 */

/**
 * @callback UpdateTipVisibilityFunction
 * @param {UpdateTipVisibilityFunctionData} visiblilityUpdateParams params to determain what to hide or show
 */

/**
 * @typedef {Object} MarkersHandlers
 * @property {FocusTextAreaFunction} focus the marker part key we are loading for (search or details)
 * @property {DeleteMarkerFunction} deleteMarker the marker of the current load
 * @property {UpdateMarkerPartFunction} updateMarkerPart all the markers in the textarea
 * @property {UpdateTipVisibilityFunction} updateTipVisibility a function to focus the textarea with some useful params
 */

/**
 * @typedef {Object} BaseProps
 * @property {string} partKey the marker part key we are loading for (search or details)
 * @property {Marker} marker the marker of the current load
 * @property {Marker[]} markers all the markers in the textarea
 * @property {FocusParentFunction} focusParent a function to focus the textarea with some useful params
 * @property {OnHideFunction} onHide a function to hide the tip with some useful params
 * @property {import('react').Ref<FocusImerativeObject>} focusImperativeRef a ref you can use with useImperative to add a focus function to. it will be used to navigate to the tip from the textarea using the keyboard
 * @property {string} menuListId the menu list id you need to set as an id to the <ul id={menuListId}> element (if it applies) for accessability purposes
 * @property {string} menuButtonId the menu list id you need to set as "aria-labelledby" prop to the <ul aria-labelledby={menuButtonId}> element (if it applies) for accessability purposes
 * @property {MarkersHandlers} markersHandlers useful functions you can use to interact with the smart textarea
 */

/**
 * @typedef {BaseProps} DetailsComponentProps
 * @property {Object} data the details data related to the part
 * @property {LoadData | Object} loadData the load data for the current details load.
 */

/**
 * @typedef {BaseProps} NoSearchComponentProps
 * @property {{[string]: Component<DetailsComponentProps>}} [detailsComponents] will be sent only while loading search results. It is an Object with the key the part key and the value the <DetailsComponent />
 * @property {string} [searchText] the search text the user entered
 * @property {SearchData | Object} [searchData] the search data for the current search
 */

/**
 * @typedef {Object} PartConfig
 * @property {string} key the key of the part
 * @property {string} startChar the start char of the current part
 * @property {string} endChar the end char of the current part
 */

/**
 * @typedef {Object} InitPart
 * @property {string} key the key of the part
 * @property {number} start the start index of the part
 * @property {number} end the end index of the part
 * @property {string} startChar the start char of the current part
 * @property {string} endChar the end char of the current part
 */

/**
 * @typedef {InitPart} Part
 * @property {boolean} isLocked true if the part is locked
 */

/**
 * @typedef {Object} InitMarker
 * @property {string} uuid the unique identifier of the marker
 * @property {number} version the version specified in WithSmartTextAreaConfig
 * @property {string} anchor the start anchor of the marker
 * @property {string} type the type of the marker
 * @property {number} start the start index of the marker
 * @property {number} end the end index of the marker
 * @property {Part[]} [parts] the parsed parts of the marker. only defined if the marker is not locked yet
 * @property {Object<string,any>} partsIds the ids of resolved parts keyed by the part key.
 * @property {number} lastResolvedPartIndex the index of the last resolved part
 */

/**
 * @typedef {InitMarker} Marker
 * @property {PartConfig[]} partsConfig the parts config of the marker
 * @property {Object<string,string>} partsText the text value of every part keyed by the part key. only defined if the marker is not locked yet
 * @property {Object<string,any>} partsData the data of resolved parts keyed by the part key.
 * @property {boolean} isLocked true if the marker is locked. (note this could be computed from lastResolvedPartIndex)
 */

/**
 * @typedef {Object} ResultItemComponentProps
 * @property {Object} item the search result item to display
 * @property {string} partKey the marker part key we are doing the search for
 * @property {Marker} marker the marker of the current load
 * @property {Marker[]} markers all the markers in the textarea
 */

/**
 * @typedef {BaseProps} ResultsComponentProps
 * @property {ResultListComponent} [ResultListComponent] if you sent "ResultItemComponent" to in "searchConfig" this Component will be added as a prop for you to use in the "ResultsComponent". this componet will display the search results in a list form with accessibility and keyboard support
 * @property {Object[]} results the search results
 * @property {{[string]: Component<DetailsComponentProps>}} detailsComponents will be sent only while loading search results. It is an Object with the key the part key and the value the <DetailsComponent />
 * @property {string} searchText the search text the user entered
 * @property {SearchData | Object} searchData the search data for the current search
 */

/**
 * @typedef {BaseProps} ZeroSearchResultsComponentProps
 * @property {Object[]} results the search results will be always epty array
 * @property {{[string]: Component<DetailsComponentProps>}} detailsComponents will be sent only while loading search results. It is an Object with the key the part key and the value the <DetailsComponent />
 * @property {string} searchText the search text the user entered
 * @property {SearchData | Object} searchData the search data for the current search
 */

/**
 * @typedef {BaseProps} NotFoundComponentProps
 * @property {null} data will always be null since the data was not found
 * @property {LoadData | Object} loadData the load data for the current details load
 */

/**
 * @typedef {BaseProps} LoaderComponentProps
 * @property {{[string]: Component<DetailsComponentProps>}} [detailsComponents] will be sent only while loading search results. It is an Object with the key the part key and the value the <DetailsComponent />
 * @property {string} [searchText] the search text the user entered. only availavble in case of search
 * @property {SearchData | Object} [searchData] the search data for the current search. only availavble in case of search
 * @property {LoadData | Object} [loadData] the load data for the current details load. only availavble in case of details load
 */

/**
 * @typedef {LoaderComponentProps} ErrorComponentProps
 * @property {Error} error the error object that was thrown
 * @property {Function} [retry] a function to retry the search/details load
 */

/**
 * @typedef {Object} WithSmartTextAreaConfig
 * @property {AnchorConfig[]} anchors
 * @property {number} [version] version of the config will be added to all markers. defaults to zero
 * @property {boolean} [hideTipOnEscape] whether to hide tip on escape defaults to true
 * @property {GetIdFunction} [getId] a function to generate unique ids by default uses `${Math.random()-Date.now()}`
 * @property {string} [backgroundColor] background color of the text area defaults to white
 * @property {string} [lineHeight] default lineheight of text area. defaults to 135%
 * @property {string} [width] default width of textarea. defaults to not setting a width
 * @property {Component | "textarea"} [TextArea] the base textarea component to use. defaults to html <textarea/>
 * @property {number} [tipsZIndex] the zindex of the tips defaults to 99999999
 * @property {IsAbortErrorFunction} [isAbortError] a function to detect if the thrown error of loader functions is due to an abort. defaults to checking if error.message includes the word abort
 * @property {ClassNameGettersConfig} [classNameGetters] a function to get class names for different parts of the component
 * @property {import('react').Component<LoaderComponentProps>} [LoaderComponent] a component to display while loading search or details data
 * @property {import('react').Component<ErrorComponentProps>} [ErrorComponent] a component to display errors due to search or load details
 * @property {number} [debounceDuration] the debounce duration for the search
 * @property {GetCacheFunction} [getCache] a function to get a cache class/object. defaults to using a simple object
 */

/**
 * @typedef {Object} OnChangeHandleEventArgs
 * @property {HTMLTextAreaElement} target
 * @property {string} value
 * @property {Marker[]} markers
 */

/**
 * @callback OnChangeHandler
 * @param {OnChangeHandleEventArgs} eventArgs
 */

/**
 * @typedef {Object} SmartTextAreaProps
 * @property {OnChangeHandler} onChange
 * @property {string} initValue
 * @property {InitMarker[]} initMarkers
 */

/**
 * @callback WithSmartTextAreaHOC
 * @param {WithSmartTextAreaConfig} config
 * @returns {import('react').FunctionComponent<SmartTextAreaProps>}
 */
