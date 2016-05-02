import invariant from 'invariant';

import exists from './exists';
import parseKeyPath from './parseKeyPath';

const joinKeyPath = (parentKeyPath, childKeyPath) => {
  if (!exists(parentKeyPath)) {
    return childKeyPath;
  }
  if (!exists(childKeyPath)) {
    return parentKeyPath;
  }
  invariant(typeof parentKeyPath === 'string' || Array.isArray(parentKeyPath),
    'joinKeyPath requires parent key path to be a string or array'
  );
  invariant(typeof childKeyPath === 'string' || Array.isArray(childKeyPath),
    'joinKeyPath requires child key path to be a string or array'
  );
  parentKeyPath = Array.isArray(parentKeyPath) ? parentKeyPath : parseKeyPath(parentKeyPath);
  childKeyPath = Array.isArray(childKeyPath) ? childKeyPath : parseKeyPath(childKeyPath);
  return parentKeyPath.concat(childKeyPath);
};

export default joinKeyPath;
