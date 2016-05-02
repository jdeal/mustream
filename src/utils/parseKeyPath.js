import objectpath from 'objectpath';

const parseKeyPath = (keyPath) => {
  if (keyPath === '') {
    return [''];
  }
  return objectpath.parse(keyPath);
};

export default parseKeyPath;
