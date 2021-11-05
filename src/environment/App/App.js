import React, {useRef, useState} from 'react';
import classes from './App.module.css';
import SmartTextArea, {people, things} from './SmartTextArea';

const availablePpl = people.map(person => person.name).join(', ');
const availableThings = things.map(thing => thing.name).join(', ');
const App = () => {
  const [markers, setMarkers] = useState([]);
  const [inEditMarker, setInEditMarker] = useState([]);
  const imperativeRef = useRef();
  return (
    <div className={classes.container}>
      <ul>
        <li>
          use <b>!</b> to trigger mixed marker start. Here you first need to
          select a type (person/thing), then select the item you want.
          <ul>
            <li>
              Available people:
              <br />
              {availablePpl}
            </li>
            <li>
              Available things:
              <br />
              {availableThings}
            </li>
            <li>
              Mixed marker has autoSelect enabled on its first part (the type
              part). to test it out try writing &quot;!person&quot; and it
              should automatically select the person type.
            </li>
            <li>
              if selected type is thing the color of the marker will be orange,
              else it will default to gray
            </li>
            <li>
              All mixed markers will have a custom gray border (actually its an
              outline)
            </li>
          </ul>
        </li>
        <li>
          use <b>@</b> to trigger person marker start. Available people to
          search same as above.
          <br />
          people marker color is the default gray color
        </li>
        <li>
          use <b>#</b> to trigger things marker start. Available things to
          search same as above.
          <br />
          things marker color is a custom orange color
        </li>
      </ul>
      <SmartTextArea
        className="smart-text-area"
        imperativeRef={imperativeRef}
        initValue={
          'Mohammad Amin is the author of this component\nJohn Doe is a generic male name\nJane Doe is a generic female name\nasdfg is a name not in our database\n\nFork, Knife and Spoon are kitchen utensils we eat with'
        }
        initMarkers={[
          {
            start: 0,
            end: 13,
            type: 'combined',
            partsIds: {type: 'person', item: 'mo'},
          },
          {start: 46, end: 54, type: 'person', partsIds: {person: 'john'}},
          {start: 78, end: 86, type: 'person', partsIds: {person: 'jane'}},
          {start: 112, end: 117, type: 'person', partsIds: {person: 'asdfg'}},
          {start: 149, end: 153, type: 'thing', partsIds: {thing: 'fork'}},
          {
            start: 155,
            end: 160,
            type: 'combined',
            partsIds: {type: 'thing', item: 'knife'},
          },
          {start: 165, end: 170, type: 'thing', partsIds: {thing: 'spoon'}},
        ]}
        onMarkersChange={e => {
          setMarkers(e.markers);
        }}
        onInEditMarkerChange={e => {
          setInEditMarker(e.markers[e.inEditMarkerIndex]);
        }}
      />
      <p>
        <h5>Markers:</h5>
        <pre>
          {markers.map(marker => (
            <div
              className={
                marker.uuid === inEditMarker?.uuid ? classes.inEditMarker : ''
              }>
              {JSON.stringify(marker, null, 3)}
            </div>
          ))}
        </pre>
      </p>
    </div>
  );
};

export default App;
