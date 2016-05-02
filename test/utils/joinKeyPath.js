import test from 'ava';

import 'babel-core/register';

import joinKeyPath from 'mustream/src/utils/joinKeyPath';

test('join two nulls', t => {
  const keyPath = joinKeyPath(null, null);
  t.is(keyPath, null);
});

test('join null and string', t => {
  const keyPath = joinKeyPath(null, 'x');
  t.is(keyPath, 'x');
});

test('join string and null', t => {
  const keyPath = joinKeyPath('x', null);
  t.is(keyPath, 'x');
});

test('join null and array', t => {
  const keyPath = joinKeyPath(null, ['x']);
  t.deepEqual(keyPath, ['x']);
});

test('join array and null', t => {
  const keyPath = joinKeyPath(['x'], null);
  t.deepEqual(keyPath, ['x']);
});

test('join string and string', t => {
  const keyPath = joinKeyPath('x', 'y');
  t.deepEqual(keyPath, ['x', 'y']);
});
