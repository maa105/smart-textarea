const doesItemMatchSearch = (item, searchText) => {
  const searchTextLowerCased = searchText.toLowerCase();
  if (typeof item === 'string') {
    return item.toLowerCase().includes(searchTextLowerCased);
  }
  // eslint-disable-next-line guard-for-in
  for (const i in item) {
    const val = item[i];
    switch (typeof val) {
      case 'string':
        if (val.toLowerCase().includes(searchTextLowerCased)) {
          return true;
        }
        break;
      default:
        break;
    }
  }
  return false;
};
const searchArray = (array, searchText) =>
  array.filter(item => doesItemMatchSearch(item, searchText));

export default searchArray;
