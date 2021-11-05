import React, {useEffect, useRef, useState} from 'react';
import {withSmartTextArea} from '../../lib';
import './SmartTextArea.css';

const ErrorComponent = ({error}) => error.message;
const LoaderComponent = () => (
  <h5>
    <b>Loading...</b>
  </h5>
);

const PersonDetails = ({data: person}) => (
  <div className="person-details-container">
    <img src={person.imageUrl} alt="person" />
  </div>
);
const PersonSearchResultItem = ({item: person}) => (
  <div className="person-item">
    <img src={person.imageUrl} alt="person" />
    &nbsp;
    {person.name}
  </div>
);

export const people = [
  {
    id: 'mo',
    name: 'Mohammad Amin',
    imageUrl: './img/img (2).jpg',
  },
  {
    id: 'lara',
    name: 'Lara Croft',
    imageUrl: './img/img (1).png',
  },
  {
    id: 'john',
    name: 'John Doe',
    imageUrl: './img/img (1).jpg',
  },
  {
    id: 'jane',
    name: 'Jane Doe',
    imageUrl: './img/img (2).png',
  },
  {
    id: 'bilz',
    name: 'Bilal Harb',
    imageUrl: './img/img (3).jpg',
  },
  {
    id: 'paul',
    name: 'Paul Pogba',
    imageUrl: './img/img (3).png',
  },
  {
    id: 'nitin',
    name: 'Nitin Picktach',
    imageUrl: './img/img (4).png',
  },
];
const personSearch = (name, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      resolve(
        people.filter(person =>
          person.name
            ?.trim()
            .toLocaleLowerCase()
            .includes(name?.trim().toLowerCase())
        )
      );
    }, 1000 + 2000 * Math.random());
    signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      clearTimeout(t);
      reject(error);
    });
  });

const personDetails = (id, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      resolve(people.find(person => person.id === id));
    }, 500 + 1000 * Math.random());
    signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      clearTimeout(t);
      reject(error);
    });
  });

const ThingDetails = ({data: thing}) => (
  <div>
    <h5>{thing.name}</h5>
    <p>{thing.details}</p>
  </div>
);
const ThingSearchResultItem = ({item: thing}) => (
  <div className="thing-item">{thing.name}</div>
);

export const things = [
  {
    id: 'spoon',
    name: 'Spoon',
    details: 'To eat soup',
  },
  {
    id: 'fork',
    name: 'Fork',
    details: 'To eat fries',
  },
  {
    id: 'spork',
    name: 'Spork',
    details: 'Multi purpose',
  },
  {
    id: 'knife',
    name: 'Knife',
    details: 'To cut food',
  },
  {
    id: 'plate',
    name: 'Plate',
    details: 'Food container',
  },
  {
    id: 'pencil',
    name: 'Pencil',
    imageUrl: '/img/img (3).jpg',
    details: 'To write down notes',
  },
  {
    id: 'Pen',
    name: 'Pen',
    details: 'To write in exams',
  },
];
const thingSearch = (name, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      resolve(
        things.filter(thing =>
          thing.name
            ?.trim()
            .toLocaleLowerCase()
            .includes(name?.trim().toLowerCase())
        )
      );
    }, 1000 + 2000 * Math.random());
    signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      clearTimeout(t);
      reject(error);
    });
  });

const thingDetails = (id, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      resolve(things.find(thing => thing.id === id));
    }, 500 + 1000 * Math.random());
    signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      clearTimeout(t);
      reject(error);
    });
  });

const NotFoundPersonComponent = ({marker, markersHandlers}) => {
  const [countDown, setCountDown] = useState(4);
  const mutableRef = useRef({});
  mutableRef.current.markersHandlers = markersHandlers;
  mutableRef.current.marker = marker;
  useEffect(() => {
    const t = setInterval(() => {
      setCountDown(countDown => countDown - 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const done = countDown === 0;
  useEffect(() => {
    if (done) {
      mutableRef.current.markersHandlers.deleteMarker(
        mutableRef.current.marker
      );
    }
  }, [done]);
  return <b>Person not found! will delete in {countDown}</b>;
};

const capitalize = str =>
  str.substr(0, 1).toUpperCase() + str.substr(1).toLowerCase();

const SmartTextArea = withSmartTextArea({
  version: 0,
  classNameGetters: {
    back: ({marker}, defaultClassName) => {
      if (marker.type === 'combined' && marker.partsIds.type) {
        return `${defaultClassName} textarea-back-${marker.partsIds.type}-label`;
      }
      return undefined;
    },
  },
  anchors: [
    {
      anchorChar: '!',
      type: 'combined',
      parts: [
        {
          key: 'type',
          endChar: ':',
          searchOptions: {
            ResultItemComponent: ({item}) => <div>{capitalize(item)}</div>,
            loader: () => ['person', 'thing'],
            onItemSelect: ({selectedItem}) => ({
              text: capitalize(selectedItem),
              id: selectedItem,
            }),
            autoSelect: ({searchText}) => {
              switch (searchText?.trim().toLowerCase()) {
                case 'person':
                  return 'person';
                case 'thing':
                  return 'thing';
                default:
                  return undefined;
              }
            },
            getCacheKey: () => '',
          },
          detailsOptions: {
            Component: ({data}) => <h4>{capitalize(data)}</h4>,
            loader: ({id}) => id,
          },
        },
        {
          key: 'item',
          endChar: ':',
          searchOptions: {
            ResultItemComponent: props => {
              switch (props.marker.partsIds.type) {
                case 'person':
                  return <PersonSearchResultItem {...props} />;
                case 'thing':
                  return <ThingSearchResultItem {...props} />;
                default:
                  return 'Oops! Unknown type!';
              }
            },
            loader: ({searchText, partsIds: {type}}, signal) => {
              switch (type) {
                case 'person':
                  return personSearch(searchText, signal);
                case 'thing':
                  return thingSearch(searchText, signal);
                default:
                  throw new Error('Oops! Unknown type!');
              }
            },
            onItemSelect: ({
              selectedItem,
              marker: {
                partsIds: {type},
              },
            }) => {
              switch (type) {
                case 'person':
                  return {
                    text: selectedItem.name,
                    id: selectedItem.id,
                  };
                case 'thing':
                  return {
                    text: selectedItem.name,
                    id: selectedItem.id,
                  };
                default:
                  return false;
              }
            },
            getCacheKey: ({searchText, partsIds: {type}}) =>
              `${type}:${searchText?.trim().toLowerCase() || ''}`,
          },
          detailsOptions: {
            Component: props => {
              switch (props.marker.partsIds.type) {
                case 'person':
                  return <PersonDetails {...props} />;
                case 'thing':
                  return <ThingDetails {...props} />;
                default:
                  return 'Oops! Unknown type!';
              }
            },
            NotFoundComponent: props => {
              const onHide = props.onHide;
              const type = props.marker.partsIds.type;
              useEffect(() => {
                if (type === 'thing') {
                  onHide();
                }
              }, [type, onHide]);
              switch (type) {
                case 'person':
                  return <NotFoundPersonComponent {...props} />;
                case 'thing':
                  return null;
                default:
                  return 'Oops! Unknown type!';
              }
            },
            loader: ({type, item: id}, signal) => {
              switch (type) {
                case 'person':
                  return personDetails(id, signal);
                case 'thing':
                  return thingDetails(id, signal);
                default:
                  throw new Error('Oops! Unknown type!');
              }
            },
            getCacheKey: ({type, item: id}) => `${type}:${id}`,
          },
        },
      ],
    },
    {
      anchorChar: '@',
      type: 'person',
      parts: [
        {
          key: 'person',
          endChar: ':',
          searchOptions: {
            ResultItemComponent: PersonSearchResultItem,
            NoResultItemComponent: () => 'No matching people found',
            onItemSelect: ({selectedItem: person}) => ({
              text: person.name,
              id: person.id,
            }),
            loader: ({searchText: name}, signal) => personSearch(name, signal),
            getCacheKey: ({searchText: name}) =>
              name?.trim().toLowerCase() || null,
            debounceDuration: 350,
          },
          detailsOptions: {
            Component: PersonDetails,
            NotFoundComponent: NotFoundPersonComponent,
            loader: ({person: id}, signal) => personDetails(id, signal),
            getCacheKey: ({person: id}) => id,
          },
        },
      ],
    },
    {
      anchorChar: '#',
      type: 'thing',
      parts: [
        {
          key: 'thing',
          endChar: ':',
          searchOptions: {
            ResultsComponent: ({ResultListComponent, ...props}) => (
              <p>
                <h5>Found the following things:</h5>
                <ResultListComponent {...props} />
              </p>
            ),
            NoSearchComponent: () => (
              <pre>
                Write something to start the search.
                <br />
                This custom no search message is only configured for things
              </pre>
            ),
            ResultItemComponent: ThingSearchResultItem,
            onItemSelect: ({selectedItem: thing}) => ({
              text: thing.name,
              id: thing.id,
            }),
            loader: ({searchText: name}, signal) => thingSearch(name, signal),
            getCacheKey: ({searchText: name}) =>
              name?.trim().toLowerCase() || null,
            debounceDuration: 350,
          },
          detailsOptions: {
            Component: ThingDetails,
            loader: ({thing: id}, signal) => thingDetails(id, signal),
            getCacheKey: ({thing: id}) => id,
          },
        },
      ],
    },
  ],
  ErrorComponent,
  LoaderComponent,
  hideTipOnEscape: true,
});

export default SmartTextArea;
