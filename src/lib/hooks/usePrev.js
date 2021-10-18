import {useRef} from 'react';

const usePrev = value => {
  const ref = useRef(undefined);
  const preValue = ref.current;
  ref.current = value;
  return preValue;
};

export default usePrev;
