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
      error.aborted = true;
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
      error.aborted = true;
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
      error.aborted = true;
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
      error.aborted = true;
      clearTimeout(t);
      reject(error);
    });
  });

const NotFoundPersonComponent = ({updateMarker}) => {
  const [countDown, setCountDown] = useState(4);
  const updateMarkerRef = useRef();
  updateMarkerRef.current = updateMarker;
  useEffect(() => {
    const t = setInterval(() => {
      setCountDown(countDown => countDown - 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const done = countDown === 0;
  useEffect(() => {
    if (done) {
      updateMarkerRef.current(null);
    }
  }, [done]);
  return <b>Person not found! will delete in {countDown}</b>;
};

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
      ],
      searchOptions: {
        ResultItemComponent: PersonSearchResultItem,
        NoResultItemComponent: () => 'No matching people found',
        resultItemComponentOnSelect: ({selectedItem: person}) => ({
          textValue: person.name,
          markerData: {
            id: person.id,
          },
        }),
        loader: ({name}, signal) => personSearch(name, signal),
        getCacheKey: ({name}) => name?.trim().toLowerCase() || null,
        debounceDuration: 350,
      },
      detailsOptions: {
        Component: PersonDetails,
        NotFoundComponent: NotFoundPersonComponent,
        loader: ({id}, signal) => personDetails(id, signal),
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
        ResultsComponent: ({ResultListComponent, ...props}) => (
          <p>
            <h5>Found the following things:</h5>
            <ResultListComponent {...props} />
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
  ErrorComponent,
  LoaderComponent,
  hideTipOnEscape: true,
});

export default SmartTextArea;
