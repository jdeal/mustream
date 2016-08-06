import objectpath from 'objectpath';

import parseKeyPath from './parseKeyPath';

const stringifyKeyPath = (keyPath) => {
  keyPath = Array.isArray(keyPath) ? keyPath : parseKeyPath(keyPath);
  return objectpath.stringify(keyPath);
};

export default stringifyKeyPath;
