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

const normalizeSubscriptionArgs = (keyPath, handler, name = 'subscribe') => {
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
    `${name} requires array or string for key path`
  );

  return [keyPath, handler];
};

const createTrackable = (get, parentKeyPath, hotSet) => {
  return (childKeyPath) => {
    childKeyPath = Array.isArray(childKeyPath) ? childKeyPath : parseKeyPath(childKeyPath);
    childKeyPath = stringifyKeyPath(childKeyPath);
    const keyPath = joinKeyPath(parentKeyPath, childKeyPath);
    hotSet[keyPath] = true;
    return get(keyPath);
  };
};

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

  const autoSubscribe = (childKeyPath, handler) => {
    if (typeof childKeyPath === 'function') {
      handler = childKeyPath;
      childKeyPath = undefined;
    }
    const fullKeyPath = joinKeyPath(parentKeyPath, childKeyPath);
    return parentStream.autoSubscribe(fullKeyPath, handler);
  };

  const childStream = {
    get,
    set,
    subscribe,
    autoSubscribe
  };

  childStream.at = childKeyPath => createChildStream(
    parentStream,
    joinKeyPath(parentKeyPath, childKeyPath)
  );

  return childStream;
};

const createStream = (_computations = {}) => {
  let currentValue = null;
  const computedValues = {};
  const computations = {};

  Object.keys(_computations).forEach(computationKey => {
    computations[stringifyKeyPath(computationKey)] = _computations[computationKey];
  });

  let get;
  let subscribe;
  let autoSubscribe;

  const pathToSubscribers = {};

  const hasComputation = computationPath => (
    computationPath in computations &&
    typeof computations[computationPath] === 'function'
  );

  const hasHotComputation = computationPath => (
    // If we have a cached value, then it's hot.
    computationPath in computedValues
  );

  // Get value or cached computed value at path.
  const getValueAt = keyPath => {
    const nullOrKeyPath = keyPath === '' ? null : keyPath;
    const value = getAt(currentValue, nullOrKeyPath);
    if (typeof value !== 'undefined') {
      return value;
    }
    return computedValues[keyPath];
  };

  const notifySubscribers = keyPath => {
    keyPath = stringifyKeyPath(keyPath);

    const notificationPaths = buildNotificationKeyPaths(keyPath);

    const prefixedNotificationPaths = notificationPaths
      .map(notificationPath => `self::${notificationPath}`)
      .concat(`children::${notificationPaths[notificationPaths.length - 1]}`);

    prefixedNotificationPaths.forEach(notificationPath => {
      const keyPathSubscribers = pathToSubscribers[notificationPath];
      if (keyPathSubscribers) {
        keyPathSubscribers.forEach(subscriber => {
          subscriber(getValueAt(keyPath));
        });
      }
    });
  };

  const heatUpComputation = computationPath => {
    if (hasHotComputation(computationPath)) {
      return;
    }
    const computation = computations[computationPath];

    let isComputed = false;

    const unsubscribe = autoSubscribe(computationGet => {
      // First time, we're just getting the computed value and letting
      // autoSubscribe warm up.
      if (!isComputed) {
        computedValues[computationPath] = computation(computationGet);
        isComputed = true;
        return;
      }
      const prefixedComputationPath = `self::${computationPath}`;
      // After that, notify subscribers if there are any. Otherwise, just drop
      // the cache.
      if (pathToSubscribers[prefixedComputationPath]) {
        computedValues[computationPath] = computation(computationGet);
        notifySubscribers(computationPath);
      } else {
        unsubscribe();
        delete computedValues[computationPath];
      }
    });
  };

  subscribe = (_keyPath, _handler) => {

    let [keyPath, handler] = normalizeSubscriptionArgs(_keyPath, _handler);

    keyPath = Array.isArray(keyPath) ? keyPath : parseKeyPath(keyPath);

    keyPath = stringifyKeyPath(keyPath);

    const notificationPaths = buildNotificationKeyPaths(keyPath);

    const prefixedNotificationPaths = notificationPaths
      .slice(0, notificationPaths.length - 1)
      .map(notificationPath => `children::${notificationPath}`)
      .concat(`self::${notificationPaths[notificationPaths.length - 1]}`);

    let isSubscribed = true;

    //subscribers.push(handler);
    //subscriberPaths.push(keyPath);
    prefixedNotificationPaths.forEach(notificationPath => {
      pathToSubscribers[notificationPath] = pathToSubscribers[notificationPath] || [];
      pathToSubscribers[notificationPath].push(handler);
    });

    if (hasComputation(keyPath)) {
      heatUpComputation(keyPath);
    }

    return () => {
      // Don't try to unsubscribe twice.
      if (!isSubscribed) {
        return false;
      }

      isSubscribed = false;

      //const index = subscribers.indexOf(handler);
      //subscribers.splice(index, 1);
      //subscriberPaths.splice(index, 1);
      prefixedNotificationPaths.forEach(notificationPath => {
        const pathIndex = pathToSubscribers[notificationPath].indexOf(handler);
        pathToSubscribers[notificationPath].splice(pathIndex, 1);
        if (pathToSubscribers[notificationPath].length === 0) {
          delete pathToSubscribers[notificationPath];
        }
      });

      return undefined;
    };
  };

  get = (keyPath) => {
    const value = getAt(currentValue, keyPath);
    if (typeof value === 'undefined') {
      const computationPath = stringifyKeyPath(keyPath);
      if (hasComputation(computationPath)) {
        heatUpComputation(computationPath);
        return computedValues[computationPath];
      }
    }
    return value;
  };

  const set = (keyPath, newValue) => {

    invariant(Array.isArray(keyPath) || typeof keyPath === 'string',
      'set requires array or string for key path'
    );

    if (isRootKeyPath(keyPath)) {
      currentValue = newValue;
    } else {
      setAt(currentValue, keyPath, newValue);
    }

    notifySubscribers(keyPath);
  };

  autoSubscribe = (_parentKeyPath, _doSideEffect) => {

    let [parentKeyPath, doSideEffect] = normalizeSubscriptionArgs(_parentKeyPath, _doSideEffect, 'autoSubscribe');

    const hotKeyPathSubscriptions = {};

    const onChange = () => {
      const newHotKeyPathSet = {};
      const getAndTrack = createTrackable(get, parentKeyPath, newHotKeyPathSet);
      doSideEffect(getAndTrack);
      // Subscribe to new hot keyPaths.
      Object.keys(newHotKeyPathSet).forEach(keyPath => {
        if (!hotKeyPathSubscriptions[keyPath]) {
          hotKeyPathSubscriptions[keyPath] = subscribe(keyPath, onChange);
        }
      });
      // Unsubscribe from now cold keyPaths.
      Object.keys(hotKeyPathSubscriptions).forEach(keyPath => {
        if (!newHotKeyPathSet[keyPath]) {
          hotKeyPathSubscriptions[keyPath]();
        }
      });
    };

    onChange();

    // unsubscribe
    return () => {
      Object.keys(hotKeyPathSubscriptions).forEach(keyPath => {
        hotKeyPathSubscriptions[keyPath]();
      });
    };
  };

  const stream = {
    get,
    set,
    subscribe,
    autoSubscribe
  };

  stream.at = keyPath => createChildStream(stream, keyPath);

  return stream;
};

export default createStream;
