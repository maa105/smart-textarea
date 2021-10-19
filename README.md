# Smart TextArea

A configurable markable react textarea component that supports multiple anchor types (people, things, places)

[Demo](https://maa105.github.io/smart-textarea/)

e.g.

```js
import 'smart-textarea-maa/lib/styles.css';
import { withSmartTextArea } from 'smart-textarea-maa';

const SmartTextArea = withSmartTextArea({
  version: 0,
  anchors: [
    {
      anchorChar: '@',
      type: 'person',
      parts: [
        {
          key: 'name',
        },
        // you can have multiple parts (to doc)
      ],
      searchOptions: {
        ResultItemComponent: PersonSearchResultItem,
        NoResultItemComponent,
        resultItemComponentOnSelect: ({selectedItem: person}) => ({
          textValue: person.name, // when an item is selected the text of it will change to what you specify by textValue
          markerData: {
            // marker data to help identify entity later
            id: person.id,
          },
        }),
        loader: ({name}, signal) => personSearch(name, signal), // first param is parsed from parts, second param is signal to cancel seach
        getCacheKey: ({name}) => name?.trim().toLowerCase() || null, // first param is parsed from parts
        debounceDuration: 350,
      },
      detailsOptions: {
        Component: PersonDetails,
        NotFoundComponent,
        loader: ({id}, signal) => personDetails(id, signal), // first param is markerData specified above
        getCacheKey: ({id}) => id,
      },
    },
    {
      anchorChar: '#',
      type: 'thing',
      parts: [
        {
          key: 'name',
        },
      ],
      searchOptions: {
        ResultsComponent: (
          {ResultListComponent, ...props} // gives flexibility to wrap ResultsList or get away with it completely
        ) => (
          <p>
            <h5>Found the following things:</h5>
            <ResultListComponent {...props} /> {/*will display a selectable list of the results using ResultItemComponent*/}
          </p>
        ),
        ResultItemComponent: ThingSearchResultItem,
        resultItemComponentOnSelect: ({selectedItem: thing}) => ({
          textValue: thing.name,
          markerData: {
            id: thing.id,
          },
        }),
        loader: ({name}, signal) => thingSearch(name, signal),
        getCacheKey: ({name}) => name?.trim().toLowerCase() || null,
        debounceDuration: 350,
      },
      detailsOptions: {
        Component: ThingDetails,
        loader: ({id}, signal) => thingDetails(id, signal),
        getCacheKey: ({id}) => id,
      },
    },
  ],
  classNameGetters: {
    front: ({ isFirstLine, isLastLine, isTipVisible, isInEdit, marker }) => 'front-label-class',
    back: ({ isFirstLine, isLastLine, isTipVisible, isInEdit, marker }) => 'back-label-class',
    tip: ({ marker }) => 'marker-class',
  }
  ErrorComponent,
  LoaderComponent,
  hideTipOnEscape: true,
});

... use it later

<SmartTextArea initValue={...} initMarkers={...} onMarkersChange={...} onChange={...} />

```
