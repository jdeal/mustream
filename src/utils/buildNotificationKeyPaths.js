import stringifyKeyPath from './stringifyKeyPath';
import exists from './exists';
import parseKeyPath from './parseKeyPath';

const buildNotificationKeyPaths = keyPath => {
  if (!exists(keyPath)) {
    keyPath = [];
  } else if (typeof keyPath === 'string') {
    keyPath = parseKeyPath(keyPath);
  }

  const keyPaths = keyPath.reduce((_keyPaths, key) => {
    const newKeyPath = _keyPaths[_keyPaths.length - 1].concat(key);
    _keyPaths.push(newKeyPath);
    return _keyPaths;
  }, [[]]);
  const stringifiedKeyPaths = keyPaths.map(keyPathArray => stringifyKeyPath(keyPathArray));
  return stringifiedKeyPaths;
};

export default buildNotificationKeyPaths;
