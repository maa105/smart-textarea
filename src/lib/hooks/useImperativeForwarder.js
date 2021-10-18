import {useImperativeHandle, useRef} from 'react';

const setRef = (ref, value) => {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
};

const useImperativeForwarder = (parentImperativeRef, init, deps) => {
  const mutableRef = useRef({});
  const mergedRef = useRef({});
  const update = () => {
    const merged = {
      ...mutableRef.current.children,
      ...mutableRef.current.current,
    };
    mergedRef.current = merged;
    setRef(parentImperativeRef, merged);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useImperativeHandle(
    elem => {
      mutableRef.current.current = elem;
      update();
    },
    init,
    deps
  );
  return [
    elem => {
      mutableRef.current.children = elem;
      update();
    },
    mergedRef,
    mutableRef,
  ];
};

export default useImperativeForwarder;
