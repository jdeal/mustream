import invariant from 'invariant';

import exists from './exists';
import parseKeyPath from './parseKeyPath';

const set = (thing, keys, value) => {
  if (thing === null || (typeof thing !== 'object' && typeof thing !== 'function')) {
    throw new Error('Must use set on an object or function.');
  }
  if (typeof keys === 'string') {
    keys = parseKeyPath(keys);
  }
  invariant(Array.isArray(keys), 'set expects array or string for key path');
  invariant(keys.length > 0, 'set expects at least one key');

  for (let keyIndex = 0; keyIndex < keys.length - 1; keyIndex++) {
    const key = keys[keyIndex];
    const subThing = thing[key];
    if (!exists(subThing) || (typeof subThing !== 'object' && typeof subThing !== 'function')) {
      thing[key] = {};
    }
    thing = thing[key];
  }

  thing[keys[keys.length - 1]] = value;
};

export default set;
