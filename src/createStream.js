import invariant from 'invariant';

import exists from './utils/exists';
import setAt from './utils/set';
import getAt from './utils/get';
import joinKeyPath from './utils/joinKeyPath';
import parseKeyPath from './utils/parseKeyPath';
import stringifyKeyPath from './utils/stringifyKeyPath';
import buildNotificationKeyPaths from './utils/buildNotificationKeyPaths';

const isRootKeyPath = keyPath => !exists(keyPath) ||
  (Array.isArray(keyPath) && keyPath.length === 0);

const createChildStream = (parentStream, parentKeyPath) => {
  const get = (childKeyPath) => {
    const fullKeyPath = joinKeyPath(parentKeyPath, childKeyPath);
    return parentStream.get(fullKeyPath);
  };

  const set = (childKeyPath, childValue) => {
    const fullKeyPath = joinKeyPath(parentKeyPath, childKeyPath);
    return parentStream.set(fullKeyPath, childValue);
  };

  const subscribe = (childKeyPath, handler) => {
    if (typeof childKeyPath === 'function') {
      handler = childKeyPath;
      childKeyPath = undefined;
    }
    const fullKeyPath = joinKeyPath(parentKeyPath, childKeyPath);
    return parentStream.subscribe(fullKeyPath, handler);
  };

  const childStream = {
    get,
    set,
    subscribe
  };

  childStream.at = childKeyPath => createChildStream(
    parentStream,
    joinKeyPath(parentKeyPath, childKeyPath)
  );

  return childStream;
};

const createStream = () => {
  let currentValue = null;

  const get = (keyPath) => {
    return getAt(currentValue, keyPath);
  };

  const subscribers = [];
  const subscriberPaths = [];
  const pathToSubscribers = {};

  const set = (keyPath, newValue) => {

    invariant(Array.isArray(keyPath) || typeof keyPath === 'string',
      'set requires array or string for key path'
    );

    if (isRootKeyPath(keyPath)) {
      currentValue = newValue;
    } else {
      setAt(currentValue, keyPath, newValue);
    }

    const notificationKeyPaths = buildNotificationKeyPaths(keyPath);

    //console.log(notificationKeyPaths)

    notificationKeyPaths.forEach(notificationKeyPath => {
      const keyPathSubscribers = pathToSubscribers[notificationKeyPath];
      //console.log(keyPathSubscribers);
      if (keyPathSubscribers) {
        keyPathSubscribers.forEach(subscriber => {
          const nullOrKeyPath = keyPath === '' ? null : keyPath;
          subscriber(getAt(currentValue, nullOrKeyPath));
        });
      }
    });
  };

  const subscribe = (keyPath, handler) => {

    if (typeof keyPath === 'function') {
      handler = keyPath;
      keyPath = undefined;
    }

    invariant(typeof handler === 'function',
      'Subscription handler should be a function.'
    );

    if (!exists(keyPath)) {
      keyPath = [];
    }

    invariant(Array.isArray(keyPath) || typeof keyPath === 'string',
      'subscribe requires array or string for key path'
    );

    keyPath = Array.isArray(keyPath) ? keyPath : parseKeyPath(keyPath);

    keyPath = stringifyKeyPath(keyPath);

    let isSubscribed = true;

    subscribers.push(handler);
    subscriberPaths.push(keyPath);
    pathToSubscribers[keyPath] = pathToSubscribers[keyPath] || [];
    pathToSubscribers[keyPath].push(handler);

    return () => {
      if (!isSubscribed) {
        return false;
      }

      isSubscribed = false;

      const index = subscribers.indexOf(handler);
      subscribers.splice(index, 1);
      subscriberPaths.splice(index, 1);
      const pathIndex = pathToSubscribers[keyPath].indexOf(handler);
      pathToSubscribers[keyPath].splice(pathIndex, 1);
      if (pathToSubscribers[keyPath].length === 0) {
        delete pathToSubscribers[keyPath];
      }

      return undefined;
    };
  };

  const stream = {
    get,
    set,
    subscribe
  };

  stream.at = keyPath => createChildStream(stream, keyPath);

  return stream;
};

export default createStream;
