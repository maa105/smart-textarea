import {useEffect, useState} from 'react';

const useDebounceValue = (value, duration) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedValue(value);
    }, duration);
    return () => clearTimeout(t);
  }, [value, duration]);

  return debouncedValue;
};

export default useDebounceValue;
