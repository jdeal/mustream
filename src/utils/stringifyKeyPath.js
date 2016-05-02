import objectpath from 'objectpath';

const stringifyKeyPath = (keyPath) => {
  return objectpath.stringify(keyPath);
};

export default stringifyKeyPath;
