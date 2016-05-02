import test from 'ava';

import 'babel-core/register';

import set from 'mustream/src/utils/set';

test('can set a key on an object', t => {
  const obj = {};
  set(obj, 'x', 1);
  t.is(obj.x, 1);
});
