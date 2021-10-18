const mergeRefs = (...refs) => {
  const mergedRef = element => {
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      if (typeof ref === 'function') {
        ref(element);
      } else if (typeof ref === 'string') {
        // console.log(ref, element);
      } else if (ref) {
        ref.current = element;
      }
    }
  };
  return mergedRef;
};

export default mergeRefs;
