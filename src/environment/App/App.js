import React, {useState} from 'react';
import classes from './App.module.css';
import SmartTextArea, {people, things} from './SmartTextArea';

const availablePpl = people.map(person => person.name).join(', ');
const availableThings = things.map(thing => thing.name).join(', ');
const App = () => {
  const [markers, setMarkers] = useState([]);
  const [inEditMarker, setInEditMarker] = useState([]);
  return (
    <div className={classes.container}>
      <ul>
        <li>
          use @ to trigger person marker start. Available people to search:
          <ul>
            <li>{availablePpl}</li>
          </ul>
          people marker color is the default gray color
        </li>
        <li>
          use # to trigger things marker start. Available things to search:
          <ul>
            <li>{availableThings}</li>
          </ul>
          things marker color is a custom orange color
        </li>
      </ul>
      <SmartTextArea
        className="smart-text-area"
        initValue={
          'Mohammad Amin is the author of this component\nJohn Doe is a generic male name\nJane Doe is a generic female name\nasdfg is a name not in our database\n\nFork, Knife and Spoon are kitchen utensils we eat with'
        }
        initMarkers={[
          {start: 0, end: 13, type: 'person', markerData: {id: 'mo'}},
          {start: 46, end: 54, type: 'person', markerData: {id: 'john'}},
          {start: 78, end: 86, type: 'person', markerData: {id: 'jane'}},
          {start: 112, end: 117, type: 'person', markerData: {id: 'asdfg'}},
          {start: 149, end: 153, type: 'thing', markerData: {id: 'fork'}},
          {start: 155, end: 160, type: 'thing', markerData: {id: 'knife'}},
          {start: 165, end: 170, type: 'thing', markerData: {id: 'spoon'}},
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
