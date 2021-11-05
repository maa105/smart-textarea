# Smart TextArea

A configurable markable react textarea component that supports multiple anchor types (people, things, places). And multiple part per anchor type for nested/dependant/parent,child/etc... senarios

[Demo](https://maa105.github.io/smart-textarea/)

e.g.

```js
import 'smart-textarea-maa/lib/styles.css';
import { withSmartTextArea } from 'smart-textarea-maa';

const SmartTextArea = withSmartTextArea({
  version: 0, // the version for the markers will be set on all markers (helps managing old markers)
  anchors: [
    {
      anchorChar: '@',
      type: 'person',
      parts: [
        {
          key: 'person',
          endChar: ':',
          searchConfig: {
            // data: [...], you can send the data with an optional filter function
            // filterData: (data) => data.filter(...),
            loader: ({searchText}, signal) => personSearch(name, signal), // or provide a loader function.Note the first param is from getSearchData function if provided otherwise it defaults to {searchText, partsIds(the ids of the parts resolved so far)}, second param is signal to cancel seach
            ResultItemComponent: PersonSearchResultItem, // to display an item
            NoResultItemComponent,  // if none found, defaults to ResultItemComponent
            onItemSelect: ({selectedItem: person}) => ({  // very important to update marker/part on user selection/autoSelection
              text: person.name, // when an item is selected the text of it will change to what you specify by textValue
              id: person.id,
              // data: person, defaults to it anyways so no need to send if same
            }),
            debounceDuration: 350,
          },
          detailsConfig: {
            // findInSearchData, // if data is provided in search config this is needed
            loader: ({person: id}, signal) => personDetails(id, signal), // first param if from getLoadData if provided. defaults to partsIds. thats why the key is person same as current part id
            Component: PersonDetails,
            NotFoundComponent,
            getCacheKey: ({person: id}) => id, // defaults to JSON.stringify
            // shouldReloadData: (data) => data === undefined, // defaults to this anyways. use if not all needed fields are available from the search items
          },
        },
        // you can have multiple parts. see demo to get a feal for it
      ],
    },
    {
      anchorChar: '#',
      type: 'thing',
      parts: [
        {
          key: 'thing',
          searchConfig: {
            ResultsComponent: (
              {ResultListComponent, ...props} // gives flexibility to wrap ResultsList or get away with it completely
            ) => (
              <p>
                <h5>Found the following things:</h5>
                <ResultListComponent {...props} /> {/*will display a selectable list of the results using ResultItemComponent*/}
              </p>
            ),
            ResultItemComponent: ThingSearchResultItem,
            onItemSelect: ({selectedItem: thing}) => ({
              text: thing.name,
              id: thing.id,
            }),
            loader: ({searchText}, signal) => thingSearch(searchText, signal),
            getCacheKey: ({searchText}) => searchText?.trim().toLowerCase() || null,
            debounceDuration: 350,  // defaults to defaultDebounceDuration
          },
          detailsConfig: {
            Component: ThingDetails,
            loader: ({thing: id}, signal) => thingDetails(id, signal),
            getCacheKey: ({thing: id}) => id,
          },
        },
      ],
    },
  ],
  classNameGetters: {
    front: ({ isFirstLine, isLastLine, isTipVisible, isInEdit, marker }) => 'front-label-class',
    back: ({ isFirstLine, isLastLine, isTipVisible, isInEdit, marker }) => 'back-label-class',
    tip: ({ marker }) => 'marker-class',
  }
  ErrorComponent,     // default to "Loading..."
  LoaderComponent,    // defaults to displaying the error message or "Oops"
  hideTipOnEscape: true,  // defaults to true
  backgroundColor,    // default white
  lineHeight,         // default 135%
  width,              // defaults to not setting a width
  TextArea,           // base textarea to use
  tipsZIndex,         // tips z-index defaults to 99999999
  isAbortError: (error) => error.message.toLowerCase().includes('abort),
  debounceDuration: 500  // defaults to 300
});

... use it later

<SmartTextArea initValue={...} initMarkers={...} onChange={...} />

```
